<template>
  <div class="select-single question">
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      :is-modified="meta && !!meta.dateModified"
      @initialize="initialize" />
    <app-control-hint :value="control.hint" />
    <div class="py-2">
      <a-radio-group
        :modelValue="Array.isArray(modelValue) ? modelValue[0] : modelValue"
        @update:modelValue="onChange"
        v-if="sourceIsValid"
        class="mt-0"
        data-test-id="radio-group"
        hide-details>
        <a-radio
          v-for="(item, index) in filteredSource"
          :label="item.label"
          :value="item.value"
          :key="index"
          color="focus" />
        <a-radio
          :value="customSelection || 'other'"
          v-if="control.options.allowCustomSelection"
          class="mt-1 custom-input-radio"
          @change="customSelection = customSelection || 'other'"
          data-test-id="custom-input-radio"
          color="focus"
          labelSlot>
          <template v-slot:label>
            <a-text-field
              class="text-field-other flex-fill"
              :modelValue="customSelection"
              @update:modelValue="handleCustomSelectionInput"
              data-test-id="custom-input"
              hide-details
              variant="outlined"
              dense
              label="other"
              color="focus" />
          </template>
        </a-radio>
      </a-radio-group>
      <app-control-error v-else>No options specified, please update survey definition</app-control-error>
    </div>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlHint from '@/components/survey/drafts/ControlHint.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
import appControlError from '@/components/survey/drafts/ControlError.vue';
import { getValueOrNull } from '@/utils/surveyStack';

export function getNextValue(value) {
  const nextValue = getValueOrNull(value);
  // next value should be an array with single element for value, else null
  return nextValue ? [nextValue] : nextValue;
}

export default {
  mixins: [baseQuestionComponent],
  components: {
    appControlHint,
    appControlLabel,
    appControlMoreInfo,
    appControlError,
  },
  data() {
    return {
      customSelection: 'other',
    };
  },
  methods: {
    getValueOrNull,
    onChange(v) {
      if (this.modelValue !== v) {
        this.changed(getNextValue(v));
      }
    },

    handleCustomSelectionInput(value) {
      this.customSelection = value;
      // set submission question value if the current question value doesn't match one of the entries in `control.options.source`
      // TODO: did the previous removal of this block break any functionality?
      /*
      if (
        this.control.options.source
        && Array.isArray(this.control.options.source)
        && this.valueIsCustom
      ) {
        this.changed(this.getValueOrNull(value));
      }
      */
      this.changed(getNextValue(value));
    },
  },
  computed: {
    filteredSource() {
      return this.control.options.source.filter(({ value, label }) => value && label);
    },
    sourceIsValid() {
      return (
        this.control.options.source &&
        Array.isArray(this.control.options.source) &&
        this.control.options.source.length > 0 &&
        this.control.options.source.every(({ label, value }) => label && value)
      );
    },
    valueIsCustom() {
      // Submission question value is not present in the list of entries in `control.options.source`
      return !this.control.options.source.some((item) => this.modelValue && item.value === this.modelValue[0]);
    },
  },
  created() {
    // set `customSelection` value to submission question value if we allow the user to enter custom selections
    // and the current question value is set to a value that is not in entries of `control.options.source`
    if (this.control.options.allowCustomSelection && this.valueIsCustom) {
      if (Array.isArray(this.modelValue) && this.modelValue[0]) {
        this.customSelection = this.modelValue[0];
      } else if (this.modelValue) {
        this.customSelection = this.modelValue;
      }
    }
  },
};
</script>

<style scoped lang="scss">
:deep(.custom-input-radio .v-label) {
  margin-top: 10px;
  width: 100% !important;
}
:deep(.v-field--active .v-label.v-field-label) {
  visibility: visible;
  color: rgb(var(--v-theme-focus));
  margin-top: -10px;
  font-size: 14px;
}
</style>
