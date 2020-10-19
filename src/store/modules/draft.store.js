const createInitialState = () => ({
  survey: null,
  submission: null,

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
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  init({ commit }, { survey, submission }) {
    console.log('draft.store:action:init');
    commit('INIT', { survey, submission });
  },
  setProperty({ commit }, { key, value }) {
    commit('SET_PROPERTY', { key, value });
  },
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  INIT(state, { survey, submission }) {
    state.survey = survey;
    state.submission = submission;
  },
  SET_PROPERTY(state, { key, value }) {
    const splits = key.split('.');

    let p = state.submission[splits[0]];

    for (let i = 1; i < splits.length - 1; i++) {
      p = p[splits[i]];
    }

    p[splits.pop()] = value;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
