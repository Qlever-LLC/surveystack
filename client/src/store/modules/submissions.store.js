import * as db from '@/store/db';
import api from '@/services/api.service';
import { createSubmissionFromSurvey } from '@/utils/submissions';
import router from '@/router';

const PER_PAGE = 10;

export const SubmissionTypes = {
  LOCAL_DRAFTS: 'Drafts on local',
  REMOTE_DRAFTS: 'Drafts on server',
  SUBMITTED: 'Submitted',
  SUBMITTED_AS_PROXY: 'Submitted as proxy',
  RESUBMITTED: 'Resubmitted',
};

const createInitialState = () => ({
  submissions: [],
  localDrafts: [],
  surveys: [],
  filter: {
    type: [],
    survey: [],
  },
  localTotal: 0,
  remoteTotal: 0,
  loading: {},
});

const initialState = createInitialState();

const getters = {
  submissions: (state) => state.submissions,
  surveys: (state) => state.surveys,
  total: (state) => state.remoteTotal + state.localTotal,
  filter: (state) => state.filter,
  isFetching: (state) => !!state.loading.fetch,
  isLoading: (state) => Object.keys(state.loading) > 0,
  getLoading: (state, id) => state.loading[id] || false,
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
    state.localTotal = state.localDrafts.length;
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
    state.localTotal = state.localDrafts.length;
  },
  REMOTE_TOTAL: (state, remoteTotal) => {
    state.remoteTotal = remoteTotal;
  },
  SURVEYS: (state, surveys) => {
    state.surveys = surveys;
  },
  FILTER: (state, filter) => {
    state.filter = { ...state, filter, ...filter };
  },
  LOADING_ON: (state, loading) => {
    state.loading = { ...state.loading, ...loading };
  },
  LOADING_OFF: (state, id) => {
    delete state.loading[id];
  },
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  async setLocal({ commit }, submission) {
    await db.saveToIndexedDB(db.stores.SUBMISSIONS, submission);
    commit('ADD_OR_UPDATE_LOCAL_DRAFT', submission);
    commit('ADD_OR_UPDATE_SUBMISSION', submission);
    return submission;
  },
  async remove({ commit, state }, id) {
    commit('LOADING_ON', { [id]: 'removing' });
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
    commit('LOADING_OFF', id);
  },
  setFilter({ commit }, filter) {
    commit('FILTER', filter);
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
    commit('LOADING_ON', { [id]: 'resubmit' });

    const { data } = await api.get(`/submissions/${id}?pure=1`);
    commit('ADD_OR_UPDATE_LOCAL_DRAFT', data);
    commit('ADD_OR_UPDATE_SUBMISSION', data);

    commit('LOADING_OFF', id);

    router.push({
      name: 'submissions-drafts-detail',
      params: { id },
      query: { minimal_ui: router.currentRoute.query.minimal_ui },
    });
  },
  async fetchLocalSubmissions({ commit }) {
    commit('LOADING_ON', { fetch: true });
    const response = await new Promise((resolve) => {
      db.openDb(() => {
        db.getAllSubmissions(resolve);
      });
    });
    commit('SET_LOCAL_DRAFTS', response);
    commit('LOADING_OFF', 'fetch');
    return response;
  },
  async fetchRemoteSubmissions({ commit, state, dispatch }, reset = false) {
    commit('LOADING_ON', { fetch: true });

    if (reset) {
      commit('SET_SUBMISSIONS', []);
    }

    const type =
      state.filter.type.length === 0
        ? [
            SubmissionTypes.LOCAL_DRAFTS,
            SubmissionTypes.REMOTE_DRAFTS,
            SubmissionTypes.SUBMITTED,
            SubmissionTypes.SUBMITTED_AS_PROXY,
            SubmissionTypes.RESUBMITTED,
          ]
        : state.filter.type;

    const [lastSubmission] = state.submissions;
    let remoteData = [];
    let localData = [];

    // Fetch if remote has data
    if (state.remoteTotal >= 0) {
      const params = new URLSearchParams();

      if (lastSubmission) {
        params.append('date', lastSubmission.meta.dateModified);
      }
      if (type.includes(SubmissionTypes.REMOTE_DRAFTS)) {
        params.append('draft', '1');
      }
      if (type.includes(SubmissionTypes.SUBMITTED)) {
        params.append('creator', '1');
      }
      if (type.includes(SubmissionTypes.SUBMITTED_AS_PROXY)) {
        params.append('userProxyId', '1');
      }
      if (type.includes(SubmissionTypes.RESUBMITTED)) {
        params.append('resubmitter', '1');
      }
      state.filer.survey.forEach((survey) => {
        params.append('survey[]', survey);
      });

      try {
        const { data } = await api.get(`/drafts?${params}`);
        remoteData = data.submissions;

        // Update remote total count
        commit('REMOTE_TOTAL', data.total || -1);

        // If the surveys is updated by changes of type
        if (JSON.stringify(state.filter.survey) !== data.surveys) {
          commit('SURVEYS', data.surveys);
          dispatch('setFilter', { surveys: [] });
        }
      } catch (e) {
        console.warn('Failed to fetch drafts with filter', type, e);
      }
    }

    if (type.includes(SubmissionTypes.LOCAL_DRAFTS)) {
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
        localData = localData.filter((item) =>
          state.filter.survey.some((survey) => item.meta.survey.id === survey._id)
        );
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

    commit('LOADING_OFF', 'fetch');
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
