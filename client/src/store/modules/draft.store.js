import TreeModel from 'tree-model';

import * as surveyStackUtils from '@/utils/surveyStack';
import * as codeEvaluator from '@/utils/codeEvaluator';
import * as db from '@/store/db';
import { get } from 'lodash';
import api from '@/services/api.service';
import Vue from 'vue';

/*
  README:
  This draft store uses TreeModel https://github.com/joaonuno/tree-model-js
  for creating a tree model of the current survey controls (a.k.a questions).

  The current survey controls are dependant on the survey version and located inside the survey.revisions.
  Survey controls are an array containing controls for questions such as String/Number/etc.
  If the control type is of type 'group' or 'page', it may contain other nested controls as children.

  By using a tree model of the survey controls, we can traverse the tree more easily,
  and make use of utilities such as .getPath(), .parent, .hasChildren(), etc.

  NOTE: The tree model is ONLY used for the hierarchical survey controls, not for the submission object (see below).

  When filling out a survey, the answered questions are stored inside a 'submission' object under the data property.

  Example:

  Survey definition with survey controls defining the questions:
  controls = [
    { type: 'string', name: 'favorite_animal' },
    { type: 'group',
      name: 'address',
      children: [
        { type: 'string', name: 'city' },
        { type: 'number', name: 'postal' },
      ]
    }
  ];

  Submission object containing the filled out questions under the data property:
  submission = {
    meta: {...},
    data: {
      favorite_animal: { value: 'cat' },
      address: {
        city: { value: 'Baden' },
        postal: { value: 5400 },
      }
    }
  }

  When traversing the survey controls, one can determine the corresponding 'path' inside the submission object like this:
  > node.getPath().map(n => n.model.name).join('.');
  For instance, with the current node being 'city', the corresponding path will be 'data.address.city'.
  To get the actual value, one would append '.value', so that the full path is 'data.address.city.value'.
  (the survey controls' tree model root node is initialized with name 'data', and thus the determined path above will start with 'data.')

*/

const createInitialState = () => ({
  survey: null, // current survey
  submission: null, // current submission
  root: null, // root node starting from current survey controls
  node: null, // node with model pointing to current survey control
  firstNode: null,
  showOverview: false,
  showConfirmSubmission: false,
  errors: null,
  persist: false,
  farmOsCache: {}, // Cache for farmos resources, should be reset when survey starts
});

const initialState = createInitialState();

