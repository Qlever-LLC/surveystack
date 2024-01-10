<template>
  <v-speed-dial
    :bottom="bottom"
    :direction="direction"
    :fixed="fixed"
    :transition="transition"
    :value="value"
    v-bind="$attrs"
    @input="$emit('input', $event)">
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
    value: { type: undefined, required: false },
  },
  emits: ['input'],
};
</script>

<style scoped lang="scss"></style>
