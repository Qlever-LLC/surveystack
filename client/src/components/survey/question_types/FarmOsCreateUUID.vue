<template>
  <div>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <div style="display: flex">
      <div style="flex: 1">
        <!-- TODO in Vue3 remove .native -->
        <a-text-field
          outlined
          :label="control.hint"
          :value="localValue"
          @input="onInput"
          @keyup.native.enter.prevent="submit"
          ref="textField"
          class="full-width"
          :disabled="!relevant"
          hide-details
          color="focus"
        />
      </div>
    </div>

    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import { isIos } from '@/utils/compatibility';
import ATextField from '@/components/ui/ATextField.vue';

import { getValueOrNull } from '@/utils/surveyStack';
import { uuidv4 } from '@/utils/surveys';

export default {
  mixins: [baseQuestionComponent],
  components: {
    ATextField,
  },
  methods: {
    getValueOrNull,
    submit() {
      this.onInput(this.localValue);
      this.$emit('next');
    },
    onInput(v) {
      if (!this.value || this.value.value !== v) {
        const val = getValueOrNull(v);
        this.changed({
          name: val,
          id: uuidv4(),
        });
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
  computed: {
    localValue() {
      if (this.value == null) {
        return '';
      } else {
        return this.value && this.value.name ? this.value.name : '';
      }
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
