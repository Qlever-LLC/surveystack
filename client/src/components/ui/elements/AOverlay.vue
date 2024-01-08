<template>
  <v-overlay :absolute="absolute" :modelValue="modelValue">
    <slot />
  </v-overlay>
</template>

<script>
export default {
  props: {
    absolute: { type: Boolean, required: false },
    modelValue: { type: Boolean, required: false },
  },
};
</script>
