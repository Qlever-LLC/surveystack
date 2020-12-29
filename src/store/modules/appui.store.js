const createInitialState = () => ({
  title: 'SurveyStack',
  subtitle: '',
  partner: null,
  menu: false,
  fixedFooter: false,
});


const initialState = createInitialState();

const getters = {
  title: state => state.title,
  subtitle: state => state.subtitle,
  partner: state => state.partner,
  menu: state => state.menu,
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  setTitle({ commit }, title) {
    commit('SET_TITLE', title);
  },
  setSubtitle({ commit }, subtitle) {
    commit('SET_SUBTITLE', subtitle);
  },
  setPartner({ commit }, partner) {
    commit('SET_PARTNER', partner);
  },
  setMenu({ commit }, show) {
    commit('SET_MENU', show);
  },
};

const mutations = {
  RESET(state) {
    const { partner } = state;
    Object.assign(state, createInitialState());
    state.partner = partner;
    if (state.partner) {
      state.title = partner.name;
    }
  },
  SET_TITLE(state, title) {
    state.title = title;
  },
  SET_SUBTITLE(state, subtitle) {
    state.subtitle = subtitle;
  },
  SET_PARTNER(state, partner) {
    state.partner = partner;
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
