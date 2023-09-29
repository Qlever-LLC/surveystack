import api from '@/services/api.service';
import { get, isEqual } from 'lodash';
import * as db from '@/store/db';
import { uploadFileResources } from '@/utils/resources';
import { createSubmissionFromSurvey, parseSubmitResponse } from '@/utils/submissions';
import router from '@/router';

const PER_PAGE = 10;

const sortByModifiedDate = (a, b) => new Date(b.meta.dateModified).valueOf() - new Date(a.meta.dateModified).valueOf();

const createInitialState = () => ({
  isFetchingSurveys: false,
  isLoading: false,
  draftSurveys: [], //TODO re-unite surveys
  submissionSurveys: [], //TODO re-unite surveys
  submissions: [], //contains submitted surveys
  localDrafts: [], //TODO return these as part of submissions, but with a meta.status 'LOCAL_DRAFT'
  remoteDrafts: [], //TODO return these as part of submissions, but with a meta.status 'DRAFT' or 'READY_TO_SUBMIT'
  drafts: [], //contains localDrafts and remoteDrafts
  selectedIds: [],
  page: 1,
  totalPage: 1,
  filter: {
    surveyIds: [],
    draft: true,
    readyToSubmit: true,
    submitted: true,
    resubmitted: true,
    proxied: true,
    archived: false,
  },
});

const initialState = createInitialState();

const getters = {
  isFetchingSurveys: (state) => state.isFetchingSurveys,
  isLoading: (state) => state.isLoading,
  surveys: (state) => state.draftSurveys.concat(state.submissionSurveys), //TODO sort by name, or better load them together from one endpoint
  submissionSurveys: (state) => state.submissionSurveys,
  submissionsAndDrafts: (state) => {
    let drafts = state.drafts;
    //TODO refactor these filters to be params for the fetch, but make sure they still work for offline situations as well
    if (state.filter.surveyIds.length > 0) {
      drafts = drafts.filter((item) => state.filter.surveyIds.includes(item.meta.survey.id));
    }
    if (!state.filter.draft) {
      drafts = drafts.filter((item) => item.meta.status.length > 0); //drafts do not have a status, so only keep those with a status
    }
    if (!state.filter.readyToSubmit) {
      drafts = drafts.filter((item) => !item.meta.status.some((s) => s.type === 'READY_TO_SUBMIT'));
    }
    //TODO this leads to the first page being (potentially way) longer than PER_PAGE. To improve this, it needs further calculations (especially offset/limit in fetchSubmissions)
    if (state.page === 1) {
      //include all drafts on the first page
      return drafts.concat(state.submissions);
    } else {
      //from the second page, only show submissions
      return state.submissions;
    }
  },
  draftSurveys: (state) => state.draftSurveys,
  readyToSubmit: (state) => state.drafts.filter((item) => item.meta.status.some((i) => i.type === 'READY_TO_SUBMIT')),
  page: (state) => state.page,
  totalPage: (state) => state.totalPage,
  filter: (state) => state.filter,
  filterType: (state) => {
    const indexes = [];
    if (state.filter.draft) indexes.push('draft');
    if (state.filter.readyToSubmit) indexes.push('readyToSubmit');
    if (state.filter.submitted) indexes.push('submitted');
    if (state.filter.resubmitted) indexes.push('resubmitted');
    if (state.filter.proxied) indexes.push('proxied');
    if (state.filter.archived) indexes.push('archived');
    return indexes;
  },
  isLocal: (state) => (id) => state.localDrafts.some((item) => item._id === id), //TODO change to isLocallyChanged or locallyModified or offlineChanged or...
  isDraft: (state) => (id) => state.drafts.some((item) => item._id === id),
  isSelected: (state) => (id) => state.selectedIds.includes(id),
  selected: (state, getters) => getters.submissionsAndDrafts.filter((item) => state.selectedIds.includes(item._id)), //TODO REMOVE?
};

