/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable-next-line no-await-in-loop */
import api from '@/services/api.service';

const createInitialState = () => ({
  isWhitelabel: false,
  partner: null,
  pinnedSurveys: [],
});

const initialState = createInitialState();

const getters = {
  isWhitelabel: (state) => state.partner !== null,
  partner: (state) => state.partner,
  pinnedSurveys: (state) => state.pinnedSurveys,
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  async setPartner({ commit, dispatch }, partner) {
    commit('SET_PARTNER', partner);

    const { data } = await api.get(`/groups/${partner.id}?populate=1`);
    const pinnedSurveys = [];
    if (data && data.surveys && data.surveys.pinned && Array.isArray(data.surveys.pinned)) {
      for (const s of data.surveys.pinned) {
        pinnedSurveys.push({
          id: s._id,
          name: s.name,
          group: data.name,
          meta: s.meta,
        });
        // TODO: also fetch this survey analog to survey.store.js?
      }
    }

    commit('SET_PINNED_SURVEYS', pinnedSurveys);
  },
};

const mutations = {
  RESET(state) {
    // a logout calls a global reset action, but we want to keep any whitelabel specifics
  },
  SET_PARTNER(state, partner) {
    state.partner = partner;
  },
  SET_PINNED_SURVEYS(state, pinnedSurveys) {
    state.pinnedSurveys = pinnedSurveys;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
