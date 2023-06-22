<template>
  <v-btn color="primary" elevation="0" rounded small :outlined="!primary" @click.stop="handleClick">
    <v-icon left small>mdi-redo-variant</v-icon>
    Resubmit
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
  setup(props, { root }) {
    const handleClick = async () => {
      // Create a new local draft from the submission
      await root.$store.dispatch('myDrafts/saveLocalDrafts', [props.submission]);

      root.$router.push(`/submissions/drafts/${props.submission._id}`);
    };

    return {
      handleClick,
    };
  },
});
</script>
