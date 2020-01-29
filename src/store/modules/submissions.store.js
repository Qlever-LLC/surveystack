import api from '@/services/api.service';

export const types = {
  FETCH_SUBMISSIONS: 'FETCH_SUBMISSIONS',
  SET_SUBMISSIONS: 'SET_SUBMISSIONS',
  RESET: 'RESET',
  ADD_SUBMISSION: 'ADD_SUBMISSION',
  REMOVE_SUBMISSION: 'REMOVE_SUBMISSION',
};

const createInitialState = () => ({
  submissions: [],
});

const initialState = createInitialState();

const getters = {
  drafts: state => state.submissions.filter(s => s),
  outbox: state => state.submissions.filter(s => s),
  sent: state => state.submissions.filter(s => s),
};

const mutations = {
  [types.RESET](state) {
    const newState = createInitialState();
    Object.keys(newState).forEach((key) => {
      state[key] = newState[key];
    });
  },
  [types.SET_SUBMISSIONS](state, submissions) {
    state.submissions = submissions;
  },
  [types.ADD_SUBMISSION](state, submission) {
    state.submissions.push(submission);
  },
  [types.REMOVE_SUBMISSION](state, id) {
    const index = state.submissions.findIndex(submission => submission._id === id);
    state.submissions.splice(index, 1);
  },
};

const actions = {
  reset({ commit }) {
    commit(types.RESET);
  },
  async [types.FETCH_SUBMISSIONS]({ commit }/* , userId */) {
    const response = await api.get('/submissions');
    console.log('submissions', response.data);
    commit(types.SET_SUBMISSIONS, response.data);
  },
  [types.ADD_SUBMISSION]({ commit }, submission) {
    commit(types.ADD_SUBMISSION, submission);
  },
  [types.REMOVE_SUBMISSION]({ commit }, id) {
    commit(types.REMOVE_SUBMISSION, id);
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
  types,
};
