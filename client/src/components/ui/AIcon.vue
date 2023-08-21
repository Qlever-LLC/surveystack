<template>
  <v-icon :color="color" :size="size" :left="left">
    <slot />
  </v-icon>
</template>

<script>
export default {
  props: {
    color: { type: String, required: false },
    left: { type: Boolean, required: false }, //v3: start
    right: { type: Boolean, required: false }, //v3: end
    size: { type: [String, Number], required: false }, //number in pixels or one of x-small, small, default, large, and x-large
    dark: { type: Boolean, required: false },
    disabled: { type: Boolean, required: false }, //v3: replace by v-btn
  },
};
</script>

<style scoped></style>
