<template>
  <v-menu
    :attach="attach"
    :close-on-content-click="closeOnContentClick"
    :disabled="disabled"
    :location="location"
    :max-height="maxHeight"
    :max-width="maxWidth"
    :min-width="minWidth"
    :transition="transition"
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    v-bind="$attrs"
  >
    <template v-slot:activator="{ props }">
      <slot name="activator" :props="props" />
    </template>
    <slot />
  </v-menu>
</template>

<script>
export default {
  name: 'AMenu',
  emits: ['update:modelValue'],
  props: {
    attach: { type: undefined, default: false },
    closeOnContentClick: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    location: {
      type: String,
      validator: function (value) {
        return ['top', 'bottom', 'start', 'end'].includes(value);
      },
      required: false,
    },
    maxHeight: { type: [Number, String], default: 'auto' },
    maxWidth: { type: [Number, String], default: 'auto' },
    minWidth: { type: [Number, String], required: false },
    transition: { type: String, default: 'v-menu-transition' },
    modelValue: { type: undefined, required: false },
  },
};
</script>
