<template>
  <div class="survey-group-selector">
    <v-select
      :value="memberships[0]"
      @input="handleInput"
      :items="memberships"
      item-text="group.name"
      item-value="group"
      :label="label"
      :outlined="outlined"
    >
    </v-select>
  </div>
</template>

<script>
export default {
  computed: {
    memberships() {
      return this.$store.getters['memberships/memberships'];
    },
  },
  props: {
    value: {
    },
    // surveyGroup: {
    //   type: String,
    // },
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
};
</script>

<style>

</style>
