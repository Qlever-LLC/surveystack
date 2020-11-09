import TreeModel from 'tree-model';

import * as surveyStackUtils from '@/utils/surveyStack';
import * as codeEvaluator from '@/utils/codeEvaluator2';

const createInitialState = () => ({
  survey: null, // current survey
  submission: null, // current submission
  root: null, // root node starting from current survey controls
  node: null, // node with model pointing to current survey control
  atStart: true,
  atEnd: false,
  showOverview: false,
  groupPath: null,
  compounds: null,
});

const initialState = createInitialState();

const getters = {
  survey: state => state.survey,
  submission: state => state.submission,
  property: state => (path, fallback) => surveyStackUtils.getNested(state.submission, path, fallback),
  control: state => state.node.model, // current survey control
  path: (state) => {
    const p = state.node.getPath().map(n => n.model.name).join('.');
    return p;
  },
  atStart: state => state.atStart,
  atEnd: state => state.atEnd,
  showOverview: state => state.showOverview,
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
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  init({ commit, dispatch }, { survey, submission }) {
    console.log('draft.store:action:init');

    commit('INIT', { survey, submission });
    dispatch('calculateRelevance');
  },
  setProperty({ commit, dispatch }, { path, value }) {
    commit('SET_PROPERTY', { path, value });
    dispatch('calculateRelevance');
  },
  next({ commit }) {
    commit('NEXT');
  },
  prev({ commit }) {
    commit('PREV');
  },
  goto({ commit }, path) {
    commit('GOTO', path);
  },
  showOverview({ commit }, show) {
    commit('SHOW_OVERVIEW', show);
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
    const calculations = await codeEvaluator.calculateApiCompose(nodes, state.submission, state.survey);
    calculations.forEach((calculation) => {
      const { result, path, skip } = calculation;
      if (!skip) {
        commit('SET_PROPERTY', { path: `${path}.meta.apiCompose`, value: result });
      }
    });
  },
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  INIT(state, { survey, submission }) {
    state.survey = survey;
    state.submission = submission;
    state.showOverview = false;
    const { controls } = state.survey.revisions.find(revision => revision.version === submission.meta.survey.version);

    const tree = new TreeModel();
    const root = tree.parse({ name: 'data', children: controls });
    state.root = root;

    // possible node alteration
    root.all(n => !!n.parent && n.parent.model.type === 'page').forEach((node) => {
      // node.drop();
    });

    // assign current node
    root.walk((node) => {
      if (!node.isRoot() && node.model.type !== 'group') {
        state.node = node;
        return false;
      }
      return true;
    });

    const compounds = [];
    root.walk((node) => {
      if (node.isRoot()) {
        return true;
      }
      const path = node.getPath().map(n => n.model.name).join('.');
      const control = node.model;
      compounds.push({ path, control });
      return true;
    });
    state.compounds = compounds;
  },
  SET_PROPERTY(state, { path, value }) {
    surveyStackUtils.setNested(state.submission, path, value);
    state.submission = { ...state.submission };
  },
  NEXT(state) {
    if (state.atEnd) {
      state.showOverview = true;
      return;
    }

    const traversal = [];
    state.root.walk((node) => {
      if (node.isRoot() || node.model.type === 'group') {
        return true;
      }

      // getPath returns all parent nodes from root to node (including node itself)
      // with slice(1).slice(0,-1) the root and node itself is removed
      const insidePage = node.getPath().slice(1).slice(0, -1).find(parent => parent.model.type === 'page');
      if (insidePage) {
        return true;
      }

      traversal.push(node);
      return true;
    });

    const index = traversal.indexOf(state.node);
    if (traversal.length > index + 1) {
      state.node = traversal[index + 1];
    }

    // update atStart
    if (traversal.leng && state.node === traversal[0]) {
      state.atStart = true;
    } else {
      state.atStart = false;
    }

    if (traversal.length > 0) {
      if (state.node === traversal[0]) {
        state.atStart = true;
      } else {
        state.atEnd = true;
      }

      if (state.node === traversal[traversal.length - 1]) {
        state.atEnd = true;
      } else {
        state.atEnd = false;
      }
    }
  },
  PREV(state) {
    const traversal = [];
    state.root.walk((node) => {
      if (node.isRoot() || node.model.type === 'group') {
        return true;
      }

      // getPath returns all parent nodes from root to node (including node itself)
      // with slice(1).slice(0,-1) the root and node itself is removed
      const insidePage = node.getPath().slice(1).slice(0, -1).find(parent => parent.model.type === 'page');
      if (insidePage) {
        return true;
      }

      traversal.push(node);
      return true;
    });

    const index = traversal.indexOf(state.node);
    if (index > 0) {
      state.node = traversal[index - 1];
    }

    if (traversal.length > 0) {
      if (state.node === traversal[0]) {
        state.atStart = true;
      } else {
        state.atEnd = true;
      }

      if (state.node === traversal[traversal.length - 1]) {
        state.atEnd = true;
      } else {
        state.atEnd = false;
      }
    }
  },
  GOTO(state, path) {
    state.root.walk((node) => {
      const currentPath = node.getPath().map(n => n.model.name).join('.');
      if (currentPath === path) {
        state.node = node;
        return false;
      }
      return true;
    });
  },
  SHOW_OVERVIEW(state, show) {
    state.showOverview = show;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
