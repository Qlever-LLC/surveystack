<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      @initialize="initialize"
    />
    <v-text-field
      outlined
      type="number"
      :label="control.hint"
      v-bind:value="value"
      v-on:input="onInput"
      @keyup.enter.prevent="submit"
      ref="textField"
      :disabled="!relevant"
      hide-details="auto"
      color="focus"
      :rules="[isValidNumber]"
      data-test-id="input"
    />
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import { isIos } from '@/utils/compatibility';

export default {
  mixins: [baseQuestionComponent],
  components: {
    appControlLabel,
    appControlMoreInfo,
  },
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
    parseInputToNumber(v) {
      // TODO: implicitly parse as Integer or Float?
      // Maybe add a separate question type like inputInteger, inputFloat?
      const converted = Number(v);
      if (v === '' || v === null || Number.isNaN(converted)) {
        return false;
      }
      return converted;
    },
    onInput(v) {
      if (this.value !== v) {
        let converted = this.parseInputToNumber(v);

        if (converted === false) {
          // Report no value when the input is invalid or empty
          this.changed(null);
          return;
        }
        this.changed(converted);
      }
    },
    isValidNumber(val) {
      return this.parseInputToNumber(val) === false ? 'Please enter a number' : true;
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
