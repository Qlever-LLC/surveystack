<template>
  <div class="select-single question">
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      @initialize="initialize"
    />
    <app-control-hint :value="control.hint" />
    <div class="py-2">
      <v-radio-group
        :value="Array.isArray(value) ? value[0] : value"
        @change="onChange"
        v-if="sourceIsValid"
        class="mt-0"
        data-test-id="radio-group"
        hide-details
      >
        <v-radio v-for="item in filteredSource" :label="item.label" :value="item.value" :key="item.key" color="focus" />
        <v-radio
          :value="customSelection || 'other'"
          v-if="control.options.allowCustomSelection"
          class="mt-1"
          @change="customSelection = customSelection || 'other'"
          data-test-id="custom-input-radio"
          color="focus"
        >
          <template v-slot:label>
            <v-text-field
              class="text-field-other"
              :value="customSelection"
              @input="handleCustomSelectionInput"
              data-test-id="custom-input"
              hide-details
              outlined
              dense
              label="other"
              color="focus"
            />
          </template>
        </v-radio>
      </v-radio-group>
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
      if (this.value !== v) {
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
      return !this.control.options.source.some((item) => this.value && item.value === this.value[0]);
    },
  },
  created() {
    // set `customSelection` value to submission question value if we allow the user to enter custom selections
    // and the current question value is set to a value that is not in entries of `control.options.source`
    if (this.control.options.allowCustomSelection && this.valueIsCustom) {
      if (Array.isArray(this.value) && this.value[0]) {
        this.customSelection = this.value[0];
      } else if (this.value) {
        this.customSelection = this.value;
      }
    }
  },
};
</script>

<style scoped>
.top-10 {
  top: 10px;
}

.v-input .text-field-other >>> label {
  top: 10px;
  line-height: 24px;
}

.select-single >>> .v-label {
  height: auto;
}
</style>
