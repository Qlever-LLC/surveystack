<template>
  <a-icon small color="primary-lighten-1" class="ml-1">
    mdi-eye-off
    <a-tooltip :top="top || fallback" :right="right" :bottom="bottom" :left="left" activator="parent"
      >Private</a-tooltip
    >
  </a-icon>
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
