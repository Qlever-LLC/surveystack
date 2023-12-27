<template>
  <v-window v-model="value" @update:modelValue="$emit('update:modelValue', $event)">
    <slot />
  </v-window>
</template>

<script>
export default {
  props: {
    modelValue: { type: undefined, required: false },
  },
  data() {
    return {
      value: this.modelValue,
    };
  },
};
</script>

<style scoped></style>
