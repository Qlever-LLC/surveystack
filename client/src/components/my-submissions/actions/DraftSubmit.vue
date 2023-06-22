<template>
  <v-btn color="primary" elevation="0" rounded small @click.stop="$emit('click')">
    <v-icon left small>{{ primary ? 'mdi-cloud-upload' : 'mdi-cloud-upload-outline' }}</v-icon>
    Submit
  </v-btn>
</template>

<script>
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    submission: {
      type: Object,
      required: true,
    },
    primary: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
});
</script>
