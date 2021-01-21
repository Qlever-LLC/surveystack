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
    >
    </v-select>
  </div>
</template>

<script>
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
        return this.$store.getters['memberships/prefixedGroups'](this.whitelabelPartner.path);
      }
      return this.$store.getters['memberships/groups'];
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
  },
  created() {
    const user = this.$store.getters['auth/user'];
    this.$store.dispatch('memberships/getUserMemberships', user._id);
  },
};
</script>
