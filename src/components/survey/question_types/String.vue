<template>
  <div class="mt-4">
    <v-card-title
      class="px-0"
      v-if="control.title"
    >{{ control.title }}</v-card-title>
    <v-text-field
      outlined
      :label="control.label"
      v-bind:value="value"
      v-on:input="onInput"
      @keyup.enter.prevent="submit"
      ref="textField"
      class="full-width"
      :disabled="!relevant"
    />
    <p v-if="control.hint">{{ control.hint }}</p>
  </div>
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


      // could we use this instead?
      // this.$nextTick(() => this.$refs.textField.$refs.input.focus());


      return true;
    },
  },
  mounted() {
    if (this.autoFocus) {
      if (isIos()) {
        this.$el.style.transform = 'translateY(-1000px)';
        this.tryAutofocus();
        this.$el.scrollTo(0, 0);
        this.$el.style.transform = 'none';
      } else {
        this.tryAutofocus();
      }
    }
  },
};
</script>
