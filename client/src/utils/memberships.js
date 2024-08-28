import api from '@/services/api.service';
import { get } from 'lodash';

export const uuid = () => {
  const rnd = new Uint8Array(32);
  crypto.getRandomValues(rnd);
  let count = 0;
  const u = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = rnd[count++] % 16;

    if (c === 'x') {
      return r.toString(16);
    }
    // eslint-disable-next-line no-bitwise, no-mixed-operators
    return ((r & 0x3) | 0x8).toString(16);
  });
  return `${u}.${new Date().getTime().toString(16)}`;
};

/* if a preferredGroupId is passed or user has only one group membership, redirects user to that group and returns true. Otherwise, returns false.*/
export async function redirectAfterLogin(store, router, redirectUrl, preferredGroupId = null) {
  if (!store.getters['auth/isLoggedIn']) {
    return;
  }
  const user = store.getters['auth/user'];
  const memberships = await store.dispatch('memberships/getUserMemberships', user._id);
  if (redirectUrl) {
    router.push(redirectUrl).then(reloadPage);
  } else if (preferredGroupId) {
    const isMemberOfPreferredGroup = memberships.some((m) => m.group._id === preferredGroupId);
    if (isMemberOfPreferredGroup) {
      router.push(`/groups/${preferredGroupId}`).then(reloadPage);
    } else {
      router.push('/').then(reloadPage);
    }
  } else if (memberships && memberships.length === 1) {
    // only one group, redirect user to that group's page
    router.push(`/groups/${memberships[0].group._id}`).then(reloadPage);
  } else {
    router.push('/').then(reloadPage);
  }
}

export const reloadPage = () => {
  window.location.reload();
};

export const autoJoinWhiteLabelGroup = async (store) => {
  try {
    if (store.getters['auth/isLoggedIn'] && store.getters['whitelabel/isWhitelabel']) {
      const partnerGroupId = store.getters['whitelabel/partner'].id;
      await api.post(`/memberships/join-group?id=${partnerGroupId}`);
      return partnerGroupId;
    } else {
      return false;
    }
  } catch (error) {
    store.dispatch('feedback/add', get(error, 'response.data.message') || error, { root: true });
    return false;
  }
};

export default {
  uuid,
  redirectAfterLogin,
  autoJoinWhiteLabelGroup,
};
