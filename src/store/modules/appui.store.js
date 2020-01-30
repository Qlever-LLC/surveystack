const createInitialState = () => ({
  title: 'Our-Sci',
  subtitle: '',
});

const initialState = createInitialState();

const getters = {
  title: state => state.title,
  subtitle: state => state.subtitle,
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  title({ commit }, title) {
    commit('title', title);
  },
  subtitle({ commit }, subtitle) {
    commit('subtitle', subtitle);
  },
};

const mutations = {
  RESET(state) {
    const newState = createInitialState();
    Object.keys(newState).forEach((key) => {
      state[key] = newState[key];
    });
  },
  title(state, title) {
    state.title = title;
  },
  subtitle(state, subtitle) {
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
