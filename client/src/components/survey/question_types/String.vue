<!-- eslint-disable vue/no-deprecated-v-on-native-modifier -->
<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled && value"
      :is-modified="meta && !!meta.dateModified"
      @initialize="initialize" />
    <div style="display: flex">
      <div style="flex: 1">
        <a-text-field
          variant="outlined"
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
    onInput(v) {
      const newValue = getValueOrNull(v);
      if (this.modelValue !== newValue) {
        this.changed(newValue);
      }
    },
    tryAutofocus() {
      if (this.$refs.textField) {
        this.$refs.textField.focus({ preventScroll: true });
        return true;
      }
      return false;
      // could we use this instead?
      // this.$nextTick(() => this.$refs.textField.focus());
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
