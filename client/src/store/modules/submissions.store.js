import * as db from '@/store/db';
import api from '@/services/api.service';
import { createSubmissionFromSurvey, parseSubmitResponse, sanitizeSubmission } from '@/utils/submissions';
import router from '@/router';
import { cloneDeep, get, isEqual } from 'lodash';
import Vue from 'vue';
import { uploadFileResources } from '@/utils/resources';
import { isRef } from '@vue/composition-api';
import downloadExternal from '@/utils/downloadExternal';

const PER_PAGE = 10;

export const SubmissionTypes = {
  LOCAL_DRAFTS: 'Drafts on local',
  SERVER_DRAFTS: 'Drafts on server',
  SUBMITTED: 'Submitted',
  SUBMITTED_AS_PROXY: 'Submitted as proxy',
  RESUBMITTED: 'Resubmitted',
};

const sortByModifiedDate = (a, b) => new Date(b.meta.dateModified).valueOf() - new Date(a.meta.dateModified).valueOf();

const createInitialState = () => ({
  myDrafts: [], // All of my drafts = local drafts + server drafts, used to global actions and calculate ready to submit count
  mySubmissions: [], // All of my submissions = submitted submissions + local drafts + server drafts
  surveys: [], // surveys of mySubmissions
  localTotal: -1, // total count of drafts in IDB (-1 by default)
  serverTotal: -1, // total count of drafts + submissions on Server (-1 by default)
  serverRemain: -1, // remain count of drafts + submissions on Server (-1 by default)
  filter: {
    type: [],
    surveyIds: [],
    hideArchived: true,
  },
  isFetchingSubmissions: false,
  isFetchingSurveys: false,
});

const initialState = createInitialState();

const getters = {
  mySubmissions: (state) => state.mySubmissions,
  selected: (state) => state.mySubmissions.filter((submission) => submission.options.selected),
  surveys: (state) => state.surveys,
  readyToSubmitCount: (state) =>
    state.myDrafts.filter((item) => item.meta.status.some((item) => item.type === 'READY_TO_SUBMIT')).length,
  filter: (state) => state.filter,
  isFetchingSubmissions: (state) => state.isFetchingSubmissions,
  isFetchingSurveys: (state) => state.isFetchingSurveys,
  total: (state) => (state.localTotal < 0 || state.serverTotal < 0 ? -1 : state.serverTotal + state.localTotal),
  hasMoreData: (state, getters) => getters.total < 0 || state.mySubmissions.length < getters.total,
};

