<template>
  <v-window v-model="value" @update:modelValue="$emit('update:modelValue', $event)" :touch="touch">
    <slot />
  </v-window>
</template>

<script>
export default {
  props: {
    modelValue: { type: undefined, required: false },
    touch: { type: Boolean, required: false },
  },
  computed: {
    value() {
      return this.modelValue;
    },
  },
};
</script>

<style scoped lang="scss"></style>
