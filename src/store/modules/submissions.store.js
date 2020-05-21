import * as db from '@/store/db';
import api from '@/services/api.service';

import submissionUtils from '@/utils/submissions';

import router from '@/router';

export const types = {
  mutations: {
    RESET: 'RESET',
    SET_SUBMISSIONS: 'SET_SUBMISSIONS',
    ADD_SUBMISSION: 'ADD_SUBMISSION',
    GET_SUBMISSION: 'GET_SUBMISSION',
    UPDATE_SUBMISSION: 'UPDATE_SUBMISSION',
    REMOVE_SUBMISSION: 'REMOVE_SUBMISSION',
    // SET_REMOTE_SUBMISSIONS: 'SET_REMOTE_SUBMISSIONS',
    SET_READY_TO_SUBMIT: 'SET_READY_TO_SUBMIT',
  },
  actions: {
    reset: 'reset',
    add: 'add',
    remove: 'remove',
    fetchLocalSubmission: 'fetchLocalSubmission',
    fetchLocalSubmissions: 'fetchLocalSubmissions',
    startDraft: 'startDraft',
    get: 'get',
    update: 'update',
    fetchRemoteSubmission: 'fetchRemoteSubmission',
  },
};


const createInitialState = () => ({
  submissions: [],
  // remoteSubmissions: [],
  readyToSubmit: [],
});

const initialState = createInitialState();

const getters = {
  drafts: state => state.submissions.filter(s => s),
  outbox: state => state.submissions.filter(s => s),
  // TODO should this search previously uploaded submissions
  getSubmission: state => id => state.submissions.find(submission => submission._id === id),
  readyToSubmit: state => state.submissions.filter(
    ({ meta }) => meta.status && meta.status.find(({ type }) => type === 'READY_TO_SUBMIT'),
  ).map(({ _id }) => _id),
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
  // [types.mutations.SET_REMOTE_SUBMISSIONS](state, submissions) {
  //   state.remoteSubmissions = submissions;
  // },

};

const actions = {
  [types.actions.reset]({ commit }) {
    commit(types.mutations.RESET);
  },
  async [types.actions.fetchLocalSubmissions]({ commit }/* , userId */) {
    // const response = await api.get('/submissions');

    // TODO reject if timeout here
    const response = await new Promise((resolve) => {
      db.openDb(() => {
        db.getAllSubmissions(results => resolve(results));
      });
    });
    commit(types.mutations.SET_SUBMISSIONS, response);
    return response;
  },
  [types.actions.add]({ commit }, submission) {
    // TODO: submissions should be a unique collection, we shouldn't just push
    commit(types.mutations.ADD_SUBMISSION, submission);
  },
  // [types.actions.remove]({ commit }, id) {
  //   commit(types.mutations.REMOVE_SUBMISSION, id);
  // },
  async [types.actions.remove]({ commit }, id) {
    await db.removeFromIndexedDB(db.stores.SUBMISSIONS, id);
    commit(types.mutations.REMOVE_SUBMISSION, id);
  },
  async [types.actions.fetchLocalSubmission]({ state, dispatch }, id) {
    const submissions = state.submissions.length > 0
      ? state.submissions
      : await dispatch(types.actions.fetchLocalSubmissions);
    return submissions.find(submission => submission._id === id);
  },
  // Create a draft, store it in database and Vuex store, then navigate to draft
  // TODO: figure out where and when to persist to database and store.
  // Also, should this even be a Vuex action or should it reside somewhere else?
  async [types.actions.startDraft]({ dispatch }, { survey, version = 0, group }) {
    const surveyEntity = await dispatch('surveys/fetchSurvey', survey, { root: true });
    const activeVersion = (version === 0) ? surveyEntity.latestVersion : version;
    const submission = submissionUtils.createSubmissionFromSurvey({
      survey: surveyEntity,
      version: activeVersion,
      group,
    });
    await db.saveToIndexedDB(db.stores.SUBMISSIONS, submission);
    dispatch(types.actions.add, submission);
    router.push({ name: 'submissions-drafts-detail', params: { id: submission._id } });
  },
  async [types.actions.update]({ commit, dispatch }, submission) {
    await db.saveToIndexedDB(db.stores.SUBMISSIONS, submission);
    commit(types.mutations.UPDATE_SUBMISSION, submission);
    return submission;
  },
  async [types.actions.fetchRemoteSubmission]({ commit }, id) {
    const { data } = await api.get(`/submissions/${id}`);
    console.log('fetchRemoteSubmission response', data);
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
