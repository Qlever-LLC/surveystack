// import api from '@/services/api.service';
import * as db from '@/store/db';

import submissionUtils from '@/utils/submissions';
import { createInstance } from '@/utils/surveys';

import router from '@/router';

export const types = {
  mutations: {
    RESET: 'RESET',
    SET_SUBMISSIONS: 'SET_SUBMISSIONS',
    ADD_SUBMISSION: 'ADD_SUBMISSION',
    REMOVE_SUBMISSION: 'REMOVE_SUBMISSION',
  },
  actions: {
    reset: 'reset',
    add: 'add',
    remove: 'remove',
    fetchSubmission: 'fetchSubmission',
    fetchSubmissions: 'fetchSubmissions',
    startDraft: 'startDraft',
  },
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
};

const actions = {
  [types.actions.reset]({ commit }) {
    commit(types.mutations.RESET);
  },
  async [types.actions.fetchSubmissions]({ commit }/* , userId */) {
    // const response = await api.get('/submissions');

    // TODO reject if timeout here
    const response = await new Promise((resolve) => {
      db.openDb(() => {
        db.getAllSubmissions(results => resolve(results));
      });
    });
    console.log('submissions', response);
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
  async [types.actions.fetchSubmission]({ state, dispatch }, id) {
    const submissions = state.submissions.length > 0
      ? state.submissions
      : await dispatch(types.actions.fetchSubmissions);
    return submissions.find(submission => submission._id === id);
  },
  // Create a draft, store it in database and Vuex store, then navigate to draft
  // TODO: figure out where and when to persist to database and store.
  // Also, should this even be a Vuex action or should it reside somewhere else?
  async [types.actions.startDraft]({ commit, dispatch }, { survey, version }) {
    const surveyEntity = await dispatch('surveys/fetchSurvey', survey, { root: true });
    const activeVersion = surveyEntity.latestVersion;
    // const submission = surveyUtils.createInstance(surveyEntity, activeVersion);
    const submission = submissionUtils.createSubmissionFromSurvey(surveyEntity, activeVersion);
    await db.saveToIndexedDB(db.stores.SUBMISSIONS, submission);
    dispatch(types.actions.add, submission);
    router.push({ name: 'submissions-drafts-detail', params: { id: submission._id } });
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
