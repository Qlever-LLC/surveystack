<!-- eslint-disable vue/no-deprecated-v-on-native-modifier -->
<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      :is-modified="meta && !!meta.dateModified"
      @initialize="initialize" />
    <a-text-field
      variant="outlined"
      type="number"
      :label="control.hint"
      :modelValue="modelValue"
      @update:modelValue="onInput"
      @keyup.enter.prevent="submit"
      ref="textField"
      :disabled="!relevant"
      hide-details="auto"
      color="focus"
      :rules="[isValidNumber]"
      data-test-id="input"
      clearable />
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
      this.onInput(this.modelValue);
      this.next();
    },
    tryAutofocus() {
      if (!this.isInBuilder && this.$refs.textField) {
        this.$refs.textField.focus({ preventScroll: true });
        return true;
      }
      return false;
    },
    onInput(value) {
      // TODO: implicitly parse as Integer or Float?
      // Maybe add a separate question type like inputInteger, inputFloat?
      if (value === '' || value === null || value === undefined) {
        this.changed(null);
      } else {
        const numValue = Number(value);
        if (value === '0') {
          this.changed(value);
        } else if (numValue) {
          // possibility to write 1e2 => 100
          this.changed(numValue);
        }
      }
    },
    isValidNumber(val) {
      return isNaN(Number(val)) || (this.required && val === null) ? 'Please enter a number' : true;
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
