import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

export function useGroup() {
  const store = useStore();
  const route = useRoute();

  const user = store.getters['auth/user'];
  store.dispatch('memberships/getUserMemberships', user._id);

  function getMyGroups(limit = undefined) {
    let groups;
    if (isWhitelabel()) {
      groups = store.getters['memberships/getPrefixedGroups'](getWhitelabelPartner().path);
    } else {
      groups = store.getters['memberships/groups'];
    }
    if (limit) {
      return groups.slice(0, limit);
    } else {
      return groups;
    }
  }

  function isWhitelabel() {
    return store.getters['whitelabel/isWhitelabel'];
  }
  function getWhitelabelPartner() {
    return store.getters['whitelabel/partner'];
  }

  function getActiveGroupId() {
    return route.params.id;
  }
  function getActiveGroup() {
    //TODO get all groups, otherwise group name would not resolve for non-mine groups
    const groups = getMyGroups();
    const activeGroupId = getActiveGroupId();
    return groups.find((group) => group._id === activeGroupId);
  }

  function setActiveGroupId(groupId) {
    store.dispatch('memberships/setActiveGroup', groupId);
  }

  return {
    getMyGroups,
    getActiveGroupId,
    getActiveGroup,
    setActiveGroupId,
  };
}
