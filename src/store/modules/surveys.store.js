/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable-next-line no-await-in-loop */


import api from '@/services/api.service';


export const types = {
  FETCH_SURVEY: 'FETCH_SURVEY',
  FETCH_SURVEYS: 'FETCH_SURVEYS',
  // GET_SURVEY: 'GET_SURVEY',
  SET_SURVEY: 'SET_SURVEY',
  SET_PINNED: 'SET_PINNED',
  RESET: 'RESET',
  REMOVE_SURVEY: 'REMOVE_SURVEY',
  ADD_SURVEY: 'ADD_SURVEY',
  SET_SURVEYS: 'SET_SURVEYS',
  CREATE_SURVEY: 'CREATE_SURVEY',
};

const createInitialState = () => ({
  surveys: [],
  pinned: [],
});

const initialState = createInitialState();

const getters = {
  getSurvey: state => id => state.surveys.find(survey => survey._id === id),
  getPinned: state => state.pinned,
};

const mutations = {
  [types.RESET](state) {
    Object.assign(state, createInitialState());
  },
  [types.ADD_SURVEY](state, survey) {
    state.surveys.push(survey);
  },
  [types.SET_SURVEYS](state, surveys) {
    state.surveys = surveys;
  },
  [types.REMOVE_SURVEY](state, id) {
    const index = state.surveys.findIndex(survey => survey._id === id);
    state.submissions.splice(index, 1);
  },
  [types.SET_PINNED](state, pinned) {
    state.pinned = pinned;
  },
};

const actions = {
  reset({ commit }) {
    commit(types.RESET);
  },
  async fetchSurveys({ commit }) {
    const response = await api.get('/surveys');
    commit(types.SET_SURVEYS, response.data);
    return response.data;
  },
  async fetchSurvey({ commit }, id) {
    const response = await api.get(`/surveys/${id}`);
    commit(types.ADD_SURVEY, response.data);
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
    dispatch('memberships/getUserMemberships', userId, { root: true });
    const memberships = rootGetters['memberships/memberships'];

    for (const membership of memberships) {
      try {
        const { data } = await api.get(`/groups/${membership.group._id}?populate=1`);
        if (data && data.surveys && data.surveys.pinned && Array.isArray(data.surveys.pinned)) {
          for (const s of data.surveys.pinned) {
            pinned.push({
              id: s._id,
              name: s.name,
              group: data.name,
            });
            actions.fetchSurvey({ commit }, s._id);
          }
        }
      } catch (err) {
        console.log('Error fetching surveys:', err);
      }
    }

    commit(types.SET_PINNED, pinned);

    return pinned;
  },
  removeSurvey({ commit }, id) {
    commit(types.REMOVE_SURVEY, id);
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
  types,
};
