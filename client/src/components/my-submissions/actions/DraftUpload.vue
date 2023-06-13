<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        rounded
        small
        icon
        text
        outlined
        :disabled="!!loading"
        :loading="isDraftUploading"
        v-on="on"
        @click.stop="uploadDraft"
      >
        <v-icon small>mdi-upload-outline</v-icon>
      </v-btn>
    </template>
    <span>Upload draft</span>
  </v-tooltip>
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
