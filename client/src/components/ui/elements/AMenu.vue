<template>
  <v-menu
    :attach="attach"
    :close-on-content-click="closeOnContentClick"
    :disabled="disabled"
    :left="left"
    :max-height="maxHeight"
    :max-width="maxWidth"
    :min-width="minWidth"
    :offset-y="offsetY"
    :transition="transition"
    :value="value"
    v-bind="$attrs"
    @input="$emit('input', $event)"
  >
    <template v-slot:activator="{ on, attrs }">
      <slot name="activator" :on="on" :attrs="attrs"></slot>
    </template>
    <slot></slot>
  </v-menu>
</template>

<script>
export default {
  name: 'AMenu',
  props: {
    attach: { type: undefined, default: false },
    closeOnContentClick: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    left: { type: Boolean, default: false },
    maxHeight: { type: [Number, String], default: 'auto' },
    maxWidth: { type: [Number, String], default: 'auto' },
    minWidth: { type: [Number, String], required: false },
    offsetY: { type: Boolean, default: false },
    transition: { type: String, default: 'v-menu-transition' },
    value: { type: undefined, required: false },
  },
  emits: ['input'],
};
</script>

<style scoped></style>
