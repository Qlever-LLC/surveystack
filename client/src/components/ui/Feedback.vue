<template>
  <a-alert border="start" :type="type" :border-color="color" :elevation="elevation" :color="color" :icon="icon">
    <strong v-if="title" class="mr-1">{{ title }}</strong>
    <slot />
    <a-icon v-if="closeable" class="float-right" @click="$emit('closed')">mdi-close-circle</a-icon>
  </a-alert>
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
    closeable: {
      type: Boolean,
      default: true,
    },
    elevation: {
      type: Number,
      default: 3,
    },
    color: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
  },
};
</script>
