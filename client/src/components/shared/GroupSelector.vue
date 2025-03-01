<template>
  <div class="survey-group-selector">
    <a-select
      :modelValue="getModelValue()"
      @update:modelValue="handleInput"
      :items="groupItems"
      item-title="text"
      item-value="value"
      :label="label"
      :variant="outlined ? 'outlined' : undefined"
      hide-details
      color="focus"
      itemSlot>
      <template v-slot:item="{ props, item }">
        <a-list-item v-bind="props">
          <a-list-item-title>
            <span :class="item.className" :style="item.style">{{ item.text }}</span>
          </a-list-item-title>
        </a-list-item>
      </template>
    </a-select>
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
    modelValue: {
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
  emits: ['update:modelValue'],
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
      if (!this.treeView) {
        return this.groups.map((group) => ({
          text: group.name,
          value: this.returnObject ? { id: group._id, path: group.path } : group._id,
        }));
      }

      const groupsTree = makeTree(this.groups);
      let seperator = true;
      return Array.from(new Set([...groupsTree, ...this.groups])).map((group) => {
        const isTreeGroup = groupsTree.includes(group);
        const item = {
          text: group.name,
          value: this.returnObject ? { id: group._id, path: group.path } : group._id,
          style: isTreeGroup ? this.getMargin(getGroupLevel(group)) : undefined,
          className: !isTreeGroup && seperator ? 'no-parent-group' : '',
        };
        if (!isTreeGroup && seperator) {
          seperator = false;
        }
        return item;
      });
    },
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
  },
  methods: {
    getModelValue() {
      return this.modelValue?.id ? this.modelValue : undefined;
    },
    handleInput(val) {
      if (!val) {
        return;
      }
      this.$emit('update:modelValue', val);
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

<style scoped lang="scss">
>>> .v-list-item > .no-parent-group::after {
  content: '';
  width: 100%;
  position: absolute;
  left: 0;
  top: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.24);
}
</style>
