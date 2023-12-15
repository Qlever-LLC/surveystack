<template>
  <v-btn-toggle
    :density="dense ? 'compact' : 'default'"
    :mandatory="mandatory"
    :value="value"
    @change="$emit('input', $event)"
  >
    <slot />
  </v-btn-toggle>
</template>

<script>
export default {
  name: 'ABtnToggle',
  props: {
    dense: { type: Boolean, required: false },
    value: { type: undefined, required: false },
    mandatory: { type: [Boolean, String], required: false },
  },
  emits: ['input'],
};
</script>
