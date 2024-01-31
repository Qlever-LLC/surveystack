<template>
  <v-speed-dial
    :bottom="bottom"
    :direction="direction"
    :fixed="fixed"
    :transition="transition"
    :modelValue="modelValue"
    v-bind="$attrs"
    @update:modelValue="$emit('update:modelValue', $event)">
    <template v-slot:activator>
      <slot name="activator"></slot>
    </template>
    <slot></slot>
  </v-speed-dial>
</template>

<script>
export default {
  props: {
    bottom: { type: Boolean, default: false },
    direction: { type: String, default: 'top' },
    fixed: { type: Boolean, default: false },
    transition: { type: String, default: 'scale-transition' },
    modelValue: { type: undefined, required: false },
  },
  emits: ['update:modelValue'],
};
</script>

<style scoped lang="scss"></style>