const getters = {
  survey: (state) => state.survey,
  submission: (state) => state.submission,
  property: (state) => (path, fallback) => get(state.submission, path, fallback),
  control: (state) => state.node && state.node.model, // current survey control
  path: (state) =>
    state.node
      ? state.node
          .getPath()
          .map((n) => n.model.name)
          .join('.')
          .replace('[', '.')
          .replace(']', '')
      : null,

  atStart: (state) => state.node === state.firstNode,
  showOverview: (state) => state.showOverview,
  showConfirmSubmission: (state) => state.showConfirmSubmission,
  questionNumber: (state) => {
    if (!state.node) {
      return;
    }
    const n = state.node
      .getPath()
      .map((node) => node.getIndex() + 1)
      .slice(1)
      .join('.');
    return n;
  },
  groupPath: (state) => {
    if (state.submission && state.submission.meta && state.submission.meta.group && state.submission.meta.group.path) {
      return state.submission.meta.group.path;
    }
    if (state.survey && state.survey.meta && state.survey.meta.group && state.survey.meta.group.path) {
      return state.survey.meta.group.path;
    }

    return null;
  },
  relevance:
    (state) =>
    (path, fallback = true) =>
      surveyStackUtils.getRelevance(state.submission, path, fallback),
  hasRequiredUnanswered: (state) => {
    if (state.node.hasChildren()) {
      const requiredAndUnansweredPaths = [];
      state.node.walk((c) => {
        const path = c
          .getPath()
          .map((n) => n.model.name)
          .join('.');

        if (c.model.options.required && !surveyStackUtils.isAnswered(c, state.submission)) {
          requiredAndUnansweredPaths.push(path);
        }
      });

      // eslint-disable-next-line no-restricted-syntax
      for (const path of requiredAndUnansweredPaths) {
        const relevant = surveyStackUtils.getRelevance(state.submission, path, true);
        if (relevant) {
          return true;
        }
      }

      return false;
    }

    const { required } = state.node.model.options;

    if (required && !surveyStackUtils.isAnswered(state.node, state.submission)) {
      return true;
    }

    return false;
  },
  overviews: (state) => {
    const overviews = [];
    state.root.walk((node) => {
      if (node.isRoot()) {
        return true;
      }
      const path = node
        .getPath()
        .map((n) => n.model.name)
        .join('.');
      const control = node.model;
      overviews.push({ node, path, control });
      return true;
    });
    return overviews;
  },
  errors: (state) => state.errors,
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  async init({ commit, dispatch }, { survey, submission, persist }) {
    await commit('INIT', { survey, submission, persist });
    await dispatch('calculateRelevance');
    await dispatch('next');
  },
  setProperty({ commit, dispatch, state }, { path, value, calculate = true }) {
    commit('SET_PROPERTY', { path, value });
    if (state.persist) {
      try {
        db.persistSubmission(state.submission);
      } catch (err) {
        console.warn('unable to persist submission to IDB');
      }
    }
    if (calculate) {
      dispatch('calculateRelevance');
    }
  },
  async next({ commit, state, dispatch }) {
    dispatch('calculateApiCompose');

    const traversal = [];
    state.root.walk((node) => {
      traversal.push(node);
      return true;
    });

    // when state.node is not set, this is the initial step
    // setting the index to 0 will let the next loop to select the first relevant node
    let index = state.node ? traversal.indexOf(state.node) : 0;
    if (index < 0) {
      return;
    }

    while (++index < traversal.length) {
      const nextNode = traversal[index];

      const [relevance] = await codeEvaluator.calculateRelevance([nextNode], state.submission, state.survey); // eslint-disable-line
      const { result, path, skip } = relevance;
      if (!skip && !!path) {
        commit('SET_PROPERTY', { path: `${path}.meta.relevant`, value: result });
        if (!result) {
          continue;
        }
      }

      const hasIrrelevantParents = nextNode
        .getPath()
        .slice(1)
        .slice(0, -1)
        .some((parent) => {
          const parentPath = parent
            .getPath()
            .map((n) => n.model.name)
            .join('.');
          if (!get(state.submission, `${parentPath}.meta.relevant`, true)) {
            return true;
          }
          return false;
        });

      if (hasIrrelevantParents) {
        continue;
      }

      const isGroup = nextNode.model.type === 'group';
      if (isGroup) {
        continue;
      }

      const isPage = nextNode.model.type === 'page';
      if (isPage) {
        let skipPage = await actions.isSkipPage(commit, index, traversal, state);
        if (skipPage) {
          continue;
        }
      }

      const isInsidePage = nextNode
        .getPath()
        .slice(1)
        .slice(0, -1)
        .find((parent) => parent.model.type === 'page');
      if (isInsidePage) {
        continue;
      }

      commit('NEXT', nextNode);
      return;
    }

    commit('SHOW_OVERVIEW', true);
  },
  async prev({ commit, state }) {
    const traversal = [];
    state.root.walk((node) => {
      if (node.isRoot()) {
        return true;
      }
      traversal.push(node);
      return true;
    });

    let index = traversal.indexOf(state.node);
    if (index < 0) {
      return;
    }

    while (--index >= 0) {
      const prevNode = traversal[index];

      const [relevance] = await codeEvaluator.calculateRelevance([prevNode], state.submission, state.survey); // eslint-disable-line
      const { result, path, skip } = relevance;
      if (!skip && !!path) {
        commit('SET_PROPERTY', { path: `${path}.meta.relevant`, value: result });
        if (!result) {
          continue;
        }
      }

      const hasIrrelevantParents = prevNode
        .getPath()
        .slice(1)
        .slice(0, -1)
        .some((parent) => {
          const parentPath = parent
            .getPath()
            .map((n) => n.model.name)
            .join('.');
          if (!get(state.submission, `${parentPath}.meta.relevant`, true)) {
            return true;
          }
          return false;
        });

      if (hasIrrelevantParents) {
        continue;
      }

      const isGroup = prevNode.model.type === 'group';
      if (isGroup) {
        continue;
      }

      const isPage = prevNode.model.type === 'page';
      if (isPage) {
        let skipPage = await actions.isSkipPage(commit, index, traversal, state);
        if (skipPage) {
          continue;
        }
      }

      const isInsidePage = prevNode
        .getPath()
        .slice(1)
        .slice(0, -1)
        .find((parent) => parent.model.type === 'page');
      if (isInsidePage) {
        continue;
      }

      commit('PREV', prevNode);
      return;
    }
  },
  goto({ commit }, path) {
    commit('GOTO', path);
  },
  showOverview({ commit, dispatch }, show) {
    dispatch('calculateApiCompose');
    commit('SHOW_OVERVIEW', show);
  },
  showConfirmSubmission({ commit }, show) {
    commit('SHOW_CONFIRM_SUBMISSION', show);
  },
  async isSkipPage(commit, index, traversal, state) {
    let i = index + 1;
    let skipPage = true;

    // lookahead
    while (i < traversal.length) {
      const lookahead = traversal[i++];
      const isInsidePage = lookahead
        .getPath()
        .slice(1)
        .slice(0, -1)
        .find((parent) => parent.model.type === 'page');
      if (!isInsidePage) {
        break;
      }
      const [relevance] = await codeEvaluator.calculateRelevance([lookahead], state.submission, state.survey); // eslint-disable-line
      const { result: innerResult, path: innerPath, skip: innerSkip } = relevance;

      if (!innerSkip) {
        commit('SET_PROPERTY', { path: `${innerPath}.meta.relevant`, value: innerResult });
        if (innerResult) {
          skipPage = false;
          break;
        }
      } else {
        skipPage = false;
        break;
      }
    }

    return skipPage;
  },
  async calculateRelevance({ commit, state }) {
    // TODO: only calculate subset of nodes
    const nodes = surveyStackUtils.getAllNodes(state.root);
    const calculations = await codeEvaluator.calculateRelevance(nodes, state.submission, state.survey);
    calculations.forEach((calculation) => {
      const { result, path, skip } = calculation;
      if (!skip && !!path) {
        commit('SET_PROPERTY', { path: `${path}.meta.relevant`, value: result });
        // commit('SET_PROPERTY', { path: `${path}.meta.computedRelevance`, value: result }); // TODO: set computedRelevance as well?
      }
    });
  },
  async calculateApiCompose({ commit, state }) {
    // TODO: only calculate subset of nodes
    const nodes = surveyStackUtils.getAllNodes(state.root);
    const apiCompositions = await codeEvaluator.calculateApiCompose(nodes, state.submission, state.survey);
    const errors = [];
    apiCompositions.forEach((apiComposition) => {
      const { result, path, skip, error, clear } = apiComposition;
      if (error) {
        errors.push({ path, error });
      }
      if (!skip && !!path) {
        commit('SET_PROPERTY', { path: `${path}.meta.apiCompose`, value: result });
      }

      if (clear && !!path) {
        commit('SET_PROPERTY', { path: `${path}.meta.apiCompose`, value: null });
      }
    });
    if (errors.length > 0) {
      commit('SET_ERRORS', errors);
    } else {
      commit('SET_ERRORS', null);
    }
  },
  async getFarmOsResource({ commit, state }, type) {
    let resource = state.farmOsCache[type];

    const url = {
      farms: 'farmos/farms',
      assets: 'farmos/assets?bundle=land',
      plant: 'farmos/assets?bundle=plant',
    }[type];

    if (!resource && url) {
      const response = await api.get(url);
      resource = type === 'farms' ? response.data : response.data.assets;
      commit('SET_FARMOS_RESOURCE', { type, resource });
    }

    return resource;
  },
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  INIT(state, { survey, submission, persist }) {
    Object.assign(state, createInitialState());

    state.survey = survey;
    state.submission = submission;
    state.persist = persist;

    state.showOverview = false;
    state.showConfirmSubmission = false;
    const { controls } = state.survey.revisions.find((revision) => revision.version === submission.meta.survey.version);

    const tree = new TreeModel();
    const root = tree.parse({ name: 'data', children: controls });
    state.root = root;

    // possible node alteration
    root
      .all((n) => !!n.parent && n.parent.model.type === 'page')
      .forEach((node) => {
        // node.drop();
      });
  },
  SET_PROPERTY(state, { path, value }) {
    const keys = path.split('.');
    const childKey = keys.pop();
    const parent = get(state.submission, keys, null);
    if (!parent) {
      throw new Error(`Trying to set property for the invalid path: ${path}`);
    }

    Vue.set(parent, childKey, value);
  },
  NEXT(state, node) {
    // console.log('next', node, state);
    state.node = node;
    // if firstNode is not set, this is the initial step and the given node is the first node
    if (!state.firstNode) {
      state.firstNode = node;
    }
  },
  PREV(state, node) {
    // console.log('prev', node, state);
    state.node = node;
  },
  GOTO(state, path) {
    state.root.walk((node) => {
      const currentPath = node
        .getPath()
        .map((n) => n.model.name)
        .join('.');
      if (currentPath === path) {
        const parents = node.getPath();
        for (let i = 0; i < parents.length; i++) {
          const parent = parents[i];
          if (parent.model.type === 'page') {
            state.node = parent;
            return false;
          }
        }

        state.node = node;
        return false;
      }
      return true;
    });
  },
  SHOW_OVERVIEW(state, show) {
    state.showOverview = show;
  },
  SHOW_CONFIRM_SUBMISSION(state, show) {
    state.showConfirmSubmission = show;
  },
  SET_FARMOS_RESOURCE(state, { type, resource }) {
    Vue.set(state.farmOsCache, type, resource);
  },
  SET_ERRORS(state, errors) {
    state.errors = errors;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
