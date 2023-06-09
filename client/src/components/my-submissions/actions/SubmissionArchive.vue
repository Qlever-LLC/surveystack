<template>
  <div>
    <v-btn
      color="error"
      elevation="0"
      rounded
      small
      icon
      text
      outlined
      :disabled="!!loading"
      @click.stop="isOpen = true"
    >
      <v-icon small>mdi-archive-outline</v-icon>
    </v-btn>

    <submission-archive-dialog
      v-model="isOpen"
      maxWidth="50rem"
      labelConfirm="Archive"
      :loading="isSubmissionArchiving"
      @cancel="isOpen = false"
      @confirm="archiveSubmission"
    >
      <template #title>Archive Submission</template>
    </submission-archive-dialog>
  </div>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';
import SubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';
import { useSubmissionAction } from '@/store/modules/submissions.store';

export default defineComponent({
  components: {
    SubmissionArchiveDialog,
  },
  props: {
    submission: {
      type: Object,
      required: true,
    },
  },
  setup(props, { root }) {
    const isOpen = ref(false);
    const submission = computed(() => props.submission);
    const { loading, isSubmissionArchiving, archiveSubmission } = useSubmissionAction(root.$store, submission);

    return {
      isOpen,
      loading,
      isSubmissionArchiving,
      archiveSubmission,
    };
  },
});
</script>
