<template>
  <a-list-group prepend-icon="mdi-account-check" :value="true" color="focus">
    <template v-slot:activator>
      <a-list-item-title v-if="activeGroup">{{ activeGroupName }}</a-list-item-title>
      <a-list-item-title v-else>No Group selected</a-list-item-title>
    </template>
    <a-list-item flat class="pt-0" color="focus">
      <v-list-item-group :value="activeItem" color="primary" mandatory>
        <a-list-item
          v-for="(item, i) in groupItems"
          :key="item.value"
          @click="() => handleInput(item.value)"
          :value="i"
          color="focus"
        >
          <a-list-item-icon>
            <v-icon>mdi-account-group</v-icon>
          </a-list-item-icon>
          <a-list-item-title>
            {{ item.text }}
          </a-list-item-title>
        </a-list-item>
      </v-list-item-group>
    </a-list-item>
  </a-list-group>
</template>

<script>
import AListItem from '@/components/ui/AListItem.vue';
import AListItemTitle from '@/components/ui/AListItemTitle.vue';
import AListItemIcon from '@/components/ui/AListItemIcon.vue';

export default {
  components: { AListItemIcon, AListItemTitle, AListItem },
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
    label: {
      type: String,
      default: 'Active Group',
    },
    outlined: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    groups() {
      if (this.isWhitelabel) {
        return this.$store.getters['memberships/getPrefixedGroups'](this.whitelabelPartner.path);
      }
      return this.$store.getters['memberships/groups'];
    },
    activeItem: {
      get() {
        if (this.returnObject) {
          return this.groupItems.findIndex((item) => item.value.id === this.activeGroup);
        }

        return this.groupItems.findIndex((item) => item.value === this.activeGroup);
      },
    },
    groupItems() {
      return this.groups.map(({ name, _id, path }) => {
        if (this.returnObject) {
          return {
            text: name,
            value: {
              id: _id,
              path,
            },
          };
        }

        return {
          text: name,
          value: _id,
        };
      });
    },
    activeGroup() {
      return this.$store.getters['memberships/activeGroup'];
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
  methods: {
    handleInput(val) {
      this.$emit('input', val);
    },
    isActiveGroup(value) {
      if (this.returnObject) {
        return value.id === this.activeGroup;
      }
      return value === this.activeGroup;
    },
  },
  created() {
    const user = this.$store.getters['auth/user'];
    this.$store.dispatch('memberships/getUserMemberships', user._id);
  },
};
</script>
