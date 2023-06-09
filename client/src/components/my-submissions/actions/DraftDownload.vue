<template>
  <v-btn
    rounded
    small
    icon
    text
    outlined
    :disabled="!!loading"
    :loading="isDraftDownloading"
    @click.stop="downloadDraft"
  >
    <v-icon small>mdi-download-outline</v-icon>
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
  },
  setup(props, { root }) {
    const submission = computed(() => props.submission);
    const { loading, isDraftDownloading, downloadDraft } = useSubmissionAction(root.$store, submission);

    return {
      loading,
      isDraftDownloading,
      downloadDraft,
    };
  },
});
</script>
