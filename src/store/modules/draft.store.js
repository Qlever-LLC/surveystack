import LinkedList from 'dbly-linked-list';

import * as utils from '@/utils/surveys';

const createInitialState = () => ({
  survey: null,
  submission: null,
  index: 0,
  list: null,
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
  control: state => state.node.getData().control,
  path: state => state.node.getData().path,
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
    const list = new LinkedList();
    for (let i = 0; i < positions.length; i++) {
      const control = utils.getControl(controls, positions[i]);
      const path = `data.${utils.getFlatName(controls, positions[i])}`;
      list.insert({ path, control });
    }
    state.list = list;
    state.node = state.list.getHeadNode();
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
    state.index += 1;
    if (state.node.hasNext()) {
      state.node = state.node.next;
    }
  },
  PREV(state) {
    state.index -= 1;
    if (state.node.hasPrev()) {
      state.node = state.node.prev;
    }
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
