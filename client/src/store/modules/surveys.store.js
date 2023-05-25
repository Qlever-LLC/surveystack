/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable-next-line no-await-in-loop */
import api from '@/services/api.service';

const createInitialState = () => ({
  surveys: [],
  pinned: [],
});

const initialState = createInitialState();

const getters = {
  getSurvey: (state) => (id) => state.surveys.find((survey) => survey._id === id),
  pinned: (state) => state.pinned,
  getPinned:
    (state) =>
    (prefix = '', excludePath = '') => {
      const prefixed = state.pinned.filter((s) => s.meta.group.path && s.meta.group.path.startsWith(prefix));
      const excluded = prefixed.filter((s) => s.meta.group.path !== excludePath);
      return excluded;
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
        id: sid,
        name: '',
        group: group.group_name,
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
        } catch (error) {
          console.error('error:' + error);
          continue;
        }
      } else {
        item.name = cached.name;
        item.meta = cached.meta;
      }

      pinned.push(item);
    }
  }

  return pinned;
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  async fetchSurvey({ commit }, { id, version = 'latest' }) {
    const response = await api.get(`/surveys/${id}?version=${version}`);
    commit('ADD_SURVEY', response.data);
    return response.data;
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

    const pinnedItems = await fetchPinned(commit, dispatch, filteredMemberships);
    pinned.push(...pinnedItems);

    commit('SET_PINNED', pinned);
    return pinned;
  },
  removeSurvey({ commit }, id) {
    commit('REMOVE_SURVEY', id);
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
  SET_PINNED(state, pinned) {
    state.pinned = pinned;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
