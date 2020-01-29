<template>
  <v-container fluid>
    <v-row>
      <v-text-field
        outlined
        type="number"
        :label="control.label"
        v-bind:value="value"
        v-on:input="onInput"
      ></v-text-field>
    </v-row>
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
