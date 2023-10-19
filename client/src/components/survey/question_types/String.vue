<template>
  <div>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <div style="display: flex">
      <div style="flex: 1">
        <!-- TODO in Vue3 remove .native -->
        <a-text-field
          outlined
          :label="control.hint"
          :value="value"
          @input="onInput"
          @keyup.native.enter.prevent="submit"
          ref="textField"
          class="full-width"
          :disabled="!relevant"
          hide-details
          color="focus"
        />
      </div>
      <app-qr-scanner
        style="flex: 0"
        class="ml-4"
        v-if="control.options.enableQr"
        @codeDetected="onQrCodeScanned"
      ></app-qr-scanner>
    </div>

    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import { isIos } from '@/utils/compatibility';
import appQrScanner from '@/components/ui/QrScanner.vue';

import { getValueOrNull } from '@/utils/surveyStack';
import ATextField from '@/components/ui/ATextField.vue';

export default {
  mixins: [baseQuestionComponent],
  components: {
    appQrScanner,
    ATextField,
  },
  methods: {
    submit() {
      this.onInput(this.value);
      this.$emit('next');
    },
    onQrCodeScanned(code) {
      this.changed(code);
    },
    onInput(v) {
      const newValue = getValueOrNull(v);
      if (this.value !== newValue) {
        this.changed(newValue);
      }
    },
    tryAutofocus() {
      if (
        typeof document === 'undefined' ||
        !this.$refs.textField.refInput() ||
        document.activeElement === this.$refs.input
      ) {
        return false;
      }

      this.$refs.textField.refInput().focus({ preventScroll: true });

      // could we use this instead?
      // this.$nextTick(() => this.$refs.textField.refInput().focus());

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
