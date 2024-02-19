<template>
  <a-select
    :modelValue="getModelValue"
    @update:modelValue="emitYear"
    :clearable="clearable"
    :dense="dense"
    :hideDetails="hideDetails"
    :items="years()"
    :label="label"
    :menuProps="menuProps"
    :prependInnerIcon="prependInnerIcon"
    :type="type"
    :variant="variant" />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: undefined, required: false },
  clearable: { type: Boolean, required: false },
  dense: { type: Boolean, required: false },
  hideDetails: { type: [Boolean, String], required: false },
  items: { type: Array, required: false },
  label: { type: String, required: false },
  menuProps: { type: [String, Array, Object], required: false },
  prependInnerIcon: { type: String, required: false },
  type: { type: String, required: false },
  variant: { type: String, required: false },
});
const emit = defineEmits(['update:modelValue']);

const getModelValue = computed(() => {
  return props.modelValue ? Number(props.modelValue.substring(0, 4)) : null;
});

const years = () => {
  const years = [];
  const maxYear = new Date().getFullYear() + 100;
  for (let i = 1970; i <= maxYear; i++) {
    years.push(i);
  }
  return years;
};

const emitYear = ($event) => {
  console.log($event);
  if (typeof $event === 'number') {
    emit('update:modelValue', new Date(Date.UTC($event, 0, 1)).toISOString()); // set to first day of year
  } else {
    emit('update:modelValue', null);
  }
};
</script>
