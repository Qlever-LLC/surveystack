const createInitialState = () => ({
  items: [],
});

const initialState = createInitialState();

const getters = {
  hasFeedback: (state) => state.items.length > 0,
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  add({ commit }, feedback) {
    if (typeof feedback === 'string') {
      commit('add', { title: 'Error', type: 'error', message: feedback });
      return;
    }
    commit('add', feedback);
  },
  remove({ commit }, idx) {
    commit('remove', idx);
  },
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  add(state, feedback) {
    state.items.push(feedback);
  },
  remove(state, idx) {
    state.items.splice(idx, 1);
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
