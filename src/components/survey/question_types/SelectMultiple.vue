<template>
  <div fluid>
    <v-list v-if="sourceIsValid" style="overflow: auto;">
      <div class="ml-3">
        <v-label class="ml-3">{{control.label}}</v-label>
      </div>
      <v-list-item-group
        :value="value || []"
        @change="onChange"
        multiple
      >
        <v-list-item
          v-for="(item) in filteredSource"
          :value="item.value"
          :key="item.value"
        >
          <template v-slot:default="{ active, toggle }">
            <v-list-item-action>
              <v-checkbox
                :input-value="active"
                :true-value="item"
                @click="toggle"
              />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title v-text="item.label" />
            </v-list-item-content>
          </template>
        </v-list-item>

        <v-list-item
          v-if="control.options.allowCustomSelection"
          :value="customSelection"
        >
          <template v-slot:default="{ active, toggle }">
            <v-list-item-action>
              <v-checkbox
                :input-value="active"
                :true-value="customSelection"
                @click="toggle"
              />
            </v-list-item-action>
            <v-list-item-content>
                <!-- v-model="customSelection" -->
              <v-text-field
                label="Other"
                :value="customSelection"
                @input="handleCustomSelectionChange"
                outlined
                dense
                class="mb-0"
                hide-details
              />
            </v-list-item-content>
          </template>
        </v-list-item>
      </v-list-item-group>
    </v-list>
    <div v-else>
      Invalid Select Options, please update Suvey Definition
    </div>
    <p class="mt-4">{{ control.hint }}</p>
  </div>
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
        this.changed(v.sort());
      }
    },
    sourceHasValue(value) {
      return this.control.options.source.find(x => x.value === value);
    },
    handleCustomSelectionChange(value) {
      console.log('handle custom selection change', value);
      this.customSelection = value;
      if (this.valueIncludesCustom) {
        const nonCustomValues = this.value.filter(this.sourceHasValue);
        this.changed([...nonCustomValues, value]);
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
    valueIncludesCustom() {
      // returns true if a val exists in `this.value` array which is not present in select options array `this.control.options.source`
      return Array.isArray(this.value)
        && Array.isArray(this.control.options.source)
        && !this.value.every(this.sourceHasValue);
    },
  },
  created() {
    // set `customSelection` value to submission question value if we allow the user to enter custom selections
    // and the current question value is set to a value that is not in entries of `control.options.source`
    if (this.control.options.allowCustomSelection && this.valueIncludesCustom) {
      [this.customSelection] = this.value.filter(x => !this.sourceHasValue(x));
    }
  },
};
</script>

<style scoped>

</style>
