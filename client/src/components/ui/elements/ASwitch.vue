<template>
  <v-switch :input-value="value" :label="label" :hide-details="hideDetails" @change="$emit('input', $event)" />
</template>

<script>
export default {
  name: 'ASwitch',
  props: {
    value: { type: undefined, required: false },
    label: { type: String, required: false },
    hideDetails: { type: [Boolean, String], required: false },
  },
  emits: ['input'],
};
</script>

<style scoped></style>
