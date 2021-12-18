// DEPRECATED:, remove a few weeks after https://gitlab.com/our-sci/software/surveystack/-/merge_requests/67  was deployed

const createInitialState = () => ({
  invitation: null,
});

const initialState = createInitialState();

const getters = {
  hasInvitation: (state) => state.invitation !== null,
  code: (state) => state.invitation,
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  set({ commit }, invitation) {
    commit('set', invitation);
  },
  clear({ commit }) {
    commit('clear');
  },
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  set(state, invitation) {
    state.invitation = invitation;
  },
  clear(state) {
    state.invitation = null;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
