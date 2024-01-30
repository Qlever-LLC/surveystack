<template>
  <v-window :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" :touch="touch">
    <slot />
  </v-window>
</template>

<script>
export default {
  emits: ['update:modelValue'],
  props: {
    modelValue: { type: undefined, required: false },
    touch: { type: Boolean, required: false },
  },
};
</script>

<style scoped lang="scss"></style>
