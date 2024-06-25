import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import api from '@/services/api.service';

export function useGroup() {
  const store = useStore();
  const route = useRoute();

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
  async function getActiveGroup() {
    const activeGroupId = getActiveGroupId();
    if (!activeGroupId) {
      return null;
    }
    const groups = getMyGroups();
    let groupFound = groups.find((group) => group._id === activeGroupId);
    if (!groupFound) {
      const { data: group } = await api.get(`/groups/${activeGroupId}`);
      groupFound = group;
    }
    return groupFound;
  }

  function isGroupAdmin() {
    const memberships = store.getters['memberships/memberships'];
    const activeGroupId = getActiveGroupId();
    return memberships.some((m) => m.group._id === activeGroupId && m.role === 'admin');
  }

  return {
    getMyGroups,
    getActiveGroupId,
    getActiveGroup,
    isGroupAdmin,
    isWhitelabel,
    getWhitelabelPartner,
  };
}
