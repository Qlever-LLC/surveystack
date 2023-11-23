<template>
  <v-btn
    :type="type"
    :value="value"
    :disabled="disabled"
    :depressed="depressed"
    :fixed="fixed"
    :loading="loading"
    :text="text"
    :icon="icon"
    :fab="fab"
    :outlined="outlined"
    :x-large="xLarge"
    :large="large"
    :x-small="xSmall"
    :small="small"
    :dark="dark"
    :elevation="elevation"
    :color="color"
    :href="href"
    :target="target"
    :to="to"
    v-on="$listeners"
    v-bind="$attrs"
  >
    <slot />
  </v-btn>
</template>

<script>
export default {
  props: {
    type: {
      type: String,
      default: 'button',
    },
    value: {
      type: undefined,
      required: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    depressed: {
      type: Boolean,
      default: false,
    },
    fixed: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    text: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: Boolean,
      default: false,
    },
    fab: {
      type: Boolean,
      default: false,
    },
    outlined: {
      type: Boolean,
      default: false,
    },
    xSmall: {
      type: Boolean,
      default: false,
    },
    small: {
      type: Boolean,
      default: false,
    },
    large: {
      type: Boolean,
      default: false,
    },
    xLarge: {
      type: Boolean,
      default: false,
    },
    dark: {
      type: Boolean,
      default: false,
    },
    elevation: {
      type: [Number, String],
      required: false,
    },
    href: {
      type: [String, Object],
      required: false,
    },
    to: {
      type: [String, Object],
      required: false,
    },
    target: {
      type: String,
      required: false,
    },
    color: {
      type: String,
      required: false,
    },
  },
  emits: ['click'],
  setup() {
    return {};
  },
};
</script>
