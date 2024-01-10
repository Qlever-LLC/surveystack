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
  computed: {
    value() {
      return this.modelValue;
    },
  },
};
</script>

<style scoped lang="scss"></style>
