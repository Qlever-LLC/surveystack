const initialState = () => ({
  items: []
});

const state = initialState();

const getters = {
  hasFeedback: state => state.items.length > 0
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },

  add({ commit }, feedback) {
    commit('add', feedback);
  },
  remove({ commit }, idx) {
    commit('remove', idx);
  }
};

const mutations = {
  RESET(state) {
    const newState = initialState();
    Object.keys(newState).forEach(key => {
      state[key] = newState[key];
    });
  },
  add(state, feedback) {
    state.items.push(feedback);
  },
  remove(state, idx) {
    state.items.splice(idx, 1);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
