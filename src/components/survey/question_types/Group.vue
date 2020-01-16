<template>
  <v-container fluid>
    <v-row>
      <p class="display-1 grey--text text--darken-3">{{ question.label }} </p>
    </v-row>
  </v-container>
</template>

<script>
export default {
  props: {
    question: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style>
</style>
