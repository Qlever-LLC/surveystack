import * as db from '@/store/db';
import api from '@/services/api.service';

export const types = {
  mutations: {
    SET_SUBMISSIONS: 'SET_SUBMISSIONS',
    ADD_SUBMISSION: 'ADD_SUBMISSION',
    GET_SUBMISSION: 'GET_SUBMISSION',
    UPDATE_SUBMISSION: 'UPDATE_SUBMISSION',
    REMOVE_SUBMISSION: 'REMOVE_SUBMISSION',
    SET_READY_TO_SUBMIT: 'SET_READY_TO_SUBMIT',
  },
  actions: {
    add: 'add',
    remove: 'remove',
    fetchLocalSubmission: 'fetchLocalSubmission',
    fetchLocalSubmissions: 'fetchLocalSubmissions',
    get: 'get',
    update: 'update',
    fetchRemoteSubmission: 'fetchRemoteSubmission',
  },
};

const createInitialState = () => ({
  submissions: [],
  readyToSubmit: [],
});

const initialState = createInitialState();

const getters = {
  drafts: (state) => state.submissions.filter((s) => s),
  outbox: (state) => state.submissions.filter((s) => s),
  // TODO should this search previously uploaded submissions
  getSubmission: (state) => (id) => state.submissions.find((submission) => submission._id === id),
  readyToSubmit: (state) =>
    state.submissions
      .filter(({ meta }) => meta.status && meta.status.find(({ type }) => type === 'READY_TO_SUBMIT'))
      .map(({ _id }) => _id),
};

const mutations = {
  RESET(state) {
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
  reset({ commit }) {
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
  async [types.actions.fetchLocalSubmission]({ state, dispatch }, id) {
    const submissions =
      state.submissions.length > 0 ? state.submissions : await dispatch(types.actions.fetchLocalSubmissions);
    return submissions.find((submission) => submission._id === id);
  },
  async [types.actions.update]({ commit }, submission) {
    await db.persistSubmission(submission);
    commit(types.mutations.UPDATE_SUBMISSION, submission);
    return submission;
  },
  async [types.actions.fetchRemoteSubmission]({ commit }, id) {
    // pure param makes sure the submission is suitable for re-submissions
    // with only the original or 'pure' submission being fetched, i.e. no "meta.creatorDetail" added, etc.
    const { data } = await api.get(`/submissions/${id}?pure=1`);
    // NOTE: this means that dispatching fetchRemoteSubmission will overwrite a local draft
    // So if a user submits a Submission, then edits it (but without resubmitting it), then we
    // execute fetchRemoteSubmission again, their local edits will be overwritten and lost
    commit(types.mutations.ADD_SUBMISSION, data);
    return data;
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
