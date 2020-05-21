<template>
  <v-container fluid>
    <p v-if="control.title">{{ control.title }}</p>
    <v-text-field
      outlined
      autofocus
      :label="control.label"
      v-bind:value="value"
      v-on:input="onInput"
      @keyup.enter.prevent="submit"
    />
    <p v-if="control.hint">{{ control.hint }}</p>
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
