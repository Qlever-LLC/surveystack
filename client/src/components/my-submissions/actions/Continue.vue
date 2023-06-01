<template>
  <v-btn
    color="primary"
    elevation="0"
    rounded
    small
    @click.stop="$router.push(`/submissions/drafts/${submission._id}`)"
  >
    <v-icon left small>mdi-play</v-icon>
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
  },
});
</script>
