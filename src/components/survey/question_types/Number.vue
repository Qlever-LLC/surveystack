<template>
  <div>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <v-text-field
      outlined
      type="number"
      :label="control.hint"
      v-bind:value="value"
      v-on:input="onInput"
      @keyup.enter.prevent="submit"
      ref="textField"
      :disabled="!relevant"
      hide-details
    />
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import { isIos } from '@/utils/compatibility';

export default {
  mixins: [baseQuestionComponent],
  methods: {
    keyup(ev) {
      console.log('key: ', ev);
    },
    submit() {
      this.onInput(this.value);
      this.$emit('next');
    },
    tryAutofocus() {
      if (
        typeof document === 'undefined' ||
        !this.$refs.textField.$refs.input ||
        document.activeElement === this.$refs.input
      ) {
        return false;
      }
      this.$refs.textField.$refs.input.focus({ preventScroll: true });

      return true;
    },
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
  mounted() {
    // HACK: ios doesn't respect el.focus({ preventScroll: true })
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
