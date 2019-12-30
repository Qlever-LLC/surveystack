const createInitialState = () => ({
  items: [],
});

const initialState = createInitialState();

const getters = {
  hasFeedback: state => state.items.length > 0,
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
  },
};

const mutations = {
  RESET(state) {
    const newState = createInitialState();
    Object.keys(newState).forEach((key) => {
      state[key] = newState[key];
    });
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
