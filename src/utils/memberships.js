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
    return (r & 0x3 | 0x8).toString(16);
  });
  return `${u}.${new Date().getTime().toString(16)}`;
};

export const autoSelectActiveGroup = async (store, preferredGroupId = null) => {
  const user = store.getters['auth/user'];
  const memberships = await store.dispatch('memberships/getUserMemberships', user._id);
  if (
    memberships
    && memberships.length > 0
  ) {
    // default to the first membership
    let groupId = memberships[0].group._id;
    // try to use the preferred group (such as from call-for-submissions)
    if (preferredGroupId) {
      const isMemberOfPreferredGroup = memberships.some(m => m.group._id === preferredGroupId);
      if (isMemberOfPreferredGroup) {
        groupId = preferredGroupId;
      }
    }

    store.dispatch('memberships/setActiveGroup', groupId);
  }
};


export default {
  uuid,
  autoSelectActiveGroup,
};
