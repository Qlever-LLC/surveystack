import TreeModel from 'tree-model';

import * as surveyStackUtils from '@/utils/surveyStack';
import * as codeEvaluator from '@/utils/codeEvaluator';
import * as db from '@/store/db';

const createInitialState = () => ({
  survey: null, // current survey
  submission: null, // current submission
  persist: false,
  root: null, // root node starting from current survey controls
  node: null, // node with model pointing to current survey control
  firstNode: null,
  showOverview: false,
  showConfirmSubmission: false,
  errors: null,
});

const initialState = createInitialState();

const getters = {
  survey: state => state.survey,
  submission: state => state.submission,
  property: state => (path, fallback) => surveyStackUtils.getNested(state.submission, path, fallback),
  control: state => state.node && state.node.model, // current survey control
  path: (state) => {
    const p = state.node.getPath().map(n => n.model.name).join('.');
    return p;
  },
  atStart: state => state.node === state.firstNode,
  showOverview: state => state.showOverview,
  showConfirmSubmission: state => state.showConfirmSubmission,
  questionNumber: (state) => {
    const n = state.node.getPath().map(node => node.getIndex() + 1).slice(1).join('.');
    return n;
  },
  groupPath: (state) => {
    if (state.submission.meta && state.submission.meta.group && state.submission.meta.group.path) {
      return state.submission.meta.group.path;
    }
    if (state.survey.meta && state.survey.meta.group && state.survey.meta.group.path) {
      return state.survey.meta.group.path;
    }

    return null;
  },
  overviews: (state) => {
    const overviews = [];
    state.root.walk((node) => {
      if (node.isRoot()) {
        return true;
      }
      const path = node.getPath().map(n => n.model.name).join('.');
      const control = node.model;
      overviews.push({ node, path, control });
      return true;
    });
    return overviews;
  },
  errors: state => state.errors,
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  init({ commit, dispatch }, { survey, submission, persist }) {
    console.log('draft.store:action:init');
    commit('INIT', { survey, submission, persist });
    dispatch('calculateRelevance');
  },
  setProperty({ commit, dispatch, state }, { path, value, calculate = true }) {
    commit('SET_PROPERTY', { path, value });
    if (state.persist) {
      db.persistSubmission(state.submission);
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

    let index = traversal.indexOf(state.node);
    if (index < 0) {
      return;
    }

    while (++index < traversal.length) {
      const nextNode = traversal[index];

      const [relevance] = await codeEvaluator.calculateRelevance([nextNode], state.submission, state.survey); // eslint-disable-line
      const { result, path, skip } = relevance;
      if (!skip) {
        commit('SET_PROPERTY', { path: `${path}.meta.relevant`, value: result });
      }

      const hasIrrelevantParents = nextNode.getPath().slice(1).slice(0, -1).some((parent) => {
        const parentPath = parent.getPath().map(n => n.model.name).join('.');
        if (!surveyStackUtils.getNested(state.submission, `${parentPath}.meta.relevant`, true)) {
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

      const isInsidePage = nextNode.getPath().slice(1).slice(0, -1).find(parent => parent.model.type === 'page');
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
      if (!skip) {
        commit('SET_PROPERTY', { path: `${path}.meta.relevant`, value: result });
      }

      const hasIrrelevantParents = prevNode.getPath().slice(1).slice(0, -1).some((parent) => {
        const parentPath = parent.getPath().map(n => n.model.name).join('.');
        if (!surveyStackUtils.getNested(state.submission, `${parentPath}.meta.relevant`, true)) {
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

      const isInsidePage = prevNode.getPath().slice(1).slice(0, -1).find(parent => parent.model.type === 'page');
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
  showOverview({ commit }, show) {
    commit('SHOW_OVERVIEW', show);
  },
  showConfirmSubmission({ commit }, show) {
    commit('SHOW_CONFIRM_SUBMISSION', show);
  },
  async calculateRelevance({ commit, state }) {
    // TODO: only calculate subset of nodes
    const nodes = surveyStackUtils.getAllNodes(state.root);
    const calculations = await codeEvaluator.calculateRelevance(nodes, state.submission, state.survey);
    calculations.forEach((calculation) => {
      const { result, path, skip } = calculation;
      // TODO: set computedRelevance as well
      if (!skip) {
        commit('SET_PROPERTY', { path: `${path}.meta.relevant`, value: result });
      }
    });
  },
  async calculateApiCompose({ commit, state }) {
    // TODO: only calculate subset of nodes
    const nodes = surveyStackUtils.getAllNodes(state.root);
    const apiCompositions = await codeEvaluator.calculateApiCompose(nodes, state.submission, state.survey);
    const errors = [];
    apiCompositions.forEach((apiComposition) => {
      const {
        result, path, skip, error,
      } = apiComposition;
      if (error) {
        errors.push({ path, error });
      }
      if (!skip) {
        commit('SET_PROPERTY', { path: `${path}.meta.apiCompose`, value: result });
      }
    });
    if (errors.length > 0) {
      commit('SET_ERRORS', errors);
    } else {
      commit('SET_ERRORS', null);
    }
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
    const { controls } = state.survey.revisions.find(revision => revision.version === submission.meta.survey.version);

    const tree = new TreeModel();
    const root = tree.parse({ name: 'data', children: controls });
    state.root = root;

    // possible node alteration
    root.all(n => !!n.parent && n.parent.model.type === 'page').forEach((node) => {
      // node.drop();
    });

    // assign first node
    root.walk((node) => {
      if (!node.isRoot() && node.model.type !== 'group') {
        state.node = node;
        state.firstNode = node;
        return false;
      }
      return true;
    });
  },
  SET_PROPERTY(state, { path, value }) {
    surveyStackUtils.setNested(state.submission, path, value);
  },
  NEXT(state, node) {
    state.node = node;
  },
  PREV(state, node) {
    state.node = node;
  },
  GOTO(state, path) {
    state.root.walk((node) => {
      const currentPath = node.getPath().map(n => n.model.name).join('.');
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
