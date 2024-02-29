//TODO check if this is still needed after the ui overhaul
const createInitialState = () => ({
  title: 'SurveyStack',
  subtitle: '',
  menu: false,
  fixedFooter: false,
});

const initialState = createInitialState();

const getters = {
  title: (state) => state.title,
  subtitle: (state) => state.subtitle,
  menu: (state) => state.menu,
};

const actions = {
  reset({ commit, rootGetters }) {
    commit('RESET');
    if (rootGetters['whitelabel/isWhitelabel']) {
      // if this is a whitelabel app, keep the title
      commit('SET_TITLE', rootGetters['whitelabel/partner'].name);
    }
  },
  setTitle({ commit }, title) {
    commit('SET_TITLE', title);
  },
  setSubtitle({ commit }, subtitle) {
    commit('SET_SUBTITLE', subtitle);
  },
  setMenu({ commit }, show) {
    commit('SET_MENU', show);
  },
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  SET_TITLE(state, title) {
    state.title = title;
  },
  SET_SUBTITLE(state, subtitle) {
    state.subtitle = subtitle;
  },
  SET_MENU(state, show) {
    state.menu = show;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
