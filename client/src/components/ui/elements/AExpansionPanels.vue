<template>
  <v-expansion-panels
    :accordion="accordion"
    :flat="flat"
    :multiple="multiple"
    :value="value"
    @change="$emit('input', $event)"
  >
    <slot />
  </v-expansion-panels>
</template>

<script>
export default {
  props: {
    accordion: { type: Boolean, default: false },
    flat: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },
    value: { type: undefined, required: false },
  },
  emits: ['input'],
};
</script>

<style scoped></style>
