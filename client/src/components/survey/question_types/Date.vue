<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      :is-modified="meta && !!meta.dateModified"
      @initialize="initialize" />
    <a-date
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :label="control.hint"
      :menu-props="{ offsetY: true }"
      prepend-inner-icon="mdi-calendar"
      :type="control.options.subtype"
      variant="outlined"
      readonly
      yearType="number"
      cssminWidth290px
      color="focus"
      persistent-hint
      :startMonth="getStartMonth()"
      :startYear="getStartYear()" />
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';

export default {
  mixins: [baseQuestionComponent],
  methods: {
    getStartMonth() {
      return this.control?.startMonth ? String(this.control.startMonth) : undefined;
    },
    getStartYear() {
      return this.control?.startYear ? Number(this.control.startYear.substring(0, 4)) : undefined;
    },
  },
};
</script>
