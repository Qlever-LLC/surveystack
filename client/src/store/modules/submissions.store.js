import * as db from '@/store/db';
import api from '@/services/api.service';
import { createSubmissionFromSurvey } from '@/utils/submissions';
import router from '@/router';
import { isEqual } from 'lodash';

const PER_PAGE = 10;

export const SubmissionTypes = {
  LOCAL_DRAFTS: 'Drafts on local',
  REMOTE_DRAFTS: 'Drafts on server',
  SUBMITTED: 'Submitted',
  SUBMITTED_AS_PROXY: 'Submitted as proxy',
  RESUBMITTED: 'Resubmitted',
};

const createInitialState = () => ({
  localDrafts: [],
  submissions: [],
  surveys: [],
  localTotal: 0,
  remoteTotal: 0,
  filter: {
    type: [],
    survey: [],
  },
  loading: {},
});

const initialState = createInitialState();

const getters = {
  submissions: (state) => state.submissions,
  surveys: (state) => state.surveys,
  total: (state) => state.remoteTotal + state.localTotal,
  filter: (state) => state.filter,
  isLoading: (state) => Object.values(state.loading).filter(Boolean) > 0,
  getLoading: (state) => (id) => state.loading[id] || false,
  hasMoreData: (state, getters) => state.submissions.length < getters.total,
};

