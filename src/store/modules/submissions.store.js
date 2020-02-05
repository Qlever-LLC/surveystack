// import api from '@/services/api.service';
import * as db from '@/store/db';

import * as surveyUtils from '@/utils/surveys';
import router from '@/router';

export const types = {
  FETCH_SUBMISSIONS: 'FETCH_SUBMISSIONS',
  SET_SUBMISSIONS: 'SET_SUBMISSIONS',
  RESET: 'RESET',
  ADD_SUBMISSION: 'ADD_SUBMISSION',
  REMOVE_SUBMISSION: 'REMOVE_SUBMISSION',
  START_DRAFT: 'START_DRAFT',
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
    Object.assign(state, createInitialState());
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
        db.getAllSubmissions(results => resolve(results));
      });
    });
    console.log('submissions', response);
    commit(types.SET_SUBMISSIONS, response);
    return response;
  },
  [types.ADD_SUBMISSION]({ commit }, submission) {
    // TODO: submissions should be a unique collection, we shouldn't just push
    commit(types.ADD_SUBMISSION, submission);
  },
  [types.REMOVE_SUBMISSION]({ commit }, id) {
    commit(types.REMOVE_SUBMISSION, id);
  },
  async getSubmission({ state, dispatch }, id) {
    const submissions = state.submissions.length > 0
      ? state.submissions
      : await dispatch(types.FETCH_SUBMISSIONS);
    // : await dispatch(`submissions/${types.FETCH_SUBMISSIONS}`);
    return submissions.find(submission => submission._id === id);
  },
  // Create a draft, store it in database and Vuex store, then navigate to draft
  // TODO: figure out where and when to persist to database and store.
  // Also, should this even be a Vuex action or should it reside somewhere else?
  async startDraft({ commit, dispatch }, { survey, version }) {
    const surveyEntity = await dispatch('surveys/fetchSurvey', survey, { root: true });
    const activeVersion = surveyEntity.latestVersion;
    const submission = surveyUtils.createInstance(surveyEntity, activeVersion);
    await db.saveToIndexedDB(db.stores.SUBMISSIONS, submission);
    dispatch(types.ADD_SUBMISSION, submission);
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
