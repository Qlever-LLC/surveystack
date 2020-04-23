<template>
  <v-container fluid>
    <v-text-field
      outlined
      autofocus
      :label="control.label"
      v-bind:value="value"
      v-on:input="onInput"
    ></v-text-field>
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
  methods: {
    onInput(v) {
      if (this.value !== v) {
        this.changed(v);
      }
    },
  },
};
</script>

<style>
</style>
