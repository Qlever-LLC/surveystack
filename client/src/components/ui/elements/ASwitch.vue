<template>
  <v-switch
    :modelValue="modelValue"
    :label="label"
    :hide-details="hideDetails"
    @update:modelValue="$emit('update:modelValue', $event)"
    color="primary" />
</template>

<script>
export default {
  name: 'ASwitch',
  props: {
    modelValue: { type: undefined, required: false },
    label: { type: String, required: false },
    hideDetails: { type: [Boolean, String], required: false },
  },
};
</script>

<style scoped lang="scss"></style>
