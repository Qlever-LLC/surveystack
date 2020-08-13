<template>
  <v-container fluid>
    <p v-if="control.title">{{ control.title }}</p>
      <!-- autofocus -->
    <v-text-field
      outlined
      :label="control.label"
      v-bind:value="value"
      v-on:input="onInput"
      @keyup.enter.prevent="submit"
      ref="textField"
    />
    <p v-if="control.hint">{{ control.hint }}</p>
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import { isIos } from '@/utils/compatibility';

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
    tryAutofocus() {
      if (
        typeof document === 'undefined'
        || !this.$refs.textField.$refs.input
        || document.activeElement === this.$refs.input
      ) {
        return false;
      }
      // setTimeout(() => {
      //   }, 100);
      this.$refs.textField.$refs.input.focus({ preventScroll: true });


      return true;
    },
  },
  mounted() {
    if (isIos()) {
      this.$el.style.transform = 'translateY(-1000px)';
      this.tryAutofocus();
      this.$el.scrollTo(0, 0);
      this.$el.style.transform = 'none';
    } else {
      this.tryAutofocus();
    }
  },
};
</script>
