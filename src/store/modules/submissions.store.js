// import api from '@/services/api.service';
import * as db from '@/store/db';

export const types = {
  FETCH_SUBMISSIONS: 'FETCH_SUBMISSIONS',
  SET_SUBMISSIONS: 'SET_SUBMISSIONS',
  GET_SUBMISSION: 'GET_SUBMISSION',
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
  getSubmission: state => id => state.submissions.find(submission => submission._id === id),
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
  [types.RESET]({ commit }) {
    commit(types.RESET);
  },
  async [types.FETCH_SUBMISSIONS]({ commit }/* , userId */) {
    // const response = await api.get('/submissions');

    // TODO reject if timeout here
    const response = await new Promise((resolve) => {
      db.openDb(() => {
        db.getAllSurveyResults(results => resolve(results));
      });
    });
    console.log('submissions', response);
    commit(types.SET_SUBMISSIONS, response);
    return response;
  },
  [types.ADD_SUBMISSION]({ commit }, submission) {
    commit(types.ADD_SUBMISSION, submission);
  },
  [types.REMOVE_SUBMISSION]({ commit }, id) {
    commit(types.REMOVE_SUBMISSION, id);
  },
  async [types.GET_SUBMISSION]({ state, dispatch }, id) {
    const submissions = state.submissions.length > 0
      ? state.submissions
      : await dispatch(types.FETCH_SUBMISSIONS);
      // : await dispatch(`submissions/${types.FETCH_SUBMISSIONS}`);
    return submissions.find(submission => submission._id === id);
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
