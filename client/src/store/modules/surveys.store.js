/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable-next-line no-await-in-loop */
import * as db from '@/store/db';

const createInitialState = () => ({
  pinned: [],
  pinnedLoading: false,
});

const initialState = createInitialState();

const getters = {
  getPinned: (state) => state.pinned,
  getPinnedLoading: (state) => state.pinnedLoading,
};

const actions = {
  reset({ commit }) {
    commit('RESET');
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
