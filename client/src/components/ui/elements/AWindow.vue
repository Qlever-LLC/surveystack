<template>
  <v-window :touchless="touchless" :value="value" @change="$emit('input', $event)">
    <slot />
  </v-window>
</template>

<script>
export default {
  props: {
    touchless: { type: Boolean, default: false },
    value: { type: undefined, required: false },
  },
  emits: ['input'],
};
</script>

<style scoped></style>
