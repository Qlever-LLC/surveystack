/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable-next-line no-await-in-loop */
import * as db from '@/store/db';
import api from '@/services/api.service';

import { isOnline } from '@/utils/surveyStack';

const createInitialState = () => ({
  surveys: [],
  pinned: [],
});

const initialState = createInitialState();

const getters = {
  getSurvey: (state) => (id) => state.surveys.find((survey) => survey._id === id),
  getPinnedSurvey: (state) => (id) => state.pinned.find((pinned) => pinned._id === id),
  getPinned:
    (state) =>
    (prefix = '', excludePath = '') => {
      const prefixed = state.pinned.filter((s) => s.meta.group.path && s.meta.group.path.startsWith(prefix));
      const excluded = prefixed.filter((s) => s.meta.group.path !== excludePath);
      return excluded;
    },
  getPinnedSurveyForGroup: (state, getters) => (groupId) => {
    const seenIds = new Set();
    const pinnedSurveys = state.pinned
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((pinnedSurvey) => {
        const survey = getters.getPinnedSurvey(pinnedSurvey._id);
        if (
          survey &&
          survey.meta.group.id === groupId &&
          survey.groupIdImPinnedIn === groupId &&
          !seenIds.has(pinnedSurvey._id)
        ) {
          seenIds.add(pinnedSurvey._id);
          return true;
        }
        return false;
      });

    return pinnedSurveys;
  },
};

const fetchPinned = async (commit, dispatch) => {
  const pinned = [];
  const { data } = await api.get(`/surveys/pinned`);
  const { status } = data;
  console.log('pinned', data);

  const fetched = [];

  if (status !== 'success' || !Array.isArray(data.pinned)) {
    return pinned;
  }

  for (const group of data.pinned) {
    if (!Array.isArray(group.pinned)) {
      continue;
    }

    for (const sid of group.pinned) {
      const item = {
        _id: sid,
        name: '',
        group: group.group_name,
        groupIdImPinnedIn: group.group_id,
        meta: {},
      };

      const cached = fetched.find((f) => f._id == sid);
      if (!cached) {
        try {
          let s = await actions.fetchSurvey({ commit }, { id: sid });
          if (s.resources) {
            await dispatch('resources/fetchResources', s.resources, { root: true });
          }
          fetched.push(s);
          item.name = s.name;
          item.meta = s.meta;
          item.latestVersion = s.latestVersion;
          item.revisions = s.revisions;
          item.resources = s.resources;
        } catch (error) {
          console.error('error:' + error);
          continue;
        }
      } else {
        item.name = cached.name;
        item.meta = cached.meta;
      }

      pinned.push(item);
      if (item.meta.group.id === item.groupIdImPinnedIn) {
        await db.persistPinnedSurvey(item);
      }
    }
  }

  return pinned;
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  async fetchSurvey({ getters }, { id, version = 'latest' }) {
    let survey = undefined;

    if (!isOnline()) {
      survey = getters.getPinnedSurvey(id);
    } else {
      const response = await api.get(`/surveys/${id}?version=${version}`);
      survey = response.data;
    }

    return survey;
  },
  async fetchPinned({ commit, dispatch, rootState, rootGetters }) {
    const pinned = [];

    if (!rootGetters['auth/isLoggedIn']) {
      return pinned;
    }

    const userId = rootState.auth.user._id;
    await dispatch('memberships/getUserMemberships', userId, { root: true });

    const memberships = rootGetters['memberships/memberships'];
    let filteredMemberships = memberships;

    if (rootGetters['whitelabel/isWhitelabel']) {
      // get any subgroup memberships of this whitelabel
      // and later use those to find their pinned surveys
      // (the whitelabel root group's pinned surveys are fetched separately inside whitelabel.store.js)
      const { path } = rootGetters['whitelabel/partner'];
      const prefixed = memberships.filter((m) => m.group.path.startsWith(path)); // find any memberships in this whitelabel
      const excluded = prefixed.filter((m) => m.group.path !== path); // ... but exclude the whitelabel root group membership
      filteredMemberships = excluded;
    }

    const useLegacyPinnedImpl = false; // toggle switch for legacy implementation

    let pinnedItems = undefined;

    if (isOnline()) {
      await db.clearAllPinnedSurveys();
      pinnedItems = await fetchPinned(commit, dispatch, filteredMemberships);
    } else {
      pinnedItems = await db.getAllPinnedSurveys();
    }
    pinned.push(...pinnedItems);

    commit('SET_PINNED', pinned);
    return pinned;
  },
  async fetchSurveyFromBackendAndStore({ commit }, { id, version = 'latest' }) {
    const response = await api.get(`/surveys/${id}?version=${version}`);
    commit('ADD_SURVEY', response.data);
    return response.data;
  },
  removeSurvey({ commit }, id) {
    commit('REMOVE_SURVEY', id);
  },
  async addPinned({ commit, dispatch }, pinned) {
    delete pinned?.createdAgo;
    await db.persistPinnedSurvey(pinned);
    commit('ADD_PINNED', pinned);
    if (pinned.resources) {
      await dispatch('resources/fetchResources', pinned.resources, { root: true });
    }
  },
  async removePinned({ commit, dispatch }, pinned) {
    await db.deletePinnedSurvey(pinned._id);
    commit('REMOVE_PINNED', pinned._id);
    if (pinned.resources) {
      const pinnedResource = pinned.resources;
      for (const r of pinnedResource) {
        await dispatch('resources/removeLocalResource', { id: r.id }, { root: true });
      }
    }
  },
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  ADD_SURVEY(state, survey) {
    state.surveys.push(survey);
  },
  SET_SURVEYS(state, surveys) {
    state.surveys = surveys;
  },
  REMOVE_SURVEY(state, id) {
    const index = state.surveys.findIndex((survey) => survey._id === id);
    state.surveys.splice(index, 1);
  },
  ADD_PINNED(state, pinned) {
    state.pinned.push(pinned);
  },
  SET_PINNED(state, pinned) {
    state.pinned = pinned;
  },
  REMOVE_PINNED(state, id) {
    const index = state.pinned.findIndex((pinned) => pinned._id === id);
    state.pinned.splice(index, 1);
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
