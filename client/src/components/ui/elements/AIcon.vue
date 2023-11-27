<!-- eslint-disable vue/no-deprecated-dollar-listeners-api -->
<!-- TODO The `$listeners` is deprecated  vue/no-deprecated-dollar-listeners-api -->
<template>
  <v-icon
    :color="color"
    :left="left"
    :right="right"
    :small="small"
    :x-small="xSmall"
    :large="large"
    :x-large="xLarge"
    :size="size"
    :dark="dark"
    :disabled="disabled"
    v-on="$listeners"
    v-bind="$attrs"
  >
    <slot />
  </v-icon>
</template>

<script>
export default {
  props: {
    color: { type: String, required: false },
    left: { type: Boolean, required: false }, //v3: start
    right: { type: Boolean, required: false }, //v3: end
    small: { type: Boolean, required: false }, //v3: remove
    xSmall: { type: Boolean, required: false }, //v3: remove
    large: { type: Boolean, required: false }, //v3: remove
    xLarge: { type: Boolean, required: false }, //v3: remove
    size: { type: [String, Number], required: false }, //vuetify2: custom font size. TODO vuetify3: number in pixels or one of x-small, small, default, large, and x-large
    dark: { type: Boolean, required: false },
    disabled: { type: Boolean, required: false }, //v3: replace by v-btn
  },
};
</script>

<style scoped></style>
