<template>
  <v-btn
    color="primary"
    elevation="0"
    rounded
    small
    :outlined="!primary"
    @click.stop="$router.push(`/submissions/drafts/${submission._id}`)"
  >
    <v-icon left small>{{ primary ? 'mdi-play' : 'mdi-play-outline' }}</v-icon>
    Continue
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
});
</script>
