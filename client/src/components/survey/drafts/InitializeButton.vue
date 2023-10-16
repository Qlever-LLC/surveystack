<template>
  <v-tooltip :top="top || fallback" :right="right" :bottom="bottom" :left="left">
    <template v-slot:activator="{ on, attrs }">
      <a-btn icon v-bind="attrs" v-on="on">
        <v-icon :color="highlight ? 'blue' : 'grey lighten-1'" @click.stop="$emit('initialize')"> mdi-refresh </v-icon>
      </a-btn>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script>
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
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
