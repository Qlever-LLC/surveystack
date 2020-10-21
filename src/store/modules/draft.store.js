import * as utils from '@/utils/surveys';

const createInitialState = () => ({
  survey: null,
  submission: null,
  control: null,
  path: null,
  positions: null,
  controls: null,
  index: 0,
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
  control: state => state.control,
  path: state => state.path,
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
    state.positions = positions;
    state.controls = state.survey.revisions.find(revision => revision.version === submission.meta.survey.version)
      .controls;
    state.index = 0;
    state.control = utils.getControl(state.controls, state.positions[state.index]);
    state.path = `data.${utils.getFlatName(state.controls, state.positions[state.index])}`;
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
    state.control = utils.getControl(state.controls, state.positions[state.index]);
    state.path = `data.${utils.getFlatName(state.controls, state.positions[state.index])}`;
  },
  PREV(state) {
    state.index -= 1;
    state.control = utils.getControl(state.controls, state.positions[state.index]);
    state.path = `data.${utils.getFlatName(state.controls, state.positions[state.index])}`;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
