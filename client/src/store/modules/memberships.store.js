import api from '@/services/api.service';
import { MembershipService } from '@/services/storage.service';

import { isOnline } from '@/utils/surveyStack';

const createInitialState = () => ({
  status: MembershipService.getStatus(),
  memberships: MembershipService.getUserMemberships(),
});

const initialState = createInitialState();

const getters = {
  status: (state) => state.status,
  memberships: (state) => state.memberships,
  getPrefixedMemberships:
    (state) =>
    (prefix = '/') =>
      state.memberships.filter((m) => m.group.path && m.group.path.startsWith(prefix)),
  groups: (state) => state.memberships.map((m) => m.group),
  getPrefixedGroups:
    (state) =>
    (prefix = '/') =>
      state.memberships.filter((m) => m.group.path && m.group.path.startsWith(prefix)).map((m) => m.group),
  getMembershipByGroupId: (state) => (groupId) => state.memberships.find((m) => m.group._id === groupId),
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  getUserMemberships({ commit, getters }, userId) {
    if (!userId) {
      return new Promise((resolve) => {
        resolve([]);
      });
    }

    if (!isOnline()) {
      return getters.memberships;
    }

    return new Promise((resolve, reject) => {
      commit('membership_request');
      api
        .get(`/memberships?user=${userId}&populate=1`)
        .then((response) => {
          MembershipService.saveMemberships(response.data);
          commit('membership_success', response.data);
          resolve(response.data);
        })
        .catch((error) => {
          console.log(error);
          commit('membership_error');
          MembershipService.clear();
          reject(error);
        });
    });
  },
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  membership_request(state) {
    state.status = 'loading';
  },
  membership_success(state, memberships = []) {
    state.status = 'success';
    state.memberships = memberships;
  },
  membership_error(state) {
    state.status = 'error';
    state.user = {};
    state.header = '';
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
