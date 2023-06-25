import * as db from '@/store/db';
import api from '@/services/api.service';
import { createSubmissionFromSurvey, parseSubmitResponse } from '@/utils/submissions';
import { uploadFileResources } from '@/utils/resources';
import { get, isEqual } from 'lodash';
import router from '@/router';

const PER_PAGE = 10;

const sortByModifiedDate = (a, b) => new Date(b.meta.dateModified).valueOf() - new Date(a.meta.dateModified).valueOf();

const createInitialState = () => ({
  isFetchingSurveys: false,
  surveys: [],
  isLoading: false,
  page: 1,
  localDrafts: [],
  remoteDrafts: [],
  drafts: [],
  selectedIds: [],
  filter: {
    surveyIds: [],
    local: true,
    remote: true,
  },
});

const initialState = createInitialState();

const getters = {
  isFetchingSurveys: (state) => state.isFetchingSurveys,
  isLoading: (state) => state.isLoading,
  page: (state) => state.page,
  totalPage: (state, getters) => (state.isLoading ? 1 : Math.ceil(getters.drafts.length / PER_PAGE)),
  readyToSubmit: (state) => state.drafts.filter((item) => item.meta.status.some((i) => i.type === 'READY_TO_SUBMIT')),
  surveys: (state) => state.surveys,
  drafts: (state, getters) => {
    let drafts = state.drafts;
    if (state.filter.surveyIds.length > 0) {
      drafts = drafts.filter((item) => state.filter.surveyIds.includes(item.meta.survey.id));
    }
    if (!state.filter.local) {
      drafts = drafts.filter((item) => getters.isRemote(item._id));
    }
    if (!state.filter.remote) {
      drafts = drafts.filter((item) => getters.isLocal(item._id));
    }

    return drafts.slice(state.page - 1, state.page - 1 + PER_PAGE);
  },
  filter: (state) => state.filter,
  filterType: (state) => {
    const indexes = [];
    if (state.filter.local) indexes.push(0);
    if (state.filter.remote) indexes.push(1);
    return indexes;
  },
  isLocal: (state) => (id) => state.localDrafts.some((item) => item._id === id),
  isRemote: (state) => (id) => state.remoteDrafts.some((item) => item._id === id),
  isSelected: (state) => (id) => state.selectedIds.includes(id),
  selected: (state, getters) => getters.drafts.filter((item) => state.selectedIds.includes(item._id)),
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
  SET_SURVEYS: (state, surveys) => {
    state.surveys = surveys;
  },
  SET_PAGE: (state, page) => {
    state.page = page;
  },
  SET_FILTER: (state, filter) => {
    state.filter = { ...state.filter, ...filter };
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
  SELECT_DRAFT: (state, draft) => {
    state.selectedIds = [...new Set([...state.selectedIds, draft._id])];
  },
  DESELECT_DRAFT: (state, draft) => {
    state.selectedIds = state.selectedIds.filter((id) => id !== draft._id);
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

  async setFilter({ state, commit, dispatch }, filter) {
    // Not changed
    const newFilter = { ...state.filter, ...filter };
    if (isEqual(state.filter, newFilter)) {
      return;
    }

    commit('SET_FILTER', filter);
    commit('SET_PAGE', 1);
    await dispatch('fetchDrafts');
  },

  setPage({ commit }, page) {
    commit('SET_PAGE', page);
  },

  selectDraft({ commit }, draft) {
    commit('SELECT_DRAFT', draft);
  },

  deselectDraft({ commit }, draft) {
    commit('DESELECT_DRAFT', draft);
  },

  clearSelection({ commit }) {
    commit('CLEAR_SELECTION');
  },

  async fetchLocalDrafts({ commit, rootGetters }) {
    try {
      let localDrafts = await db.getAllSubmissions();

      const user = rootGetters['auth/user']._id;
      localDrafts = localDrafts
        ? localDrafts.filter(
            (item) => item.meta.resubmitter === user || item.meta.proxyUserId === user || item.meta.creator === user
          )
        : [];

      commit('SET_LOCAL_DRAFTS', localDrafts);

      return localDrafts;
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
  async refreshDrafts({ state, commit, dispatch }) {
    const drafts = [];
    const localIdsToDelete = [];
    const remoteIdsToDelete = [];
    const newDrafts = [...state.remoteDrafts.map((item) => ({ ...item, remote: true })), ...state.localDrafts].sort(
      sortByModifiedDate
    );
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
    await dispatch('fetchSurveys');

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
  async fetchSurveys({ commit, state }) {
    if (state.isFetchingSurveys) {
      return;
    }

    commit('SET_FETCHING_SURVEYS', true);
    commit('SET_SURVEYS', []);

    let surveyIds = [];
    if (state.filter.local) {
      surveyIds.push(
        ...state.localDrafts.map((item) => item.meta.survey.id).filter((item) => typeof item === 'string')
      );
    }
    if (state.filter.remote) {
      surveyIds.push(
        ...state.remoteDrafts.map((item) => item.meta.survey.id).filter((item) => typeof item === 'string')
      );
    }
    surveyIds = [...new Set(surveyIds)];
    if (surveyIds.length > 0) {
      const params = new URLSearchParams();
      surveyIds.forEach((id) => {
        params.append('ids[]', id);
      });

      try {
        const { data } = await api.get(`/surveys/my-drafts?${params}`);
        commit('SET_SURVEYS', data);
      } catch (e) {
        console.warn('Failed to fetch surveys of my submissions', state.filter, e);
      }
    } else {
      commit('SET_SURVEYS', []);
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
