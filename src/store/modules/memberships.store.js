import api from '@/services/api.service';

import { MembershipService, GroupService } from '@/services/storage.service';

const createInitialState = () => ({
  status: MembershipService.getStatus(),
  memberships: MembershipService.getUserMemberships(),
  activeGroup: GroupService.getActiveGroup(),
});

const initialState = createInitialState();

const getters = {
  status: (state) => state.status,
  activeGroup: (state) => state.activeGroup,
  memberships: (state) => state.memberships,
  getPrefixedMemberships: (state) => (prefix = '/') =>
    state.memberships.filter((m) => m.group.path && m.group.path.startsWith(prefix)),
  groups: (state) => state.memberships.map((m) => m.group),
  getPrefixedGroups: (state) => (prefix = '/') =>
    state.memberships.filter((m) => m.group.path && m.group.path.startsWith(prefix)).map((m) => m.group),
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  getUserMemberships({ commit, rootGetters }, userId) {
    if (!userId) {
      return new Promise((resolve) => {
        resolve([]);
      });
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
  setActiveGroup({ commit }, group) {
    try {
      GroupService.saveActiveGroup(group);
      commit('set_active_group', group);
    } catch (err) {
      console.log(err);
      GroupService.clear();
    }
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
  set_active_group(state, group) {
    state.activeGroup = group;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
