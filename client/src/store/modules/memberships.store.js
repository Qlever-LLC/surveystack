import api from '@/services/api.service';
import { autoSelectActiveGroup } from '@/utils/memberships';
import { MembershipService, GroupService } from '@/services/storage.service';
import { get } from 'lodash';

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
  async tryAutoJoinAndSelectGroup(store) {
    if (store.rootGetters['auth/isLoggedIn']) {
      try {
        const options = {
          getters: store.rootGetters,
          dispatch: (path, payload) => store.dispatch(path, payload, { root: true }),
        };
        // try to auto join group if this is a whitelabel
        if (store.rootGetters['whitelabel/isWhitelabel']) {
          const partnerId = store.rootGetters['whitelabel/partner'].id;
          await api.post(`/memberships/join-group?id=${partnerId}`);
          await autoSelectActiveGroup(options, partnerId);
        } else {
          // auto select the first group of the user
          await autoSelectActiveGroup(options, null, true);
        }
      } catch (error) {
        store.dispatch('feedback/add', get(error, 'response.data.message') || error, { root: true });
        console.error(error);
      }
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
