<template>
  <a-chip class="px-4 mx-1" small :color="color">
    <span class="font-weight-bold white--text">
      <a-icon x-small left>{{ icon }}</a-icon>
      <slot>???</slot>
    </span>
  </a-chip>
</template>

<script>
export default {
  props: {
    icon: {
      type: String,
      default: 'mdi-help-circle-outline',
    },
    color: {
      type: String,
      default: '#bbb',
    },
  },
};
</script>
