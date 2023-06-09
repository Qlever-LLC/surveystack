<template>
  <v-btn rounded small icon text outlined :disabled="!!loading" :loading="isDraftUploading" @click.stop="uploadDraft">
    <v-icon small>mdi-upload-outline</v-icon>
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
    const { loading, isDraftUploading, uploadDraft } = useSubmissionAction(root.$store, submission);

    return {
      loading,
      isDraftUploading,
      uploadDraft,
    };
  },
});
</script>
