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
    <div style="display: flex">
      <div style="flex: 1">
        <a-text-field
          variant="outlined"
          :label="control.hint"
          :modelValue="localValue"
          @update:modelValue="onInput"
          @keyup.enter.prevent="submit"
          ref="textField"
          class="full-width"
          :disabled="!relevant"
          hide-details
          color="focus"
          clearable
          @click:clear="setToNull" />
      </div>
    </div>

    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import { isIos } from '@/utils/compatibility';

import { getValueOrNull } from '@/utils/surveyStack';
import { uuidv4 } from '@/utils/surveys';

export default {
  mixins: [baseQuestionComponent],

  methods: {
    getValueOrNull,
    submit() {
      this.onInput(this.localValue);
      this.next();
    },
    onInput(v) {
      if (v) {
        const val = getValueOrNull(v);
        this.changed({
          name: val,
          id: uuidv4(),
        });
      } else {
        this.setToNull();
      }
    },
    tryAutofocus() {
      if (!this.isInBuilder && this.$refs.textField) {
        this.$refs.textField.focus({ preventScroll: true });
        return true;
      }
      return false;
      // could we use this instead?
      // this.$nextTick(() => this.$refs.textField.focus());
    },
    setToNull() {
      this.changed(null);
    },
  },
  computed: {
    localValue() {
      if (this.modelValue == null) {
        return '';
      } else {
        return this.modelValue && this.modelValue.name ? this.modelValue.name : '';
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
