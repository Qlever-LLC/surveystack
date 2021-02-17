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
  getSurvey: state => id => state.surveys.find(survey => survey._id === id),
  pinned: state => state.pinned,
  getPinned: state => (prefix = '', excludePath = '') => {
    const prefixed = state.pinned.filter(s => s.meta.group.path && s.meta.group.path.startsWith(prefix));
    const excluded = prefixed.filter(s => s.meta.group.path !== excludePath);
    return excluded;
  },
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  async fetchSurveys({ commit }) {
    const response = await api.get('/surveys');
    commit('SET_SURVEYS', response.data);
    return response.data;
  },
  async fetchSurvey({ commit }, id) {
    const response = await api.get(`/surveys/${id}`);
    commit('ADD_SURVEY', response.data);
    return response.data;
  },
  async fetchPinned({
    commit, dispatch, rootState, rootGetters,
  }) {
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
      const prefixed = memberships.filter(m => m.group.path.startsWith(path)); // find any memberships in this whitelabel
      const excluded = prefixed.filter(m => m.group.path !== path); // ... but exclude the whitelabel root group membership
      filteredMemberships = excluded;
    }

    for (const membership of filteredMemberships) {
      try {
        const { data } = await api.get(`/groups/${membership.group._id}?populate=1`);
        if (data && data.surveys && data.surveys.pinned && Array.isArray(data.surveys.pinned)) {
          for (const s of data.surveys.pinned) {
            pinned.push({
              id: s._id,
              name: s.name,
              group: data.name,
              meta: s.meta,
            });
            actions.fetchSurvey({ commit }, s._id);
          }
        }
      } catch (err) {
        console.log('Error fetching surveys:', err);
      }
    }

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
    const index = state.surveys.findIndex(survey => survey._id === id);
    state.submissions.splice(index, 1);
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
