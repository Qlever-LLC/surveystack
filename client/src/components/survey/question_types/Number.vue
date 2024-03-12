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
      :disabled="!relevant"
      :label="control.hint"
      :rules="[isValidNumber]"
      @keyup.enter.prevent="submit"
      @update:modelValue="onInput"
      clearable
      color="focus"
      data-test-id="input"
      hide-details="auto"
      ref="textField"
      type="number"
      v-model="localValue"
      variant="outlined" />
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
  data() {
    return {
      localValue: this.modelValue,
    };
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
