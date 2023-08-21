<template>
  <v-list-group prepend-icon="mdi-account-check" :value="true" color="focus">
    <template v-slot:activator>
      <v-list-item-title v-if="activeGroup">{{ activeGroupName }}</v-list-item-title>
      <v-list-item-title v-else>No Group selected</v-list-item-title>
    </template>
    <v-list-item flat class="pt-0" color="focus">
      <v-list-item-group :value="activeItem" color="primary" mandatory>
        <v-list-item
          v-for="(item, i) in groupItems"
          :key="item.text"
          @click="() => handleInput(item.value)"
          :value="i"
          color="focus"
        >
          <v-list-item-icon>
            <a-icon>mdi-account-group</a-icon>
          </v-list-item-icon>
          <v-list-item-title>
            {{ item.text }}
          </v-list-item-title>
        </v-list-item>
      </v-list-item-group>
    </v-list-item>
  </v-list-group>
</template>

<script>
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: { AIcon },
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
