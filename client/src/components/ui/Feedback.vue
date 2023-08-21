<template>
  <v-alert border="left" :type="type" colored-border :elevation="elevation" :color="color" :icon="icon">
    <strong v-if="title" class="mr-1">{{ title }}</strong>
    <slot />
    <a-icon v-if="closeable" class="float-right" @click="$emit('closed')">mdi-close-circle</a-icon>
  </v-alert>
</template>

<script>
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: { AIcon },
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
