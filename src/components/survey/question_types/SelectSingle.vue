<template>
  <v-container fluid>
    <p class="mb-2">{{ control.hint }}</p>
    <v-row>
      <v-radio-group
        :label="control.label"
        :value="value"
        @change="onChange"
        v-if="sourceIsValid"
      >
        <v-radio
          v-for="(item) in filteredSource"
          :label="item.label"
          :value="item.value"
          :key="item.key"
        />
        <v-radio
          label="Other"
          :value="customSelection"
          v-if="control.options.allowCustomSelection"
        >
          <template v-slot:label>
              <!-- v-model="customSelection" -->
            <v-text-field
              class="text-field-other"
              :value="customSelection"
              @input="handleCustomSelectionInput"
              hide-details
              outlined
              dense
            >
              <template v-slot:label class="something">
                <div class="top-10">Other</div>
              </template>
            </v-text-field>
          </template>
        </v-radio>
      </v-radio-group>
      <div v-else>
        Invalid Select Options, please update Suvey Definition
      </div>
    </v-row>
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
  data() {
    return {
      customSelection: '',
    };
  },
  methods: {
    onChange(v) {
      if (this.value !== v) {
        this.changed(v);
      }
    },
    handleCustomSelectionInput(value) {
      this.customSelection = value;
      // set submission question value if the current question value doesn't match one of the entries in `control.options.source`
      if (
        this.control.options.source
        && Array.isArray(this.control.options.source)
        && this.valueIsCustom
      ) {
        this.changed(value);
      }
    },
  },
  computed: {
    filteredSource() {
      return this.control.options.source.filter(({ value, label }) => value && label);
    },
    sourceIsValid() {
      return this.control.options.source
        && Array.isArray(this.control.options.source)
        && this.control.options.source.length > 0
        && this.control.options.source.every(({ label, value }) => label && value);
    },
    valueIsCustom() {
      // Submission question value is not present in the list of entries in `control.options.source`
      return !this.control.options.source.some(item => item.value === this.value);
    },
  },
  created() {
    // set `customSelection` value to submission question value if we allow the user to enter custom selections
    // and the current question value is set to a value that is not in entries of `control.options.source`
    if (this.control.options.allowCustomSelection && this.valueIsCustom) {
      this.customSelection = this.value;
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
}
</style>
