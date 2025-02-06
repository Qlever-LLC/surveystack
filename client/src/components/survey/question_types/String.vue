<!-- eslint-disable vue/no-deprecated-v-on-native-modifier -->
<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled && modelValue"
      :is-modified="meta && !!meta.dateModified"
      @initialize="initialize" />
    <div style="display: flex">
      <div style="flex: 1">
        <a-textarea
          v-if="control.options?.longText"
          :rules="[
            val => required ? !!val || 'Required' : true,
            val => val !== 'pass' ? 'Must be the string pass' : true,
          ]"
          rows="1"
          autoGrow
          variant="outlined"
          :label="control.hint"
          :modelValue="modelValue"
          @update:modelValue="onInput($event, false)"
          class="full-width"
          hint="Required"
          :persistent-hint="true"
          :disabled="!relevant"
          hide-details="auto"
          color="focus"
          clearable />
        <a-text-field
          v-else
          variant="outlined"
          :rules="[val => required ? !!val || 'Required' : true]"
          :label="control.hint"
          :modelValue="modelValue"
          @update:modelValue="onInput"
          @keyup.enter.prevent="submit"
          ref="textField"
          class="full-width"
          :disabled="!relevant"
          hide-details
          color="focus"
          clearable />
      </div>
      <app-qr-scanner
        style="flex: 0"
        class="ml-4"
        v-if="control.options.enableQr"
        @codeDetected="onQrCodeScanned"></app-qr-scanner>
    </div>

    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import { isIos } from '@/utils/compatibility';
import appQrScanner from '@/components/ui/QrScanner.vue';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';

import { getValueOrNull } from '@/utils/surveyStack';

export default {
  mixins: [baseQuestionComponent],
  components: {
    appQrScanner,
    appControlLabel,
    appControlMoreInfo,
  },
  methods: {
    submit() {
      this.onInput(this.modelValue);
      this.next();
    },
    onQrCodeScanned(code) {
      this.changed(code);
    },
    onInput(v, StringTrimed = true) {
      const newValue = getValueOrNull(v, StringTrimed);
      if (this.modelValue !== newValue) {
        this.changed(newValue);
      }
    },
    tryAutofocus() {
      if (!this.isInBuilder && this.$refs.textField) {
        this.$refs.textField.focus({ preventScroll: true });
        return true;
      }
      return false;
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