const mutations = {
  RESET: (state) => {
    Object.assign(state, createInitialState());
  },
  SET_FETCHING_SURVEYS: (state, isFetching) => {
    state.isFetchingSurveys = isFetching;
  },
  SET_LOADING: (state, loading) => {
    state.isLoading = loading;
  },
  SET_DRAFT_SURVEYS: (state, surveys) => {
    state.draftSurveys = surveys;
  },
  SET_SUBMISSION_SURVEYS: (state, surveys) => {
    state.submissionSurveys = surveys;
  },
  SET_SUBMISSIONS: (state, submissions) => {
    state.submissions = submissions;
  },
  SET_LOCAL_DRAFTS: (state, localDrafts) => {
    state.localDrafts = localDrafts;
  },
  SET_REMOTE_DRAFTS: (state, remoteDrafts) => {
    state.remoteDrafts = remoteDrafts;
  },
  SET_DRAFTS: (state, drafts) => {
    state.drafts = drafts;
  },
  SET_PAGE: (state, page) => {
    state.page = page;
  },
  SET_TOTAL_PAGE: (state, totalPage) => {
    state.totalPage = totalPage;
  },
  SET_FILTER: (state, filter) => {
    state.filter = { ...state.filter, ...filter };
  },
  SELECT_SUBMISSION: (state, submission) => {
    state.selectedIds = [...new Set([...state.selectedIds, submission._id])];
  },
  DESELECT_SUBMISSION: (state, submission) => {
    state.selectedIds = state.selectedIds.filter((id) => id !== submission._id);
  },
  SET_SELECTION: (state, selection) => {
    state.selectedIds = selection;
  },
  CLEAR_SELECTION: (state) => {
    state.selectedIds = [];
  },
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },

  async setPage({ commit, dispatch }, page) {
    commit('SET_PAGE', page);
    await dispatch('fetchSubmissions');
  },

  selectSubmission({ commit }, submission) {
    commit('SELECT_SUBMISSION', submission);
  },

  deselectSubmission({ commit }, submission) {
    commit('DESELECT_SUBMISSION', submission);
  },

  clearSelection({ commit }) {
    commit('CLEAR_SELECTION');
  },

  async setFilter({ state, commit, dispatch }, filter) {
    // Not changed
    const newFilter = { ...state.filter, ...filter };
    if (isEqual(state.filter, newFilter)) {
      return;
    }

    commit('SET_FILTER', filter);
    commit('SET_PAGE', 1);
    await dispatch('fetchSubmissions');
  },

  /*
   * Load submissions
   * - Filter is changed
   * - Page is changed
   */
  async fetchSubmissions({ state, commit, getters }) {
    commit('SET_LOADING', true);

    //TODO take drafts into account for pagination. Currently, drafts are just added before the submissions on the first page, making the first page (possible way) longer than PER_PAGE
    const params = new URLSearchParams();
    params.append('skip', (state.page - 1) * PER_PAGE);
    params.append('limit', PER_PAGE);

    state.filter.surveyIds.forEach((id) => {
      params.append('surveyIds[]', id);
    });
    if (state.filter.submitted) {
      params.append('submitted', '1');
    }
    if (state.filter.resubmitted) {
      params.append('resubmitted', '1');
    }
    if (state.filter.proxied) {
      params.append('proxied', '1');
    }
    if (state.filter.archived) {
      params.append('archived', '1');
    }

    try {
      const { data } = await api.get(`/submissions/my-submissions?${params}`);
      commit('SET_SUBMISSIONS', data.content);
      commit('SET_TOTAL_PAGE', Math.ceil(data.pagination.total / PER_PAGE));
      const ids = data.content.map((item) => item._id);
      commit(
        'SET_SELECTION',
        state.selectedIds.filter((id) => ids.includes(id))
      );
    } catch (e) {
      console.warn('Failed to fetch my submissions', params.toString());
    }

    commit('SET_LOADING', false);
  },

  /*
   * Archives multiple submissions
   * - Bulk archive from the selection
   * - Archive from the item card
   */
  async archiveSubmissions({ dispatch }, { ids, reason }) {
    if (ids.length === 0) {
      return true;
    }

    let success = true;
    try {
      // Bulk archive
      await api.post(`/submissions/bulk-archive?set=true&reason=${reason}`, { ids });
      await dispatch('fetchSubmissions');
    } catch (e) {
      console.warn('Failed to archive submissions', ...ids, e);
      success = false;
    }

    return success;
  },

  /*
   * Restore multiple submissions
   * - Bulk restore from the selection
   * - Restore from the item card
   */
  async restoreSubmissions({ dispatch }, ids) {
    if (ids.length === 0) {
      return true;
    }

    let success = true;
    try {
      // Bulk restore
      await api.post('/submissions/bulk-archive?set=false', { ids });
      await dispatch('fetchSubmissions');
    } catch (e) {
      console.warn('Failed to restore submissions', ...ids, e);
      success = false;
    }

    return success;
  },

  /*
   * Delete multiple submissions.
   * - Bulk delete from the selection
   * - Delete from the item card
   */
  async deleteSubmissions({ dispatch }, ids) {
    if (ids.length === 0) {
      return true;
    }

    let success = true;
    try {
      // Bulk delete
      await api.post('/submissions/bulk-delete', { ids });
      await dispatch('fetchSubmissions');
    } catch (e) {
      console.warn('Failed to delete submissions', ...ids);
      success = false;
    }

    return success;
  },

  /*
   * Fetch surveys of my submissions
   * - Switching tab
   * - Change filter
   */
  async fetchSubmissionSurveys({ commit, state }) {
    if (state.isFetchingSurveys) {
      return;
    }

    commit('SET_FETCHING_SURVEYS', true);
    commit('SET_SUBMISSION_SURVEYS', []);

    const params = new URLSearchParams();
    if (state.filter.submitted) {
      params.append('submitted', '1');
    }
    if (state.filter.resubmitted) {
      params.append('resubmitted', '1');
    }
    if (state.filter.proxied) {
      params.append('proxied', '1');
    }
    if (state.filter.archived) {
      params.append('archived', '1');
    }

    try {
      const { data } = await api.get(`/surveys/my-submissions?${params}`);
      commit('SET_SUBMISSION_SURVEYS', data);
    } catch (e) {
      console.warn('Failed to fetch surveys of my submissions', state.filter, e);
    }

    commit('SET_FETCHING_SURVEYS', false);
  },

  async fetchLocalDrafts({ commit }) {
    try {
      let localDrafts = await db.getAllSubmissions();
      commit('SET_LOCAL_DRAFTS', localDrafts);
    } catch (e) {
      console.warn('Failed to get all submissions from the IDB', e);
      commit('SET_LOCAL_DRAFTS', []);
    }

    return [];
  },

  /*
   * Delete drafts from the local IDB
   * - Saving remote drafts
   * - Losing on conflicts
   */
  async deleteLocalDrafts({ dispatch }, ids) {
    if (ids.length === 0) {
      return true;
    }

    let success = true;
    for (const id of ids) {
      try {
        await db.deleteSubmission(id);
      } catch (e) {
        console.warn('Failed to delete draft from IDB', id);
        success = false;
      }
    }

    if (success) {
      await dispatch('fetchLocalDrafts');
      await dispatch('refreshDrafts');
    }

    return success;
  },

  /*
   * Save drafts into the local IDB and delete it from the remote server
   * to ensure the source of truth
   */
  async saveLocalDrafts({ dispatch }, submissions) {
    let success = true;

    for (const submission of submissions) {
      try {
        // Save to local IDB
        await db.persistSubmission(submission);
      } catch (e) {
        console.warn('Failed to save the submission into IDB', e);
        success = false;
      }
    }

    await dispatch('fetchLocalDrafts');

    // Delete from remote
    await dispatch(
      'deleteRemoteDrafts',
      submissions.map((item) => item._id)
    );

    return success;
  },

  async fetchRemoteDrafts({ commit }) {
    try {
      const { data } = await api.get('/drafts/my-drafts');
      commit('SET_REMOTE_DRAFTS', data);
      return data;
    } catch (e) {
      console.warn('Failed to fetch drafts with filter', e);
      commit('SET_REMOTE_DRAFTS', []);
    }

    return [];
  },

  /*
   * Delete drafts from the remote server
   * - Saving local drafts
   * - Losing on conflicts
   */
  async deleteRemoteDrafts({ state, commit, dispatch }, ids) {
    if (ids.length === 0) {
      return true;
    }

    try {
      await api.post('/drafts/bulk-delete', { ids });
      commit(
        'SET_REMOTE_DRAFTS',
        state.remoteDrafts.filter((item) => ids.every((id) => id !== item._id))
      );

      await dispatch('refreshDrafts');

      return true;
    } catch (e) {
      console.warn('Failed to delete the draft from the server', e);
    }

    return false;
  },

  /*
   * Save drafts to remote server and delete it from the local IDB
   * to ensure the source of truth
   */
  async saveRemoteDrafts({ state, commit, dispatch }, submissions) {
    let success = true;

    try {
      // Save to the remote
      await api.post('/drafts', submissions);
      const newRemoteDrafts = [...submissions, ...state.remoteDrafts].filter(
        (item, index, ary) => ary.findIndex((i) => i._id === item._id) === index
      );
      commit('SET_REMOTE_DRAFTS', newRemoteDrafts);

      // Delete from local IDB
      await dispatch(
        'deleteLocalDrafts',
        submissions.map((item) => item._id)
      );
    } catch (e) {
      console.warn('Failed to save the submission to the server', e);
      success = false;
    }

    return success;
  },

  /*
   * Resolve conflicts and update drafts state - means this will update the UI
   * - Save local drafts
   * - Delete local drafts
   * - Save remote drafts
   * - Delete remote drafts
   * - After fetch all drafts
   */
  //TODO see this, conflict resolution seems to be implemented already somehow
  async refreshDrafts({ state, commit, dispatch }) {
    const drafts = [];
    const localIdsToDelete = [];
    const remoteIdsToDelete = [];
    const newDrafts = [
      ...state.remoteDrafts.map((item) => ({
        ...item,
        remote: true,
      })),
      ...state.localDrafts,
    ].sort(sortByModifiedDate);
    newDrafts.forEach((item) => {
      // Existing draft win - means we might have duplicated draft in both server and local.
      // So, we should remove others to ensure the source of truth.
      const existingDraft = drafts.some((i) => i._id === item._id);
      if (existingDraft) {
        if (item.remote) {
          remoteIdsToDelete.push(item._id);
        } else {
          localIdsToDelete.push(item._id);
        }
      } else {
        delete item.remote;
        drafts.push(item);
      }
    });

    // Delete lose drafts
    await dispatch('deleteLocalDrafts', localIdsToDelete);
    await dispatch('deleteRemoteDrafts', remoteIdsToDelete);

    commit('SET_DRAFTS', drafts);
    const ids = drafts.map((item) => item._id);
    commit(
      'SET_SELECTION',
      state.selectedIds.filter((id) => ids.includes(id))
    );
  },

  /*
   * Load local/remote drafts
   * - On app starts
   * - After logged in
   * - Refresh submission (draft) page
   */
  async fetchDrafts({ state, commit, dispatch }, shallow = false) {
    if (state.isLoading) {
      return;
    }

    if (!shallow) {
      commit('SET_LOADING', true);
      commit('SET_PAGE', 1);
    }

    await dispatch('fetchLocalDrafts');
    await dispatch('fetchRemoteDrafts');
    await dispatch('refreshDrafts');

    if (!shallow) {
      commit('SET_LOADING', false);
    }
  },

  /*
   * Get draft from the state, if not found, fetch from the server
   * - Start new survey
   * - Reload survey page
   */
  async getDraft({ state, dispatch }, id) {
    // Get the latest drafts and find from the state
    await dispatch('fetchDrafts', true);
    let draft = state.drafts.find((item) => item._id === id);
    if (draft) {
      return draft;
    }

    // Fetch from the server, and save it to IDB as this will be used in surveying
    try {
      const { data } = await api.get(`/submissions/${id}?pure=1`);
      await dispatch('saveLocalDrafts', [data]);

      return data;
    } catch (e) {
      console.warn('Failed to fetch submission', id);
    }

    return null;
  },

  /*
   * Delete multiple local/server drafts
   * - Bulk delete from the selection
   * - Delete from the item card
   * - After submit successfully
   * - `Discard changes` option when leaving survey
   */
  async deleteDrafts({ dispatch }, ids) {
    const localSuccess = await dispatch('deleteLocalDrafts', ids);
    const remoteSuccess = await dispatch('deleteRemoteDrafts', ids);

    return localSuccess && remoteSuccess;
  },

  /*
   * Submit multiple draft
   * It returns `resultItems` that is used in the result dialog
   * - Bulk submit from the selection
   * - Submit from the my draft item card
   */
  async submitDrafts({ dispatch, rootGetters }, drafts) {
    if (drafts.length === 0) {
      return [];
    }

    const resultItems = [];

    // We do process one by one to generate result
    for (const draft of drafts) {
      try {
        const { id, version } = draft.meta.survey;

        let survey = rootGetters['surveys/getSurvey'](id);
        if (!survey) {
          survey = await dispatch('surveys/fetchSurvey', { id, version }, { root: true });
        }

        // Upload resources
        await uploadFileResources(this, survey, draft, true);

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
    await dispatch('saveLocalDrafts', [submission]);
    await dispatch('fetchDraftSurveys');

    router.push({
      name: 'submissions-drafts-detail',
      params: { id: submission._id },
      query: { minimal_ui: router.currentRoute.query.minimal_ui },
    });
  },

  /*
   * Fetch surveys of my drafts
   * - On app starts
   * - After logged in
   * - Start a new survey
   * - Switching tab
   * - Change filter
   */
  async fetchDraftSurveys({ commit, state }) {
    if (state.isFetchingSurveys) {
      return;
    }

    commit('SET_FETCHING_SURVEYS', true);
    commit('SET_DRAFT_SURVEYS', []);

    const remoteAndLocalDrafts = state.localDrafts.concat(state.remoteDrafts);
    let surveyIds = [];
    if (state.filter.draft) {
      surveyIds.push(
        ...remoteAndLocalDrafts
          .filter((item) => !item.meta.status || item.meta.status.every((i) => i.type !== 'READY_TO_SUBMIT'))
          .map((item) => item.meta.survey.id)
      );
    }
    if (state.filter.readyToSubmit) {
      surveyIds.push(
        ...remoteAndLocalDrafts
          .filter((item) => !item.meta.status || item.meta.status.some((i) => i.type === 'READY_TO_SUBMIT'))
          .map((item) => item.meta.survey.id)
      );
    }
    surveyIds = [...new Set(surveyIds)];
    if (surveyIds.length > 0) {
      const params = new URLSearchParams();
      surveyIds.forEach((id) => {
        if (typeof id === 'string') params.append('ids[]', id);
        else console.error('id is not a string:' + id); //TODO prevent root cause for id's not being strings. They look like this example: e\u0012¨¼,Q\u0000\u0001ñ¢g
      });

      try {
        const { data } = await api.get(`/surveys/my-drafts?${params}`);
        commit('SET_DRAFT_SURVEYS', data);
      } catch (e) {
        console.warn('Failed to fetch surveys of my submissions', state.filter, e);
      }
    } else {
      commit('SET_DRAFT_SURVEYS', []);
      commit('SET_FILTER', { surveyIds: [] });
    }

    commit('SET_FETCHING_SURVEYS', false);
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
