<template>
  <div class="survey-group-selector">
    <v-select
      :value="value"
      @input="handleInput"
      :items="groupItems"
      item-text="text"
      item-value="value"
      :label="label"
      :outlined="outlined"
      hide-details
      color="focus"
    >
      <template v-slot:item="{ item }">
        <span :style="item.style">{{ item.text }}</span>
      </template>
    </v-select>
  </div>
</template>

<script>
function getGroupLevel(group) {
  return group.dir.match(/\//g).length;
}

function makeTree(groups, lvl = 1) {
  const treeList = [];
  const lvlGroups = groups.filter((group) => getGroupLevel(group) === lvl);
  lvlGroups.forEach((group) => {
    const childGroups = groups.filter((g) => g.path.startsWith(group.path));
    treeList.push(group);
    treeList.push(...makeTree(childGroups, lvl + 1));
  });
  return treeList;
}

export default {
  props: {
    value: {
      type: [String, Object],
    },
    // with returnObject=true the v-model value returns an object {id: groupId, path: groupPath},
    // otherwise v-model value returns the groupId as a string
    returnObject: {
      type: Boolean,
      default: false,
    },
    adminGroupsOnly: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: 'Active Group',
    },
    outlined: {
      type: Boolean,
      default: false,
    },
    treeView: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    groups() {
      if (this.isWhitelabel) {
        return this.$store.getters['memberships/getPrefixedGroups'](this.whitelabelPartner.path);
      }
      if (this.adminGroupsOnly) {
        return this.$store.getters['memberships/memberships'].filter((m) => m.role === 'admin').map((m) => m.group);
      }
      return this.$store.getters['memberships/groups'];
    },
    groupItems() {
      const calculatedGroups = this.treeView ? makeTree(this.groups) : this.groups;
      return calculatedGroups.map((group) => {
        return {
          text: group.name,
          value: this.returnObject ? { id: group._id, path: group.path } : group._id,
          style: this.getMargin(getGroupLevel(group)),
        };
      });
    },
    activeGroup() {
      return this.$store.getters['memberships/activeGroup'];
    },
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
  },
  methods: {
    handleInput(val) {
      this.$emit('input', val);
    },
    getMargin(lvl) {
      const pixels = Math.max(0, lvl - 1) * 16;
      return this.treeView ? { 'margin-left': `${pixels}px` } : {};
    },
  },
  created() {
    const user = this.$store.getters['auth/user'];
    this.$store.dispatch('memberships/getUserMemberships', user._id);
  },
};
</script>
