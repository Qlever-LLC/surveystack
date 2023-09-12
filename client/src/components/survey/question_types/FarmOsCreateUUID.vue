<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      :is-modified="meta && !!meta.dateModified"
      @initialize="initialize"
    />
    <div style="display: flex">
      <div style="flex: 1">
        <v-text-field
          outlined
          :label="control.hint"
          v-bind:value="localValue"
          v-on:input="onInput"
          @keyup.enter.prevent="submit"
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

import { getValueOrNull } from '@/utils/surveyStack';
import { uuidv4 } from '@/utils/surveys';

export default {
  mixins: [baseQuestionComponent],
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
      if (
        typeof document === 'undefined' ||
        !this.$refs.textField.$refs.input ||
        document.activeElement === this.$refs.input
      ) {
        return false;
      }

      this.$refs.textField.$refs.input.focus({ preventScroll: true });

      // could we use this instead?
      // this.$nextTick(() => this.$refs.textField.$refs.input.focus());

      return true;
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
