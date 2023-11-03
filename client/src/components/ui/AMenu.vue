<template>
  <v-menu
    :disabled="disabled"
    :attach="attach"
    :max-height="maxHeight"
    :max-width="maxWidth"
    :min-width="minWidth"
    :transition="transition"
    :close-on-content-click="closeOnContentClick"
    :left="left"
    :offset-y="offsetY"
    :value="value"
    v-bind="$attrs"
    @change="$emit('input', $event)"
  >
    <slot />
  </v-menu>
</template>

<script>
export default {
  props: {
    attach: {},
    maxHeight: {},
    maxWidth: {},
    minWidth: {},
    closeOnContentClick: {},
    left: {},
    transition: {},
    disabled: { type: Boolean, default: false },
    offsetY: { type: Boolean, default: false },
    value: { type: undefined, required: false },
  },
  emits: ['input'],
};
</script>

<style scoped></style>
