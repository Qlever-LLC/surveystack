<template>
  <v-container fluid>
    <v-text-field
      outlined
      autofocus
      :label="control.label"
      v-bind:value="value"
      v-on:input="onInput"
    ></v-text-field>
    <p>{{ control.hint }}</p>
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
