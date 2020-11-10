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
  computed: {
    groups() {
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
    // memberships() {
    //   return this.$store.getters['memberships/memberships'];
    // },
    activeGroup() {
      return this.$store.getters['memberships/activeGroup'];
    },
  },
  props: {
    value: {
    },
    // surveyGroup: {
    //   type: String,
    // },
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
