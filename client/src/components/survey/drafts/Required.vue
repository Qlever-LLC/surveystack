<template>
  <a-icon small color="red-darken-2" class="ml-1">
    mdi-asterisk
    <a-tooltip :top="top || fallback" :right="right" :bottom="bottom" :left="left" activator="parent"
      >Required</a-tooltip
    ></a-icon
  >
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
