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
    <app-control-hint :value="control.hint" />

    <div v-if="sourceIsValid" class="py-2">
      <div class="select-multiple-source">
        <div v-for="item in selections" :key="item.value">
          <a-checkbox
            v-model="item.selected"
            :label="item.label"
            @input="onChange"
            hide-details
            class="my-1"
            color="focus"
          />
        </div>
      </div>

      <div v-if="control.options.allowCustomSelection" class="select-multiple-custom mt-3 d-flex align-center">
        <a-checkbox
          v-model="customSelected"
          @input="onChange"
          hide-details
          class="mt-0"
          :disabled="!customValue"
          color="focus"
        />
        <a-text-field
          label="other"
          v-model="customValue"
          outlined
          dense
          hide-details
          @input="onCustomChange"
          color="focus"
        />
      </div>
    </div>

    <app-control-error v-else>No options specified, please update survey definition </app-control-error>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

import { getValueOrNull } from '@/utils/surveyStack';

export default {
  mixins: [baseQuestionComponent],

  data() {
    return {
      customSelection: 'other',
      customValue: 'other',
      customSelected: false,
      selections: [],
    };
  },
  methods: {
    getValueOrNull,
    onChange() {
      const newValues = this.selections
        .filter((s) => s.selected)
        .map((s) => s.value)
        .sort();
      if (this.customSelected && this.customValue) {
        newValues.push(this.customValue);
      }
      this.changed(this.getValueOrNull(newValues));
    },
    findSource(value) {
      return this.control.options.source.find((x) => x.value === value);
    },
    sourceContains(v) {
      return this.control.options.source.map(({ value }) => value).includes(v);
    },
    onCustomChange(v) {
      this.customSelected = !!v;
      this.onChange();
    },
    initSelections() {
      // fill pre-defined
      this.selections.forEach((s) => {
        if (this.value && Array.isArray(this.value)) {
          console.log(this.value);
          const valueFound = this.value.find((v) => s.value === v);
          s.selected = !!valueFound;
        } else {
          s.selected = false;
        }
      });

      // fill custom
      if (this.control.options.allowCustomSelection && this.valueIncludesCustom) {
        [this.customValue] = this.value.filter((x) => !this.findSource(x));
        if (this.customValue) {
          this.customSelected = true;
        }
      }
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
    valueIncludesCustom() {
      return (
        Array.isArray(this.value) &&
        Array.isArray(this.control.options.source) &&
        !this.value.every(this.sourceContains)
      );
    },
  },
  created() {
    if (!this.sourceIsValid) {
      return;
    }

    this.selections = this.filteredSource.map((s) => ({
      value: s.value,
      label: s.label,
      selected: false,
    }));

    if (!Array.isArray(this.value)) {
      return;
    }
    console.log(this.value);
    this.initSelections();
  },
  watch: {
    value() {
      this.initSelections();
    },
  },
};
</script>

<style scoped></style>
