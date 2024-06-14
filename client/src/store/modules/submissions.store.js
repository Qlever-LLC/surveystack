import * as db from '@/store/db';
import api from '@/services/api.service';

export const types = {
  mutations: {
    SET_SUBMISSIONS: 'SET_SUBMISSIONS',
    ADD_SUBMISSION: 'ADD_SUBMISSION',
    UPDATE_SUBMISSION: 'UPDATE_SUBMISSION',
    REMOVE_SUBMISSION: 'REMOVE_SUBMISSION',
    RESET: 'RESET',
  },
  actions: {
    reset: 'reset',
    add: 'add',
    remove: 'remove',
    fetchLocalSubmissions: 'fetchLocalSubmissions',
    update: 'update',
  },
};

export const createInitialState = () => ({
  submissions: [],
});

const initialState = createInitialState();

const getters = {
  getSubmission: (state) => (id) => state.submissions.find((submission) => submission._id === id),
  readyToSubmit: (state) =>
    state.submissions
      .filter(({ meta }) => meta.status && meta.status.find(({ type }) => type === 'READY_TO_SUBMIT'))
      .map(({ _id }) => _id),
};

const mutations = {
  [types.mutations.RESET](state) {
    Object.assign(state, createInitialState());
  },
  [types.mutations.SET_SUBMISSIONS](state, submissions) {
    state.submissions = submissions;
  },
  [types.mutations.ADD_SUBMISSION](state, submission) {
    // prevent duplicates
    const index = state.submissions.findIndex(({ _id }) => _id === submission._id);
    if (index > -1) {
      state.submissions[index] = submission;
    } else {
      state.submissions.push(submission);
    }
  },
  [types.mutations.REMOVE_SUBMISSION](state, id) {
    const index = state.submissions.findIndex(({ _id }) => _id === id);
    state.submissions.splice(index, 1);
  },
  [types.mutations.UPDATE_SUBMISSION](state, submission) {
    const index = state.submissions.findIndex(({ _id }) => _id === submission._id);
    state.submissions[index] = submission;
  },
};

const actions = {
  [types.actions.reset]({ commit }) {
    commit('RESET');
  },
  async [types.actions.fetchLocalSubmissions]({ commit }) {
    const submissions = await db.getAllSubmissions();
    commit(types.mutations.SET_SUBMISSIONS, submissions);
    return submissions;
  },
  [types.actions.add]({ commit }, submission) {
    commit(types.mutations.ADD_SUBMISSION, submission);
  },
  async [types.actions.remove]({ commit }, id) {
    try {
      await db.removeFromIndexedDB(db.stores.SUBMISSIONS, id);
    } catch (err) {
      console.warn('unable to remove submission from IDB');
    }
    commit(types.mutations.REMOVE_SUBMISSION, id);
  },
  async [types.actions.update]({ commit }, submission) {
    await db.persistSubmission(submission);
    commit(types.mutations.UPDATE_SUBMISSION, submission);
    return submission;
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
