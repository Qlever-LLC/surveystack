<template>
  <v-chip
    class="px-4 mx-1"
    small
    :color="color"
  >
    <span class="font-weight-bold white--text">
      <v-icon
        left
        x-small
      >{{icon}}</v-icon>
      <slot>???</slot>
    </span>
  </v-chip>
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
