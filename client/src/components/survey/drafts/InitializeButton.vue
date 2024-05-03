<template>
  <a-btn icon>
    <a-icon :color="highlight ? 'blue' : 'grey-lighten-1'" @click.stop="$emit('initialize')"> mdi-refresh</a-icon>
    <a-tooltip :top="top || fallback" :right="right" :bottom="bottom" :left="left" activator="parent">{{
      tooltip
    }}</a-tooltip>
  </a-btn>
</template>

<script>
export default {
  props: {
    top: {
      type: Boolean,
    },
    right: {
      type: Boolean,
    },
    bottom: {
      type: Boolean,
    },
    left: {
      type: Boolean,
    },
    highlight: {
      type: Boolean,
      default: false,
    },
    tooltip: {
      type: String,
      default: 'Initialize value',
    },
  },
  computed: {
    fallback() {
      const hasLocationSet = ['top', 'right', 'bottom', 'left'].map((loc) => this[loc]).some((v) => v);
      return !hasLocationSet;
    },
  },
};
</script>
