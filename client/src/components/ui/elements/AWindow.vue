<template>
  <v-window :touchless="touchless" v-model="value" @change="$emit('input', $event)">
    <slot />
  </v-window>
</template>

<script>
export default {
  props: {
    touchless: { type: Boolean, default: false },
    modelValue: { type: undefined, required: false },
  },
  emits: ['input'],
  data() {
    return {
      value: this.modelValue,
    };
  },
};
</script>

<style scoped></style>
