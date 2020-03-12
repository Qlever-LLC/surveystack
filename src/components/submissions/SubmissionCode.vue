<template>
  <v-container class="pa-3">
    <v-textarea
      :value="valueString"
      rows="30"
      outlined
      readonly
    />
  </v-container>
</template>
<script>
export default {
  props: {
    submissions: {
      type: Object,
      required: true,
    },
  },
  computed: {
    valueString() {
      return JSON.stringify(this.submissions.content, null, 2);
    },
  },

};
</script>