const mutations = {
  RESET: (state) => {
    Object.assign(state, createInitialState());
  },
  SET_SUBMISSIONS: (state, submissions) => {
    state.submissions = submissions;
  },
  ADD_OR_UPDATE_SUBMISSION: (state, submission) => {
    let index = state.submissions.findIndex((item) => item._id === submission._id);
    if (index >= 0) {
      state.submissions[index] = submission;
    } else {
      state.submissions = [submission, ...state.submissions];
    }
  },
  REMOVE_SUBMISSION: (state, id) => {
    state.submissions = state.submissions.filter((item) => item._id !== id);
  },
  SET_LOCAL_DRAFTS: (state, drafts) => {
    state.localDrafts = drafts;
    state.localTotal = state.localDrafts.length || -1;
  },
  ADD_OR_UPDATE_LOCAL_DRAFT: (state, submission) => {
    let index = state.localDrafts.findIndex((item) => item._id === submission._id);
    if (index >= 0) {
      state.localDrafts[index] = submission;
    } else {
      state.localDrafts.push(submission);
    }
  },
  REMOVE_LOCAL_DRAFT: (state, id) => {
    state.localDrafts = state.localDrafts.filter((item) => item._id !== id);
    state.localTotal = state.localDrafts.length || -1;
  },
  SET_REMOTE_TOTAL: (state, remoteTotal) => {
    state.remoteTotal = remoteTotal;
  },
  SET_SURVEYS: (state, surveys) => {
    state.surveys = surveys;
  },
  SET_FILTER: (state, filter) => {
    state.filter = { ...state.filter, ...filter };
  },
  SET_LOADING: (state, loading) => {
    state.loading = { ...state.loading, ...loading };
  },
  REMOVE_LOADING: (state, id) => {
    state.loading = { ...state.loading, [id]: undefined };
  },
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  async remove({ commit, state }, id) {
    commit('SET_LOADING', { [id]: 'removing' });
    const isLocal = state.localDrafts.some((item) => item._id === id);

    if (isLocal) {
      try {
        await db.removeFromIndexedDB(db.stores.SUBMISSIONS, id);
        commit('REMOVE_LOCAL_DRAFT', id);
        commit('REMOVE_SUBMISSION', id);
      } catch (e) {
        console.warn('Failed to remove submission from the Server IDB', e);
      }
    } else {
      try {
        await api.delete(`/drafts/${id}`);
        commit('REMOVE_SUBMISSION', id);
      } catch (e) {
        console.warn('Failed to remove submission from the Server IDB', e);
      }
    }
    commit('REMOVE_LOADING', id);
  },
  setFilter({ commit, state, dispatch }, filter) {
    // Not changed
    const newFilter = { ...state.filter, ...filter };
    if (isEqual(state.filter, newFilter)) {
      return;
    }

    commit('SET_FILTER', filter);
    dispatch('fetchRemoteSubmissions', true);
  },
  async saveToLocal({ commit }, submission) {
    commit('SET_LOADING', { [submission._id]: 'resubmit' });

    await db.saveToIndexedDB(db.stores.SUBMISSIONS, submission);
    commit('ADD_OR_UPDATE_LOCAL_DRAFT', submission);
    commit('ADD_OR_UPDATE_SUBMISSION', submission);

    commit('REMOVE_LOADING', submission._id);

    return submission;
  },
  async startDraft({ dispatch, commit }, { survey, submitAsUser = undefined, version = 0 }) {
    const activeVersion = version || survey.latestVersion;
    const surveyEntity = await dispatch(
      'surveys/fetchSurvey',
      { id: survey._id, version: activeVersion },
      { root: true }
    );
    const submission = createSubmissionFromSurvey({
      survey: surveyEntity,
      version: activeVersion,
      submitAsUser,
    });

    try {
      await db.saveToIndexedDB(db.stores.SUBMISSIONS, submission);
      commit('ADD_OR_UPDATE_LOCAL_DRAFT', submission);
      commit('ADD_OR_UPDATE_SUBMISSION', submission);
    } catch (e) {
      console.warn('Failed to save submission to IDB', e);
    }

    router.push({
      name: 'submissions-drafts-detail',
      params: { id: submission._id },
      query: { minimal_ui: router.currentRoute.query.minimal_ui },
    });
  },
  async resubmit({ commit }, id) {
    commit('SET_LOADING', { [id]: 'resubmit' });

    const { data } = await api.get(`/submissions/${id}?pure=1`);
    commit('ADD_OR_UPDATE_LOCAL_DRAFT', data);
    commit('ADD_OR_UPDATE_SUBMISSION', data);

    commit('REMOVE_LOADING', id);

    router.push({
      name: 'submissions-drafts-detail',
      params: { id },
      query: { minimal_ui: router.currentRoute.query.minimal_ui },
    });
  },
  async fetchLocalSubmissions({ commit, rootGetters }) {
    commit('SET_LOADING', { fetch: true });

    const response = await new Promise((resolve) => {
      db.openDb(() => {
        db.getAllSubmissions(resolve);
      });
    });

    // Filter my submissions
    const user = rootGetters['auth/user']._id;
    const mySubmissions = response.filter(
      (item) => item.meta.resubmitter === user || item.meta.proxyUserId === user || item.meta.creator === user
    );

    commit('SET_LOCAL_DRAFTS', mySubmissions);
    commit('REMOVE_LOADING', 'fetch');

    return response;
  },
  async fetchRemoteSubmissions({ commit, state }, reset = false) {
    if (state.loading.submissions) {
      return;
    }

    commit('SET_LOADING', { submissions: true });

    if (reset) {
      commit('SET_SUBMISSIONS', []);
    }

    const isLocal = state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.LOCAL_DRAFTS);
    const isRemote = state.filter.type.length !== 1 || !isLocal;

    const [lastSubmission] = state.submissions;
    let localData = [];
    let remoteData = [];

    // Fetch if local has data
    if (isLocal && state.localTotal >= 0) {
      localData = state.localDrafts.map((item) => ({
        ...item,
        options: {
          draft: true,
          local: true,
        },
      }));

      // Filter by `dateModified` is older than the last element from the list
      if (lastSubmission) {
        const lastDate = new Date(lastSubmission.meta.dateModified).valueOf();
        localData = localData.filter((item) => new Date(item.meta.dateModified).valueOf() < lastDate);
      }

      // Filter by survey
      if (state.filter.survey.length > 0) {
        localData = localData.filter((item) => state.filter.survey.some((id) => item.meta.survey.id === id));
      }
    }

    // Fetch if remote has data
    if (isRemote && state.remoteTotal >= 0) {
      const params = new URLSearchParams();
      params.append('limit', PER_PAGE.toString());

      if (lastSubmission) {
        params.append('lastDateModified', lastSubmission.meta.dateModified);
      }
      if (state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.REMOTE_DRAFTS)) {
        params.append('draft', '1');
      }
      if (state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.SUBMITTED)) {
        params.append('creator', '1');
      }
      if (state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.SUBMITTED_AS_PROXY)) {
        params.append('proxyUserId', '1');
      }
      if (state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.RESUBMITTED)) {
        params.append('resubmitter', '1');
      }
      state.filter.survey.forEach((id) => {
        params.append('surveyIds[]', id);
      });

      try {
        const { data } = await api.get(`/drafts?${params}`);
        remoteData = data.submissions;
        commit('SET_REMOTE_TOTAL', data.total || -1);
      } catch (e) {
        console.warn('Failed to fetch drafts with filter', state.filter, e);
      }
    }

    const sortByModifiedDate = (a, b) =>
      new Date(b.meta.dateModified).valueOf() - new Date(a.meta.dateModified).valueOf();

    // Resolve conflicts by choosing the latest date modified submission
    const uniqueSubmissions = [];
    const newSubmissions = [...remoteData, ...localData].sort(sortByModifiedDate);
    newSubmissions.forEach((item) => {
      if (uniqueSubmissions.some((i) => i._id === item._id)) {
        return;
      }

      // Always choose the item that has the latest modified date
      let match = newSubmissions.filter((i) => i._id === item._id);
      if (match.length > 1) {
        match = match.sort(sortByModifiedDate);
      }

      uniqueSubmissions.push(match[0]);
    });

    // Append the new data
    commit('SET_SUBMISSIONS', [...state.submissions, ...uniqueSubmissions.slice(0, PER_PAGE)]);
    commit('REMOVE_LOADING', 'submissions');
  },

  async fetchSurveys({ commit, state }) {
    commit('SET_LOADING', { surveys: true });
    commit('SET_SURVEYS', []);

    const params = new URLSearchParams();
    if (state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.LOCAL_DRAFTS)) {
      state.localDrafts.forEach((item) => {
        params.append('localSurveyIds[]', item.meta.survey.id);
      });
    }
    if (state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.REMOTE_DRAFTS)) {
      params.append('draft', '1');
    }
    if (state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.SUBMITTED)) {
      params.append('creator', '1');
    }
    if (state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.SUBMITTED_AS_PROXY)) {
      params.append('proxyUserId', '1');
    }
    if (state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.RESUBMITTED)) {
      params.append('resubmitter', '1');
    }

    try {
      const { data } = await api.get(`/drafts/surveys?${params}`);
      commit('SET_SURVEYS', data);
    } catch (e) {
      console.warn('Failed to fetch surveys of my submissions', state.filter, e);
    }

    commit('REMOVE_LOADING', 'surveys');
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
