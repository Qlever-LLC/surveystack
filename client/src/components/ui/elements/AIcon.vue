<template>
  <a-tooltip v-if="tooltip" max-width="400" transition="fade-transition" right>
    <template v-slot:activator="{ props }">
      <v-icon
        :color="color"
        :icon="icon"
        :start="left"
        :end="right"
        :size="size ? size : xSmall ? 'x-small' : small ? 'small' : large ? 'large' : xLarge ? 'x-large' : 'default'"
        v-bind="mergeProps($attrs, props)">
        <slot />
      </v-icon>
    </template>
    {{ tooltip }}
  </a-tooltip>
  <v-icon
    v-else
    :color="color"
    :icon="icon"
    :start="left"
    :end="right"
    :size="size ? size : xSmall ? 'x-small' : small ? 'small' : large ? 'large' : xLarge ? 'x-large' : 'default'"
    v-bind="$attrs"
  >
    <slot />
  </v-icon>
</template>

<script>
import { mergeProps } from 'vue';

export default {
  methods: { mergeProps },
  props: {
    icon: { type: String, required: false },
    color: { type: String, required: false },
    left: { type: Boolean, required: false }, //v3: start
    right: { type: Boolean, required: false }, //v3: end
    small: { type: Boolean, required: false },
    xSmall: { type: Boolean, required: false },
    large: { type: Boolean, required: false },
    xLarge: { type: Boolean, required: false },
    size: { type: [Number, String], required: false }, //custom font size, wins over small/xSmall/large/xLarge
    tooltip: { type: String, required: false },
  },
};
</script>
