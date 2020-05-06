<template>
  <v-container fluid>
    <p>{{ control.hint }}</p>
    <v-text-field
      outlined
      autofocus
      :label="control.label"
      v-bind:value="value"
      v-on:input="onInput"
      @keyup.enter.prevent="submit"
    />
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
  methods: {
    submit() {
      this.onInput(this.value);
      this.$emit('next');
    },
    onInput(v) {
      if (this.value !== v) {
        this.changed(v);
      }
    },
  },
};
</script>
