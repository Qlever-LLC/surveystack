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
      :loading="isArchiving"
      @cancel="isOpen = false"
      @confirm="handleArchive"
    >
      <template #title>Archive Submission</template>
    </submission-archive-dialog>
  </div>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';
import SubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';
import { SubmissionLoadingActions } from '@/store/modules/submissions.store';

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
    const loading = computed(() => root.$store.getters['submissions/getLoading'](props.submission._id));
    const isArchiving = computed(() => loading.value === SubmissionLoadingActions.ARCHIVE_SUBMISSION);

    const handleArchive = (reason) => {
      root.$store.dispatch('submissions/archiveSubmissions', {
        ids: [props.submission._id],
        reason,
      });
    };

    return {
      isOpen,
      loading,
      isArchiving,
      handleArchive,
    };
  },
});
</script>
