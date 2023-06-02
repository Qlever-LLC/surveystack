import * as db from '@/store/db';
import api from '@/services/api.service';
import { createSubmissionFromSurvey } from '@/utils/submissions';
import router from '@/router';
import { isEqual } from 'lodash';
import Vue from 'vue';
import { uploadFileResources } from '@/utils/resources';

const PER_PAGE = 10;

export const SubmissionTypes = {
  LOCAL_DRAFTS: 'Drafts on local',
  SERVER_DRAFTS: 'Drafts on server',
  SUBMITTED: 'Submitted',
  SUBMITTED_AS_PROXY: 'Submitted as proxy',
  RESUBMITTED: 'Resubmitted',
};

export const SubmissionLoadingActions = {
  FETCH_LOCAL_DRAFTS: 'fetch-local-drafts',
  FETCH_SUBMISSIONS: 'fetch-submissions',
  FETCH_SURVEYS: 'fetch-surveys',
  SAVE_TO_LOCAL: 'save-to-local',
  SAVE_TO_SERVER: 'save-to-server',
  DELETE_DRAFT: 'delete-draft',
  ARCHIVE: 'archive',
  START: 'start',
  SUBMIT: 'submit',
  RESUBMIT: 'resubmit',
};

const sanitize = (submission) => {
  const newSubmission = { ...submission };
  delete newSubmission.options;
  return newSubmission;
};

const sortByModifiedDate = (a, b) => new Date(b.meta.dateModified).valueOf() - new Date(a.meta.dateModified).valueOf();

const createInitialState = () => ({
  localDrafts: [], // drafts in IDB
  mySubmissions: [], // submitted submissions + local drafts + server drafts
  surveys: [], // surveys of submissions
  localTotal: 0, // total count of drafts in IDB (-1 if no data)
  serverTotal: 0, // total count of drafts + submissions on Server (-1 if no data)
  filter: {
    type: [],
    survey: [],
    hideArchived: true,
  },
  loading: {},
});

const initialState = createInitialState();

const getters = {
  mySubmissions: (state) => state.mySubmissions,
  surveys: (state) => state.surveys,
  total: (state) => state.serverTotal + state.localTotal,
  filter: (state) => state.filter,
  isLoading: (state) => Object.values(state.loading).filter(Boolean).length > 0,
  getLoading: (state) => (id) => state.loading[id] || false,
  hasMoreData: (state, getters) => state.mySubmissions.length < getters.total,
};

