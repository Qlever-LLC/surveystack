<template>
  <v-icon
    :color="color"
    :icon="icon"
    :start="left"
    :end="right"
    :size="size ? size : xSmall ? 'x-small' : small ? 'small' : large ? 'large' : xLarge ? 'x-large' : 'default'"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </v-icon>
</template>

<script>
export default {
  props: {
    icon: { type: String, required: false },
    color: { type: String, required: false },
    left: { type: Boolean, required: false }, //v3: start
    right: { type: Boolean, required: false }, //v3: end
    small: { type: Boolean, required: false },
    xSmall: { type: Boolean, required: false },
    large: { type: Boolean, required: false },
    xLarge: { type: Boolean, required: false },
    size: { type: Number, required: false }, //custom font size, wins over small/xSmall/large/xLarge
    disabled: { type: Boolean, required: false }, //v3: TODO replace by v-btn
  },
};
</script>

<style scoped></style>
