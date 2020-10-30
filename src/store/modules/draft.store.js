import TreeModel from 'tree-model';

import * as utils from '@/utils/surveys';

const createInitialState = () => ({
  survey: null,
  submission: null,
  index: 0,
  tree: null,
  root: null,
  node: null,
});

const initialState = createInitialState();

const getters = {
  survey: state => state.survey,
  submission: state => state.submission,
  property: state => (path) => {
    const splits = path.split('.');

    let p = state.submission[splits[0]];
    for (let i = 1; i < splits.length; i++) {
      p = p[splits[i]];
    }

    return p;
  },
  control: state => state.node.model,
  path: (state) => {
    const p = `data${state.node.getPath().map(n => n.model.name).join('.')}`;
    console.log('path', p);
    return p;
  },
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  init({ commit }, { survey, submission }) {
    console.log('draft.store:action:init');

    commit('INIT', { survey, submission });
  },
  setProperty({ commit }, { path, value }) {
    commit('SET_PROPERTY', { path, value });
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
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  INIT(state, { survey, submission }) {
    state.survey = survey;
    state.submission = submission;
    const positions = utils.getSurveyPositions(survey, submission.meta.survey.version);
    const { controls } = state.survey.revisions.find(revision => revision.version === submission.meta.survey.version);

    state.index = 0;
    const tree = new TreeModel();
    const root = tree.parse({ children: controls });
    state.root = root;
    root.walk((node) => {
      // console.log(node);
    });
    /*
    for (let i = 0; i < positions.length; i++) {
      const control = utils.getControl(controls, positions[i]);
      const path = `data.${utils.getFlatName(controls, positions[i])}`;
      list.insert({ path, control });
    }
    */
    state.tree = tree;
    state.node = root.first(n => !!n.model.name);
    console.log('first node', state.node);
  },
  SET_PROPERTY(state, { path, value }) {
    console.log(`path: ${path}`);
    console.log(`value: ${value}`);

    const splits = path.split('.');

    let p = state.submission[splits[0]];

    for (let i = 1; i < splits.length - 1; i++) {
      p = p[splits[i]];
    }

    p[splits.pop()] = value;
  },
  NEXT(state) {
    let previousNode = null;
    state.root.walk((node) => {
      if (previousNode === state.node) {
        state.node = node;
        return false;
      }
      previousNode = node;
    });
  },
  PREV(state) {
    state.index -= 1;

    let previousNode = null;
    state.root.walk((node) => {
      if (node === state.node && !previousNode.isRoot()) {
        state.node = previousNode;
        return false;
      }
      previousNode = node;
    });
  },
  GOTO(path) {

  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
