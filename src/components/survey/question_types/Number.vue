<template>
  <v-container fluid>
    <v-row>
      <v-text-field
        outlined
        autofocus
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
        // TODO: implicitly parse as Integer or Float?
        // Maybe add a separate question type like inputInteger, inputFloat?
        const converted = Number(v);

        if (v === '' || Number.isNaN(converted)) {
          // Empty strings is converted to 0
          // but we rather want no value at all
          this.changed(null);
          return;
        }

        this.changed(converted);
      }
    },
  },
};
</script>

<style>
</style>
