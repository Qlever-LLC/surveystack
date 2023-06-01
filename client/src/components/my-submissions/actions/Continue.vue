<template>
  <v-btn color="primary" elevation="0" rounded small @click.stop="handleClick">
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
  setup(props, { root }) {
    const handleClick = async () => {
      // If server draft, download to local in order to save a draft real time
      if (!props.submission.options.local) {
        await root.$store.dispatch('submissions/saveToLocal', props.submission);
      }
      root.$router.push(`/submissions/drafts/${props.submission._id}`);
    };

    return {
      handleClick,
    };
  },
});
</script>
