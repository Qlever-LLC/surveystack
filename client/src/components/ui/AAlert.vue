<template>
  <v-alert
    :border="border"
    :color="color"
    :colored-border="coloredBorder"
    :dismissible="dismissible"
    :elevation="elevation"
    :icon="icon"
    :mode="mode"
    :outlined="outlined"
    :prominent="prominent"
    :text="text"
    :type="type"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <template v-slot:default>
      <slot name="default" />
    </template>
  </v-alert>
</template>

<script>
export default {
  props: {
    border: { type: String, required: false },
    coloredBorder: { type: Boolean, default: false },
    dismissible: { type: Boolean, default: false },
    elevation: { type: [Number, String], required: false },
    icon: { type: [Boolean, String], required: false },
    mode: { type: String, required: false },
    outlined: { type: Boolean, default: false },
    prominent: { type: Boolean, default: false },
    text: { type: Boolean, default: false },
    type: { type: String, required: false },
  },
};
</script>
