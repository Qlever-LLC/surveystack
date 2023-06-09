<template>
  <v-btn
    color="primary"
    elevation="0"
    rounded
    small
    :outlined="!primary"
    :disabled="!!loading"
    :loading="isDraftDownloading"
    @click.stop="handleClick"
  >
    <v-icon left small>mdi-redo-variant</v-icon>
    Resubmit
  </v-btn>
</template>

<script>
import { useSubmissionAction } from '@/store/modules/submissions.store';
import { computed, defineComponent } from '@vue/composition-api';

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
    const submission = computed(() => props.submission);
    const { loading, isDraftDownloading, downloadDraft } = useSubmissionAction(root.$store, submission);

    const handleClick = async () => {
      // Create a new local draft from the submission
      await downloadDraft();

      root.$router.push(`/submissions/drafts/${props.submission._id}`);
    };

    return {
      loading,
      isDraftDownloading,
      handleClick,
    };
  },
});
</script>
