const types = {
  SET_TITLE: 'SET_TITLE',
  SET_SUBTITLE: 'SET_SUBTITLE',
  RESET: 'RESET',
};

const createInitialState = () => ({
  title: 'Surveystack',
  subtitle: '',
});

const initialState = createInitialState();

const getters = {
  title: state => state.title,
  subtitle: state => state.subtitle,
};

const actions = {
  reset({ commit }) {
    commit(types.RESET);
  },
  setTitle({ commit }, title) {
    commit(types.SET_TITLE, title);
  },
  setSubtitle({ commit }, subtitle) {
    commit(types.SET_SUBTITLE, subtitle);
  },
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  [types.SET_TITLE](state, title) {
    state.title = title;
  },
  [types.SET_SUBTITLE](state, subtitle) {
    state.subtitle = subtitle;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
