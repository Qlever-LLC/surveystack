<template>
  <v-container fluid>
    <v-row>
      <v-text-field
        outlined
        :label=question.label
        type="number"
      >
      </v-text-field>
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
