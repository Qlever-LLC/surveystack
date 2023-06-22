import api from '@/services/api.service';
import { isEqual } from 'lodash';

const PER_PAGE = 10;

const createInitialState = () => ({
  isDraftTab: true,
  isFetchingSurveys: false,
  surveys: [],
  isLoading: false,
  submissions: [],
  selectedIds: [],
  page: 1,
  totalPage: 1,
  filter: {
    surveyIds: [],
    hideArchived: true,
    resubmitter: true,
    proxyUserId: true,
    creator: true,
  },
});

const initialState = createInitialState();

const getters = {
  isFetchingSurveys: (state) => state.isFetchingSurveys,
  isDraftTab: (state) => state.isDraftTab,
  isLoading: (state) => state.isLoading,
  surveys: (state) => state.surveys,
  submissions: (state) => state.submissions,
  page: (state) => state.page,
  totalPage: (state) => state.totalPage,
  filter: (state) => state.filter,
  filterType: (state) => {
    const indexes = [];
    if (state.filter.creator) indexes.push(0);
    if (state.filter.proxyUserId) indexes.push(1);
    if (state.filter.resubmitter) indexes.push(2);
    return indexes;
  },
  isSelected: (state) => (id) => state.selectedIds.includes(id),
  selected: (state) => state.submissions.filter((item) => state.selectedIds.includes(item._id)),
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
  SET_TAB: (state, isDraftTab) => {
    state.isDraftTab = isDraftTab;
  },
  SET_SURVEYS: (state, surveys) => {
    state.surveys = surveys;
  },
  SET_SUBMISSIONS: (state, submissions) => {
    state.submissions = submissions;
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

  setIsDraftTab({ commit }, isDraftTab) {
    commit('SET_TAB', isDraftTab);
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
  async fetchSubmissions({ state, commit }) {
    commit('SET_LOADING', true);

    const params = new URLSearchParams();
    params.append('skip', (state.page - 1) * PER_PAGE);
    params.append('limit', PER_PAGE);

    state.filter.surveyIds.forEach((id) => {
      params.append('surveyIds[]', id);
    });
    if (state.filter.resubmitter) {
      params.append('resubmitter', '1');
    }
    if (state.filter.proxyUserId) {
      params.append('proxyUserId', '1');
    }
    if (state.filter.creator) {
      params.append('creator', '1');
    }
    if (state.filter.hideArchived) {
      params.append('hideArchived', '1');
    }

    try {
      const { data } = await api.get(`/submissions/my-submissions?${params}`);
      commit('SET_SUBMISSIONS', data.content);
      commit('SET_TOTAL_PAGE', Math.ceil(data.pagination.total / PER_PAGE));
      commit('CLEAR_SELECTION');
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
  async fetchSurveys({ commit, state }) {
    if (state.isFetchingSurveys) {
      return;
    }

    commit('SET_FETCHING_SURVEYS', true);
    commit('SET_SURVEYS', []);

    const params = new URLSearchParams();
    if (state.filter.resubmitter) {
      params.append('resubmitter', '1');
    }
    if (state.filter.proxyUserId) {
      params.append('proxyUserId', '1');
    }
    if (state.filter.creator) {
      params.append('creator', '1');
    }
    if (state.filter.hideArchived) {
      params.append('hideArchived', '1');
    }

    try {
      const { data } = await api.get(`/surveys/my-submissions?${params}`);
      commit('SET_SURVEYS', data);
    } catch (e) {
      console.warn('Failed to fetch surveys of my submissions', state.filter, e);
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
