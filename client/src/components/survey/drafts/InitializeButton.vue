<template>
  <a-tooltip :top="top || fallback" :right="right" :bottom="bottom" :left="left">
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon v-bind="attrs" v-on="on">
        <a-icon :color="highlight ? 'blue' : 'grey lighten-1'" @click.stop="$emit('initialize')"> mdi-refresh </a-icon>
      </v-btn>
    </template>
    <span>{{ tooltip }}</span>
  </a-tooltip>
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
