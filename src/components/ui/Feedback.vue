<template>
  <v-alert border="left" :type="type" role="alert">
    <strong class="mr-1">{{title}}</strong>
    <slot />
    <v-icon class="float-right" @click="$emit('closed')">mdi-close-circle</v-icon>
  </v-alert>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: 'Error!',
    },
    type: {
      type: String,
      default: 'warning',
      required: false,
    },
  },
};
</script>
