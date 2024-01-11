<template>
  <v-btn-toggle
    :density="dense ? 'compact' : 'default'"
    :mandatory="mandatory"
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)">
    <slot />
  </v-btn-toggle>
</template>

<script>
export default {
  name: 'ABtnToggle',
  props: {
    dense: { type: Boolean, required: false },
    modelValue: { type: undefined, required: false },
    mandatory: { type: [Boolean, String], required: false },
  },
  emits: ['update:modelValue'],
};
</script>
