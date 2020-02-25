<template>
  <v-alert
    border="left"
    :type="type"
    colored-border
    elevation="3"
  >
    <strong
      v-if="title"
      class="mr-1"
    >{{title}}</strong>
    <slot />
    <v-icon
      class="float-right"
      @click="$emit('closed')"
    >mdi-close-circle</v-icon>
  </v-alert>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'error',
      required: false,
    },
  },
};
</script>
