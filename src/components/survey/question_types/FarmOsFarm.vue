<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
    />
    <v-autocomplete
      :disabled="loading"
      :value="getValue"
      @change="handleChange"
      :items="farms || []"
      item-text="label"
      item-value="value"
      outlined
      :label="control.hint"
      :chips="control.options.hasMultipleSelections"
      :multiple="control.options.hasMultipleSelections"
      :deletable-chips="control.options.hasMultipleSelections"
      @keyup.enter.prevent="submit"
      :loading="loading"
    />
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import farmosBase from './FarmOsBase';
import { getValueOrNull } from '@/utils/surveyStack';

export default {
  mixins: [baseQuestionComponent, farmosBase()],
  data() {
    return {
      farms: [],
    };
  },
  async created() {
    await this.fetchFarms();
  },
  methods: {
    fetch,
    handleChange(v) {
      const nextValue = Array.isArray(v)
        ? getValueOrNull(v)
        : [getValueOrNull(v)];

      this.changed(nextValue);
    },
  },
  computed: {
    getValue() {
      return this.control.options.hasMultipleSelections
        ? this.value
        : this.value && this.value[0];
    },
  },
};
</script>
