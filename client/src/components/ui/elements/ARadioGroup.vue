<template>
  <v-radio-group
    :value="value"
    @change="$emit('input', $event)"
    :name="name"
    :disabled="disabled"
    :hide-details="hideDetails"
  >
    <slot />
  </v-radio-group>
</template>

<script>
export default {
  props: {
    value: { type: undefined, required: false },
    name: { type: String, required: false },
    disabled: { type: Boolean, required: false },
    hideDetails: { type: [Boolean, String], required: false },
  },
  emits: ['input'],
};
</script>
