import * as db from '@/store/db';
// import api from '@/services/api.service';

import submissionUtils from '@/utils/submissions';

import router from '@/router';

export const types = {
  mutations: {
    RESET: 'RESET',
    SET_SUBMISSIONS: 'SET_SUBMISSIONS',
    ADD_SUBMISSION: 'ADD_SUBMISSION',
    REMOVE_SUBMISSION: 'REMOVE_SUBMISSION',
    // SET_REMOTE_SUBMISSIONS: 'SET_REMOTE_SUBMISSIONS',
  },
  actions: {
    reset: 'reset',
    add: 'add',
    remove: 'remove',
    fetchLocalSubmission: 'fetchLocalSubmission',
    fetchLocalSubmissions: 'fetchLocalSubmissions',
    startDraft: 'startDraft',
    // fetchRemoteSubmissions: 'fetchRemoteSubmissions',
  },
};


const createInitialState = () => ({
  submissions: [],
  // remoteSubmissions: [],
});

const initialState = createInitialState();

const getters = {
  drafts: state => state.submissions.filter(s => s),
  outbox: state => state.submissions.filter(s => s),
  // TODO should this search previously uploaded submissions
  getSubmission: state => id => state.submissions.find(submission => submission._id === id),
};

const mutations = {
  [types.mutations.RESET](state) {
    Object.assign(state, createInitialState());
  },
  [types.mutations.SET_SUBMISSIONS](state, submissions) {
    state.submissions = submissions;
  },
  [types.mutations.ADD_SUBMISSION](state, submission) {
    state.submissions.push(submission);
  },
  [types.mutations.REMOVE_SUBMISSION](state, id) {
    const index = state.submissions.findIndex(submission => submission._id === id);
    state.submissions.splice(index, 1);
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
  [types.actions.remove]({ commit }, id) {
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
  async [types.actions.startDraft]({ commit, dispatch }, { survey, version = 0, group }) {
    const surveyEntity = await dispatch('surveys/fetchSurvey', survey, { root: true });
    const activeVersion = (version === 0) ? surveyEntity.latestVersion : version;
    const submission = submissionUtils.createSubmissionFromSurvey({ survey: surveyEntity, version: activeVersion, group });
    await db.saveToIndexedDB(db.stores.SUBMISSIONS, submission);
    dispatch(types.actions.add, submission);
    router.push({ name: 'submissions-drafts-detail', params: { id: submission._id } });
  },
  // async [types.actions.fetchRemoteSubmissions]({ commit }, { userId }) {
  // },

};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
  types,
};