const mutations = {
  RESET: (state) => {
    Object.assign(state, createInitialState());
  },
  SET_MY_SUBMISSIONS: (state, submissions) => {
    state.mySubmissions = submissions;
  },
  ADD_OR_UPDATE_MY_SUBMISSION: (state, submission) => {
    // It is possible to have 2 items with same ID in the list - submitted submission and local/server draft.
    // So we should identify not only id but also draft flag.
    let index = state.mySubmissions.findIndex(
      (item) => item._id === submission._id && item.options.draft === submission.options.draft
    );
    if (index >= 0) {
      Vue.set(state.mySubmissions, index, submission);
    } else {
      state.mySubmissions = [submission, ...state.mySubmissions].sort(sortByModifiedDate);
    }
  },
  DELETE_MY_SUBMISSION: (state, { id, draft }) => {
    state.mySubmissions = state.mySubmissions.filter((item) => item._id !== id || item.options.draft !== draft);
  },
  SET_LOCAL_DRAFTS: (state, drafts) => {
    state.localDrafts = drafts;
    state.localTotal = state.localDrafts.length || -1;
  },
  ADD_OR_UPDATE_LOCAL_DRAFT: (state, submission) => {
    let index = state.localDrafts.findIndex((item) => item._id === submission._id);
    if (index >= 0) {
      Vue.set(state.localDrafts, index, submission);
    } else {
      state.localDrafts.push(submission);
    }
  },
  DELETE_LOCAL_DRAFT: (state, id) => {
    state.localDrafts = state.localDrafts.filter((item) => item._id !== id);
    state.localTotal = state.localDrafts.length || -1;
  },
  SET_SERVER_TOTAL: (state, serverTotal) => {
    state.serverTotal = serverTotal;
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
  RESET_LOADING: (state, id) => {
    state.loading = { ...state.loading, [id]: undefined };
  },
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },

  setFilter({ commit, state, dispatch }, filter) {
    // Not changed
    const newFilter = { ...state.filter, ...filter };
    if (isEqual(state.filter, newFilter)) {
      return;
    }

    commit('SET_FILTER', filter);
    dispatch('fetchSubmissions', true);
  },

  async saveToLocal({ commit }, submission) {
    commit('SET_LOADING', { [submission._id]: SubmissionLoadingActions.SAVE_TO_LOCAL });

    try {
      await db.persistSubmission(sanitize(submission));
      commit('ADD_OR_UPDATE_LOCAL_DRAFT', submission);
    } catch (e) {
      console.warn('Failed to save submission into IDB', e);
      commit('RESET_LOADING', submission._id);

      return null;
    }

    try {
      await api.delete(`/drafts/${submission._id}`);
    } catch (e) {
      console.warn('Failed to delete draft from the server', e);
    }

    const newSubmission = { ...submission, options: { draft: true, local: true } };
    commit('ADD_OR_UPDATE_MY_SUBMISSION', newSubmission);
    commit('RESET_LOADING', submission._id);

    return newSubmission;
  },

  async saveToServer({ commit }, submission) {
    commit('SET_LOADING', { [submission._id]: SubmissionLoadingActions.SAVE_TO_SERVER });

    try {
      await api.post('/drafts', sanitize(submission));
    } catch (e) {
      console.warn('Failed to save submission to server', e);
      commit('RESET_LOADING', submission._id);

      return null;
    }

    try {
      await db.deleteSubmission(submission._id);
      commit('DELETE_LOCAL_DRAFT', submission._id);
    } catch (e) {
      console.warn('Failed to delete draft from IDB', e);
    }

    const newSubmission = { ...submission, options: { draft: true, local: false } };
    commit('ADD_OR_UPDATE_MY_SUBMISSION', newSubmission);
    commit('RESET_LOADING', submission._id);

    return newSubmission;
  },

  async getDraft({ dispatch, state }, id) {
    // Fetch draft from the list
    let draft = state.mySubmissions.find((item) => item._id === id && item.options.draft);
    if (draft) {
      return draft;
    }

    // Find from local
    const localSubmissions = await dispatch('fetchLocalDrafts');
    draft = localSubmissions.find((item) => item._id === id);
    if (draft) {
      return draft;
    }

    // Fetch from remote and save to local
    try {
      const { data } = await api.get(`/submissions/${id}?pure=1`);
      return await dispatch('saveToLocal', data);
    } catch (e) {
      console.warn('Failed to fetch submission', id);
    }

    return null;
  },

  async archiveSubmissions({ commit, state }, { ids, reason }) {
    ids.forEach((id) => commit('SET_LOADING', { [id]: SubmissionLoadingActions.DELETE_DRAFT }));

    let result = false;
    try {
      await api.post(`/submissions/bulk-archive?set=true&reason=${reason}`, { ids });

      if (state.filter.hideArchived) {
        ids.forEach((id) => commit('DELETE_MY_SUBMISSION', { id, draft: false }));
      } else {
        state.mySubmissions
          .filter((submission) => ids.includes(submission._id))
          .map((submission) => ({ ...submission, meta: { ...submission.meta, archive: true } }))
          .forEach((submission) => commit('ADD_OR_UPDATE_MY_SUBMISSION', submission));
      }

      result = true;
    } catch (e) {
      console.warn('Failed to archive submissions', ...ids);
    }

    ids.forEach((id) => commit('RESET_LOADING', id));

    return result;
  },

  async deleteDrafts({ commit, state }, ids) {
    ids.forEach((id) => commit('SET_LOADING', { [id]: SubmissionLoadingActions.DELETE_DRAFT }));

    let result = false;
    try {
      const localIds = ids.filter((id) =>
        state.mySubmissions.some((submission) => submission._id === id && submission.options.local)
      );
      const serverIds = ids.filter((id) =>
        state.mySubmissions.some((submission) => submission._id === id && !submission.options.local)
      );

      const deleteQueue = localIds.map((id) => db.deleteSubmission(id));
      if (serverIds.length > 0) {
        deleteQueue.push(api.post('/drafts/bulk-delete', { ids: serverIds }));
      }

      await Promise.all(deleteQueue);

      ids.forEach((id) => {
        commit('DELETE_LOCAL_DRAFT', id);
        commit('DELETE_MY_SUBMISSION', { id, draft: true });
      });

      result = true;
    } catch (e) {
      console.warn('Failed to delete submissions', ...ids);
    }

    ids.forEach((id) => commit('RESET_LOADING', id));

    return result;
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
      await db.persistSubmission(sanitize(submission));
      commit('ADD_OR_UPDATE_LOCAL_DRAFT', submission);
      commit('ADD_OR_UPDATE_MY_SUBMISSION', submission);
    } catch (e) {
      console.warn('Failed to save submission to IDB', e);
    }

    router.push({
      name: 'submissions-drafts-detail',
      params: { id: submission._id },
      query: { minimal_ui: router.currentRoute.query.minimal_ui },
    });
  },

  async submitDrafts({ commit, dispatch }, drafts) {
    drafts.forEach((submission) => commit('SET_LOADING', { [submission._id]: SubmissionLoadingActions.SUBMIT }));

    let result = false;
    try {
      let surveysMap = {};
      const uploadResources = drafts.map(async (submission) => {
        const { id, version } = submission.meta.survey;
        if (!surveysMap[id]) {
          surveysMap = {
            ...surveysMap,
            [id]: await dispatch('surveys/fetchSurvey', { id, version }, { root: true }),
          };
        }

        return uploadFileResources(this, surveysMap[id], submission, true);
      });

      const putDrafts = drafts.filter((submission) => !!submission.meta.dateSubmitted);
      const postDrafts = drafts.filter((submission) => !submission.meta.dateSubmitted);
      const submitQueue = putDrafts.map((submission) => api.put(`/submissions/${submission._id}`, submission));
      if (postDrafts.length > 0) {
        submitQueue.push(api.post('/submissions', postDrafts));
      }

      await new Promise.all([...uploadResources, ...submitQueue]);

      result = true;
    } catch (e) {
      console.warn('Failed to submit drafts', drafts);
    }

    drafts.forEach((submission) => commit('RESET_LOADING', submission._id));

    return result;
  },

  async fetchLocalDrafts({ commit, state, rootGetters }) {
    if (state.loading[SubmissionLoadingActions.FETCH_LOCAL_DRAFTS]) {
      return state.localDrafts;
    }

    commit('SET_LOADING', { [SubmissionLoadingActions.FETCH_LOCAL_DRAFTS]: true });

    let submissions = [];
    try {
      submissions = await db.getAllSubmissions();
    } catch (e) {
      console.warn('Failed to get all submissions from the IDB', e);
    }

    // Filter my submissions
    const user = rootGetters['auth/user']._id;
    const mySubmissions = submissions.filter(
      (item) => item.meta.resubmitter === user || item.meta.proxyUserId === user || item.meta.creator === user
    );

    commit('SET_LOCAL_DRAFTS', mySubmissions);
    commit('RESET_LOADING', SubmissionLoadingActions.FETCH_LOCAL_DRAFTS);

    return mySubmissions;
  },

  async fetchSubmissions({ commit, state }, reset = false) {
    if (state.loading[SubmissionLoadingActions.FETCH_SUBMISSIONS]) {
      return;
    }

    commit('SET_LOADING', { [SubmissionLoadingActions.FETCH_SUBMISSIONS]: true });

    if (reset) {
      commit('SET_MY_SUBMISSIONS', []);
      commit('SET_SERVER_TOTAL', 0);
    }

    const isLocal = state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.LOCAL_DRAFTS);
    const isServer = state.filter.type.length !== 1 || !isLocal;

    const [lastSubmission] = state.mySubmissions.slice(-1);
    let localData = [];
    let serverData = [];

    // Fetch if local has data
    if (isLocal && state.localTotal >= 0) {
      // Add options for the front-end side usage, this will be sanitized in the back-end.
      localData = state.localDrafts.map((item) => ({ ...item, options: { draft: true, local: true } }));

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

    // Fetch if server has data
    if (isServer && state.serverTotal >= 0) {
      const params = new URLSearchParams();
      params.append('limit', PER_PAGE.toString());

      if (lastSubmission) {
        params.append('lastDateModified', lastSubmission.meta.dateModified);
      }
      if (state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.SERVER_DRAFTS)) {
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
      if (state.filter.hideArchived) {
        params.append('hideArchived', '1');
      }
      state.filter.survey.forEach((id) => {
        params.append('surveyIds[]', id);
      });

      try {
        const { data } = await api.get(`/drafts?${params}`);
        serverData = data.submissions;
        commit('SET_SERVER_TOTAL', data.total || -1);
      } catch (e) {
        console.warn('Failed to fetch drafts with filter', state.filter, e);
      }
    }

    // Resolve conflicts by choosing the latest date modified submission
    const uniqueSubmissions = [];
    const deleteFromLocal = [];
    const deleteFromServer = [];
    // Always choose the item that has the latest modified date
    const newSubmissions = [...localData, ...serverData].sort(sortByModifiedDate);
    newSubmissions.forEach((item) => {
      // Already win draft exist - means we have duplicated draft in both server and local.
      // So, we should remove one of them to ensure the source of truth.
      if (uniqueSubmissions.some((i) => i.options.draft && item.options.draft && i._id === item._id)) {
        if (item.options.local) {
          deleteFromLocal.push(item._id);
        } else {
          deleteFromServer.push(item._id);
        }
        return;
      }

      uniqueSubmissions.push(item);
    });

    // Delete lose drafts from local
    if (deleteFromLocal.length > 0) {
      try {
        await Promise.all(deleteFromLocal.map(db.deleteSubmission));
      } catch (e) {
        console.warn('Failed to delete drafts from IDB', e);
      }
    }

    // Delete lose drafts from serer
    if (deleteFromServer.length > 0) {
      try {
        await api.post(`/drafts/bulk-delete`, { ids: deleteFromServer });
      } catch (e) {
        console.warn('Failed to delete drafts from server', e);
      }
    }

    // Append the new data
    commit('SET_MY_SUBMISSIONS', [...state.mySubmissions, ...uniqueSubmissions.slice(0, PER_PAGE)]);
    commit('RESET_LOADING', SubmissionLoadingActions.FETCH_SUBMISSIONS);
  },

  async fetchSurveys({ commit, state }) {
    if (state.loading[SubmissionLoadingActions.FETCH_SURVEYS]) {
      return;
    }

    commit('SET_LOADING', { [SubmissionLoadingActions.FETCH_SURVEYS]: true });
    commit('SET_SURVEYS', []);

    const params = new URLSearchParams();
    if (state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.LOCAL_DRAFTS)) {
      state.localDrafts.forEach((item) => {
        params.append('localSurveyIds[]', item.meta.survey.id);
      });
    }
    if (state.filter.type.length === 0 || state.filter.type.includes(SubmissionTypes.SERVER_DRAFTS)) {
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
    if (state.filter.hideArchived) {
      params.append('hideArchived', '1');
    }

    try {
      const { data } = await api.get(`/drafts/surveys?${params}`);
      commit('SET_SURVEYS', data);
    } catch (e) {
      console.warn('Failed to fetch surveys of my submissions', state.filter, e);
    }

    commit('RESET_LOADING', SubmissionLoadingActions.FETCH_SURVEYS);
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
