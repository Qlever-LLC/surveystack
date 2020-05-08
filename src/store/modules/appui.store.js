const types = {
  SET_TITLE: 'SET_TITLE',
  SET_SUBTITLE: 'SET_SUBTITLE',
  SET_PARTNER: 'SET_PARTNER',
  RESET: 'RESET',
};

const createInitialState = () => ({
  title: 'SurveyStack',
  subtitle: '',
  partner: null,
});

const initialState = createInitialState();

const getters = {
  title: state => state.title,
  subtitle: state => state.subtitle,
  partner: state => state.partner,
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
  setPartner({ commit }, partner) {
    commit(types.SET_PARTNER, partner);
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
  [types.SET_TITLE](state, title) {
    state.title = title;
  },
  [types.SET_SUBTITLE](state, subtitle) {
    state.subtitle = subtitle;
  },
  [types.SET_PARTNER](state, partner) {
    state.partner = partner;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
