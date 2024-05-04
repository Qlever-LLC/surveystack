<template>
  <a-select
    v-model="activeGroup"
    color="focus"
    dense
    hideDetails
    :items="groupItems"
    placeholder="No Group selected"
    variant="filled"
    selectionSlot
    itemSlot>
    <template v-slot:selection>
      <a-list-item class="pa-0" prepend-icon="mdi-account-check" :title="activeGroupName" />
    </template>
    <template v-slot:item="{ props }">
      <a-list-item v-bind="props" prepend-icon="mdi-account-group" />
    </template>
  </a-select>
</template>

<script>
export default {
  computed: {
    activeGroup: {
      get() {
        return this.$store.getters['memberships/activeGroup'];
      },
      set(val) {
        this.$store.dispatch('memberships/setActiveGroup', val);
      },
    },
    groups() {
      if (this.isWhitelabel) {
        return this.$store.getters['memberships/getPrefixedGroups'](this.whitelabelPartner.path);
      }
      return this.$store.getters['memberships/groups'];
    },
    groupItems() {
      return this.groups.map(({ name, _id }) => {
        return {
          title: name,
          value: _id,
        };
      });
    },
    activeGroupName() {
      if (!this.activeGroup) {
        return '';
      }

      // it's possible that a membership was deleted on the server
      // so check if it still exists first
      const group = this.groups.find((g) => g._id === this.activeGroup);
      if (group) {
        return group.name;
      }
      return '';
    },
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
  },
  created() {
    const user = this.$store.getters['auth/user'];
    this.$store.dispatch('memberships/getUserMemberships', user._id);
  },
};
</script>
