<template>
  <a-tooltip :top="top || fallback" :right="right" :bottom="bottom" :left="left">
    <template v-slot:activator="{ on, attrs }">
      <a-icon small color="primary lighten-1" v-bind="attrs" v-on="on" class="ml-1">mdi-eye-off</a-icon>
    </template>
    <span>Private</span>
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
  },
  computed: {
    fallback() {
      const hasLocationSet = ['top', 'right', 'bottom', 'left'].map((loc) => this[loc]).some((v) => v);
      return !hasLocationSet;
    },
  },
};
</script>
