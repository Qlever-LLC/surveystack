<template>
  <v-tooltip
    :bottom="bottom"
    :disabled="disabled"
    :left="left"
    :max-width="maxWidth"
    :open-delay="openDelay"
    :right="right"
    :top="top"
    :transition="transition"
  >
    <template v-slot:activator="{ on, attrs }">
      <slot name="activator" :on="on" :attrs="attrs"></slot>
    </template>
    <slot />
  </v-tooltip>
</template>

<script>
export default {
  props: {
    // //vuetify props
    bottom: { type: Boolean, required: false },
    disabled: { type: Boolean, required: false },
    left: { type: Boolean, required: false },
    maxWidth: { type: [Number, String], required: false },
    openDelay: { type: [Number, String], required: false },
    right: { type: Boolean, required: false },
    top: { type: Boolean, required: false },
    transition: { type: String, required: false },
  },
};
</script>
