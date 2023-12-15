<template>
  <v-btn
    :type="type"
    :value="value"
    :disabled="disabled"
    :fixed="fixed"
    :loading="loading"
    :icon="icon"
    :fab="fab"
    :size="xSmall ? 'x-small' : small ? 'small' : large ? 'large' : xLarge ? 'x-large' : 'default'"
    :elevation="elevation"
    :color="color"
    :href="href"
    :target="target"
    :to="to"
    :density="dense ? 'compact' : 'default'"
    :rounded="rounded"
    :variant="variant"
    :class="fab ? 'rounded-circle' : icon ? 'text-medium-emphasis' : ''"
    :style="
      !fab
        ? ''
        : xSmall
          ? 'min-width:32px;width:32px;min-height:32px;height:32px;'
          : small
            ? 'min-width:40px;width:40px;min-height:40px;height:40px;'
            : 'min-width:56px;width:56px;min-height:56px;height:56px;'
    "
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
    fixed: {
      type: Boolean,
      default: false,
    },
    loading: {
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
    dense: {
      type: Boolean,
      required: false,
    },
    rounded: {
      type: Boolean,
      required: false,
    },
    variant: {
      type: String,
      validator: function (value) {
        return ['flat', 'text', 'elevated', 'tonal', 'outlined', 'plain'].includes(value);
      },
      default: (props) => (props.icon ? 'text' : undefined), // if it's an icon button, use text as default like it was in v2
    },
  },
};
</script>