const mutations = {
  RESET: (state) => {
    Object.assign(state, createInitialState());
  },
  SET_DRAFTS: (state, drafts) => {
    state.myDrafts = drafts;
  },
  SET_SUBMISSIONS: (state, submissions) => {
    state.mySubmissions = submissions;
  },
  ADD_OR_UPDATE_SUBMISSION: (state, { submission, newSubmission = submission }) => {
    // It is possible to have 2 items with same ID in the list: submitted submission + local/server draft.
    // So we should identify not only id but also draft flag.
    let index = state.mySubmissions.findIndex(
      (item) => item._id === submission._id && submission.options && item.options.draft === submission.options.draft
    );
    if (index >= 0) {
      Vue.set(state.mySubmissions, index, newSubmission);
    } else {
      state.mySubmissions = [newSubmission, ...state.mySubmissions].sort(sortByModifiedDate);
    }
  },
  DELETE_SUBMISSION: (state, { id, draft }) => {
    state.mySubmissions = state.mySubmissions.filter((item) => item._id !== id || item.options.draft !== draft);
  },
  SET_LOCAL_TOTAL: (state, localTotal) => {
    state.localTotal = localTotal;
  },
  DECREASE_LOCAL_TOTAL: (state) => {
    if (state.localTotal > 0) {
      state.localTotal -= 1;
    }
  },
  INCREASE_LOCAL_TOTAL: (state) => {
    if (state.localTotal >= 0) {
      state.localTotal += 1;
    }
  },
  SET_SERVER_TOTAL: (state, serverTotal) => {
    state.serverTotal = serverTotal;
  },
  DECREASE_SERVER_TOTAL: (state) => {
    if (state.serverTotal > 0) {
      state.serverTotal -= 1;
    }
  },
  INCREASE_SERVER_TOTAL: (state) => {
    if (state.serverTotal >= 0) {
      state.serverTotal -= 1;
    }
  },
  SET_SERVER_REMAIN: (state, serverRemain) => {
    state.serverRemain = serverRemain;
  },
  SET_SURVEYS: (state, surveys) => {
    state.surveys = surveys;
  },
  SET_FILTER: (state, filter) => {
    state.filter = { ...state.filter, ...filter };
  },
  SET_FETCHING_SUBMISSIONS: (state) => {
    state.isFetchingSubmissions = true;
  },
  RESET_FETCHING_SUBMISSIONS: (state) => {
    state.isFetchingSubmissions = false;
  },
  SET_FETCHING_SURVEYS: (state) => {
    state.isFetchingSurveys = true;
  },
  RESET_FETCHING_SURVEYS: (state) => {
    state.isFetchingSurveys = false;
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

  setMySubmission({ commit }, { submission, newSubmission }) {
    commit('ADD_OR_UPDATE_SUBMISSION', { submission, newSubmission });
  },

  clearSelection({ state, commit }) {
    commit(
      'SET_SUBMISSIONS',
      state.mySubmissions.map((item) => ({
        ...item,
        options: {
          ...item.options,
          selected: false,
        },
      }))
    );
  },

  /*
   * You might need to refresh the list after some actions based on the filter.
   * For example, if you filter drafts only, the item should be removed from the list after submit.
   */
  refreshMySubmissions({ state, commit, rootGetters }) {
    let submissions = [];
    const user = rootGetters['auth/user']._id;
    const isAllTypes = state.filter.type.length === 0;

    if (isAllTypes || state.filter.type.includes(SubmissionTypes.LOCAL_DRAFTS)) {
      submissions.push(...state.mySubmissions.filter((item) => item.options.draft && item.options.local));
    }
    if (isAllTypes || state.filter.type.includes(SubmissionTypes.SERVER_DRAFTS)) {
      submissions.push(...state.mySubmissions.filter((item) => item.options.draft && !item.options.local));
    }
    if (isAllTypes || state.filter.type.includes(SubmissionTypes.SUBMITTED)) {
      submissions.push(...state.mySubmissions.filter((item) => !item.options.draft && item.meta.creator === user));
    }
    if (isAllTypes || state.filter.type.includes(SubmissionTypes.SUBMITTED_AS_PROXY)) {
      submissions.push(...state.mySubmissions.filter((item) => !item.options.draft && item.meta.proxyUserId === user));
    }
    if (isAllTypes || state.filter.type.includes(SubmissionTypes.RESUBMITTED)) {
      submissions.push(...state.mySubmissions.filter((item) => !item.options.draft && item.meta.resubmitter === user));
    }
    if (state.filter.hideArchived) {
      submissions = submissions.filter((item) => !item.meta.archived);
    }
    if (state.filter.surveyIds.length > 0) {
      const surveyIds = state.filter.surveyIds.map((item) => item._id);
      submissions = submissions.filter((item) => surveyIds.includes(item.meta.survey.id));
    }

    submissions = submissions
      // Remove duplication
      .filter(
        (item, index, ary) =>
          ary.findIndex((i) => i._id === item._id && i.options.draft === item.options.draft) === index
      )
      // Always sort by date modified DESC
      .sort(sortByModifiedDate);

    commit('SET_SUBMISSIONS', submissions);
  },

  /*
   * Saves submission into IDB and remove the server draft to ensure truth of source
   * - When start new survey
   * - Every time, user move to next step while surveying (real-time save draft)
   * - Download server draft
   * - Resubmit
   */
  async saveToLocal({ state, commit, dispatch }, submission) {
    // Save to IDB
    try {
      await db.persistSubmission(sanitizeSubmission(submission));
    } catch (e) {
      console.warn('Failed to save submission into IDB', e);

      return null;
    }

    // Delete server draft if exists
    const exist = state.mySubmissions.some(
      (item) => item._id === submission._id && item.options.draft && !item.options.local
    );
    if (exist) {
      try {
        await api.delete(`/drafts/${submission._id}`);
      } catch (e) {
        console.log("%s doesn't exist on Server - it's okay", submission._id);
      }
    }

    // Update list
    const newSubmission = cloneDeep(submission);
    newSubmission.options = {
      draft: true,
      local: true,
      selected: get(submission, 'options.selected', false),
    };

    // Draft never being archived
    delete newSubmission.meta.archived;

    if (get(submission, 'options.draft', false)) {
      // If draft, update it
      commit('ADD_OR_UPDATE_SUBMISSION', { submission, newSubmission });
      commit('DECREASE_SERVER_TOTAL');
    } else {
      // If submission, add to the list
      commit('ADD_OR_UPDATE_SUBMISSION', { submission: newSubmission });
      await dispatch('fetchDrafts');
    }

    commit('INCREASE_LOCAL_TOTAL');
    dispatch('refreshMySubmissions');

    return newSubmission;
  },

  /*
   * Saves submission to the server and remove local draft to ensure truth of source
   * - Upload local draft
   * - `Save option` when leaving survey
   */
  async saveToServer({ commit, dispatch }, submission) {
    // Save to server
    try {
      await api.post('/drafts', sanitizeSubmission(submission));
    } catch (e) {
      console.warn('Failed to save submission to server', e);

      return null;
    }

    // Delete local draft
    try {
      await db.deleteSubmission(submission._id);
    } catch (e) {
      console.log("%s doesn't exist on IDB - it's okay", submission._id);
    }

    // Update list
    const newSubmission = cloneDeep(submission);
    newSubmission.options = {
      draft: true,
      local: false,
      selected: submission.options ? submission.options.selected : false,
    };
    // Draft never being archived
    delete newSubmission.meta.archived;

    if (get(submission, 'options.draft', false)) {
      // If draft, replace it
      commit('ADD_OR_UPDATE_SUBMISSION', { submission, newSubmission });
      commit('DECREASE_LOCAL_TOTAL');
    } else {
      // If submission, just add to the list
      commit('ADD_OR_UPDATE_SUBMISSION', { submission: newSubmission });
      await dispatch('fetchDrafts');
    }

    commit('INCREASE_SERVER_TOTAL');
    dispatch('refreshMySubmissions');

    return newSubmission;
  },

  /*
   * Delete multiple local/server drafts
   * - Bulk delete from the selection
   * - Delete from the item card
   * - After successful submit
   * - `Discard changes` option when leaving survey
   */
  async deleteDrafts({ commit, state, dispatch }, ids) {
    if (ids.length === 0) {
      return true;
    }

    let result = false;
    try {
      const drafts = state.mySubmissions.filter((item) => item.options.draft);
      const localIds = ids.filter((id) => drafts.some((item) => item._id === id && item.options.local));
      const serverIds = ids.filter((id) => drafts.some((item) => item._id === id && !item.options.local));

      await Promise.all([
        // Delete from IDB
        ...localIds.map((id) => db.deleteSubmission(id)),
        // Delete from server
        ...(serverIds.length > 0 ? [api.post('/drafts/bulk-delete', { ids: serverIds })] : []),
      ]);

      // Update state
      ids.forEach((id) => {
        commit('DELETE_SUBMISSION', { id, draft: true });
      });

      localIds.forEach(() => commit('DECREASE_LOCAL_TOTAL'));
      serverIds.forEach(() => commit('DECREASE_SERVER_TOTAL'));

      result = true;
    } catch (e) {
      console.warn('Failed to delete submissions', ...ids, e);
    }

    // Update my drafts
    await dispatch('fetchDrafts');

    return result;
  },

  /*
   * Archives multiple submissions
   * - Bulk archive from the selection
   * - Archive from the item card
   */
  async archiveSubmissions({ commit, state, dispatch }, { ids, reason }) {
    if (ids.length === 0) {
      return true;
    }

    let result = false;
    try {
      // Bulk archive
      await api.post(`/submissions/bulk-archive?set=true&reason=${reason}`, { ids });

      // Set `meta.archived=true`
      ids.forEach((id) => {
        const match = state.mySubmissions.find((item) => item._id === id && !item.options.draft);
        if (match) {
          const newSubmission = { ...match, meta: { ...match.meta, archived: true } };
          commit('ADD_OR_UPDATE_SUBMISSION', { submission: match, newSubmission });
        }
        if (state.filter.hideArchived) {
          commit('DECREASE_SERVER_TOTAL');
        }
      });

      dispatch('refreshMySubmissions');

      result = true;
    } catch (e) {
      console.warn('Failed to archive submissions', ...ids);
    }

    return result;
  },

  /*
   * Delete multiple submissions.
   * - Bulk delete from the selection
   * - Delete from the item card
   */
  async deleteSubmissions({ commit }, ids) {
    if (ids.length === 0) {
      return true;
    }

    let result = false;
    try {
      // Bulk delete
      await api.post('/submissions/bulk-delete', { ids });

      // Remove from the list
      ids.forEach((id) => {
        commit('DELETE_SUBMISSION', { id, draft: false });
        commit('DECREASE_SERVER_TOTAL');
      });

      result = true;
    } catch (e) {
      console.warn('Failed to delete submissions', ...ids);
    }

    return result;
  },

  /*
   * Get draft from the state, if not found, fetch from the server
   * - Start new survey
   * - Reload survey page
   */
  async getDraft({ dispatch, state }, id) {
    // Find from the state
    let draft = state.mySubmissions.find((item) => item._id === id && item.options.draft);
    if (draft) {
      return draft;
    }

    // Find from IDB
    const drafts = await dispatch('fetchDrafts');
    draft = drafts.find((item) => item._id === id);
    if (draft) {
      return draft;
    }

    // Fetch from the server, and save it to IDB as this will be used in surveying
    try {
      const { data } = await api.get(`/submissions/${id}?pure=1`);
      return await dispatch('saveToLocal', data);
    } catch (e) {
      console.warn('Failed to fetch submission', id);
    }

    return null;
  },

  /*
   * Start survey
   * It generate new submission and save as a local draft.
   * - New submission in the survey result page
   * - Start survey from the survey detail page
   */
  async startDraft({ dispatch }, { survey, submitAsUser = undefined, version = 0 }) {
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

    // Save to IDB
    await dispatch('saveToLocal', submission);

    // Update my drafts
    await dispatch('fetchDrafts');

    router.push({
      name: 'submissions-drafts-detail',
      params: { id: submission._id },
      query: { minimal_ui: router.currentRoute.query.minimal_ui },
    });
  },

  /*
   * Submit multiple draft
   * It returns `resultItems` that is used in the result dialog
   * - Bulk submit from the selection
   * - Submit from the item card
   */
  async submitDrafts({ dispatch }, drafts) {
    if (drafts.length === 0) {
      return [];
    }

    const resultItems = [];

    let surveysMap = {};
    // We do process one by one to generate result
    for (const draft of drafts) {
      try {
        const { id, version } = draft.meta.survey;

        // Cache for surveys
        if (!surveysMap[id]) {
          surveysMap = {
            ...surveysMap,
            [id]: await dispatch('surveys/fetchSurvey', { id, version }, { root: true }),
          };
        }
        // Upload resources
        await uploadFileResources(this, surveysMap[id], draft, true);

        // Submit
        const response = draft.meta.dateSubmitted
          ? await api.put(`/submissions/${draft._id}`, draft)
          : await api.post('/submissions', draft);
        resultItems.push(...parseSubmitResponse(response, draft._id));

        // Delete drafts
        await dispatch('deleteDrafts', [draft._id]);
      } catch (e) {
        console.warn('Failed to submit drafts', e, drafts);

        resultItems.push({
          title: 'Error',
          body: get(e, 'response.data.message', e),
          logs: get(e, 'response.data.logs'),
          error: true,
        });
      }
    }

    return resultItems;
  },

  /*
   * Fetch all my drafts (server + local)
   */
  async fetchDrafts({ commit, state, rootGetters }) {
    let drafts = [];

    // Fetch local
    try {
      drafts = await db.getAllSubmissions();

      // Filter my submissions
      const user = rootGetters['auth/user']._id;
      drafts = drafts.filter(
        (item) => item.meta.resubmitter === user || item.meta.proxyUserId === user || item.meta.creator === user
      );
    } catch (e) {
      console.warn('Failed to get all submissions from the IDB', e);
    }

    // Fetch server
    try {
      const { data } = await api.get('/drafts?draft=1');
      drafts.push(...data.submissions.map(sanitizeSubmission));
    } catch (e) {
      console.warn('Failed to fetch drafts with filter', state.filter, e);
    }

    commit('SET_DRAFTS', drafts);

    return drafts;
  },

  /*
   * Fetch my drafts from IDB
   */
  async fetchLocal({ commit, state, rootGetters }) {
    // Return immediately if not a local draft filter
    if (state.filter.type.length > 0 && !state.filter.type.includes(SubmissionTypes.LOCAL_DRAFTS)) {
      commit('SET_LOCAL_TOTAL', 0);

      return [];
    }

    let drafts = [];
    try {
      drafts = await db.getAllSubmissions();

      // Filter my submissions
      const user = rootGetters['auth/user']._id;
      drafts = drafts.filter(
        (item) => item.meta.resubmitter === user || item.meta.proxyUserId === user || item.meta.creator === user
      );

      // Filter by `dateModified` is less than the last element from the list
      const [lastSubmission] = state.mySubmissions.slice(-1);

      if (lastSubmission) {
        const lastDate = new Date(lastSubmission.meta.dateModified).valueOf();
        drafts = drafts.filter((item) => new Date(item.meta.dateModified).valueOf() < lastDate);
      }

      // Filter by survey
      if (state.filter.surveyIds.length > 0) {
        drafts = drafts.filter((item) => state.filter.surveyIds.some((id) => item.meta.survey.id === id));
      }

      if (!lastSubmission) {
        commit('SET_LOCAL_TOTAL', drafts.length);
      }
    } catch (e) {
      console.warn('Failed to get all submissions from the IDB', e);
      commit('SET_LOCAL_TOTAL', 0);
    }

    return drafts.map((item) => ({
      ...item,
      options: {
        draft: true,
        local: true,
        selected: false,
      },
    }));
  },

  /*
   * Fetch the drafts/submissions from the server
   */
  async fetchServer({ commit, state }) {
    // Return immediately if no server data
    if (state.serverRemain === 0) {
      return [];
    }

    // Return immediately if not a server filter
    if (state.filter.type.length === 1 && state.filter.type.includes(SubmissionTypes.LOCAL_DRAFTS)) {
      commit('SET_SERVER_TOTAL', 0);
      commit('SET_SERVER_REMAIN', 0);

      return [];
    }

    const params = new URLSearchParams();
    params.append('limit', PER_PAGE.toString());

    // Filter by `dateModified` is less than the last element from the list
    const [lastSubmission] = state.mySubmissions.slice(-1);
    if (lastSubmission) {
      params.append('lastDateModified', lastSubmission.meta.dateModified);
    }

    // Filter by type
    const isAllTypes = state.filter.type.length === 0;
    if (isAllTypes || state.filter.type.includes(SubmissionTypes.SERVER_DRAFTS)) {
      params.append('draft', '1');
    }
    if (isAllTypes || state.filter.type.includes(SubmissionTypes.SUBMITTED)) {
      params.append('creator', '1');
    }
    if (isAllTypes || state.filter.type.includes(SubmissionTypes.SUBMITTED_AS_PROXY)) {
      params.append('proxyUserId', '1');
    }
    if (isAllTypes || state.filter.type.includes(SubmissionTypes.RESUBMITTED)) {
      params.append('resubmitter', '1');
    }

    // Filter by archive state
    if (state.filter.hideArchived) {
      params.append('hideArchived', '1');
    }

    // Filter by surveys
    state.filter.surveyIds.forEach((id) => {
      params.append('surveyIds[]', id);
    });

    let submissions = [];
    try {
      const { data } = await api.get(`/drafts?${params}`);
      submissions = data.submissions;

      commit('SET_SERVER_REMAIN', data.total);
      if (!lastSubmission) {
        commit('SET_SERVER_TOTAL', data.total);
      }
    } catch (e) {
      console.warn('Failed to fetch drafts with filter', state.filter, e);
    }

    return submissions;
  },

  /*
   * Fetch the data based filer and make the list
   * - Scroll to bottom (infinite loading)
   */
  async fetchSubmissions({ commit, state, dispatch }, reset = false) {
    if (state.isFetchingSubmissions) {
      return;
    }

    commit('SET_FETCHING_SUBMISSIONS');

    if (reset) {
      commit('SET_SUBMISSIONS', []);
      commit('SET_LOCAL_TOTAL', -1);
      commit('SET_SERVER_TOTAL', -1);
      commit('SET_SERVER_REMAIN', -1);
    }

    let localData = await dispatch('fetchLocal');
    let serverData = await dispatch('fetchServer');

    // Resolve conflicts by choosing the latest date modified submission
    const uniqueSubmissions = [];
    const deleteFromLocal = [];
    const deleteFromServer = [];
    // Always choose the item that has the latest modified date
    // If two items has the same modified dates, choose server draft
    const newSubmissions = [...serverData, ...localData].sort(sortByModifiedDate);
    newSubmissions.forEach((item) => {
      // Existing draft win - means we have duplicated draft in both server and local.
      // So, we should remove others to ensure the source of truth.
      const existingDraft = uniqueSubmissions.some((i) => i.options.draft && item.options.draft && i._id === item._id);
      if (existingDraft) {
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
    commit('SET_SUBMISSIONS', [...state.mySubmissions, ...uniqueSubmissions.slice(0, PER_PAGE)]);
    commit('RESET_FETCHING_SUBMISSIONS');
  },

  /*
   * Fetch surveys of the submissions/drafts based on the filter
   */
  async fetchSurveys({ commit, state, rootGetters }) {
    if (state.isFetchingSurveys) {
      return;
    }

    commit('SET_FETCHING_SURVEYS');
    commit('SET_SURVEYS', []);

    const params = new URLSearchParams();
    const isAllTypes = state.filter.type.length === 0;

    if (isAllTypes || state.filter.type.includes(SubmissionTypes.LOCAL_DRAFTS)) {
      try {
        let drafts = await db.getAllSubmissions();

        // Filter my submissions
        const user = rootGetters['auth/user']._id;
        drafts = drafts.filter(
          (item) => item.meta.resubmitter === user || item.meta.proxyUserId === user || item.meta.creator === user
        );

        const surveyIds = [
          ...new Set(drafts.filter((item) => (typeof item.meta.survey.id === 'string' ? item.meta.survey.id : ''))),
        ].filter(Boolean);
        surveyIds.forEach((item) => {
          params.append('localSurveyIds[]', item.meta.survey.id);
        });
      } catch (e) {
        console.warn('Failed to get all submissions from the IDB', e);
      }
    }
    if (isAllTypes || state.filter.type.includes(SubmissionTypes.SERVER_DRAFTS)) {
      params.append('draft', '1');
    }
    if (isAllTypes || state.filter.type.includes(SubmissionTypes.SUBMITTED)) {
      params.append('creator', '1');
    }
    if (isAllTypes || state.filter.type.includes(SubmissionTypes.SUBMITTED_AS_PROXY)) {
      params.append('proxyUserId', '1');
    }
    if (isAllTypes || state.filter.type.includes(SubmissionTypes.RESUBMITTED)) {
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

    commit('RESET_FETCHING_SURVEYS');
  },

  /*
   * Fetch the initial data - drafts, surveys, submissions
   * - After login success
   * - On App was created
   */
  async initialize({ dispatch }) {
    await dispatch('fetchDrafts');
    await dispatch('fetchSubmissions', true);
    await dispatch('fetchSurveys');
  },
};

export const useSubmissionAction = (store, submission) => {
  const theSubmission = isRef(submission) ? submission.value : submission;

  const deleteDraft = async () => {
    return await store.dispatch('submissions/deleteDrafts', [theSubmission._id]);
  };

  const downloadDraft = async () => {
    return await store.dispatch('submissions/saveToLocal', theSubmission);
  };

  const uploadDraft = async () => {
    return await store.dispatch('submissions/saveToServer', theSubmission);
  };

  const submitDraft = async () => {
    return await store.dispatch('submissions/submitDrafts', [theSubmission]);
  };

  const archiveSubmission = async (reason) => {
    return await store.dispatch('submissions/archiveSubmissions', {
      ids: [theSubmission._id],
      reason,
    });
  };

  const deleteSubmission = async () => {
    return await store.dispatch('submissions/deleteSubmissions', [theSubmission._id]);
  };

  const exportJSON = () => {
    // We don't want to export `submission.options` but `meta.archived`.
    const newSubmission = {
      ...sanitizeSubmission(theSubmission),
      meta: theSubmission.meta,
    };
    const dataString = JSON.stringify(newSubmission, null, 2);
    downloadExternal(`data:text/plain;charset=utf-8,${encodeURIComponent(dataString)}`, `${theSubmission._id}.json`);
  };

  return {
    deleteDraft,
    downloadDraft,
    uploadDraft,
    submitDraft,
    archiveSubmission,
    deleteSubmission,
    exportJSON,
  };
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
