<template>
  <div v-if="submissions.length > 0">
    <v-btn color="orange darken-1" dark :disabled="disabled" :loading="isLoading" @click.stop="isOpen = true">
      Archive ({{ submissions.length }})
    </v-btn>

    <submission-archive-dialog
      v-model="isOpen"
      maxWidth="50rem"
      labelConfirm="Archive"
      @cancel="isOpen = false"
      @confirm="handleArchiveSubmissions"
    >
      <template #title>Archive Submissions</template>
    </submission-archive-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, watch } from '@vue/composition-api';
import SubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';

export default defineComponent({
  components: {
    SubmissionArchiveDialog,
  },
  props: {
    submissions: {
      type: Array,
      required: true,
    },
    disabled: { type: Boolean },
  },
  emits: ['loading-change'],
  setup(props, { root, emit }) {
    const isOpen = ref(false);
    const isLoading = ref(false);

    const handleArchiveSubmissions = (reason) => {
      isOpen.value = false;
      isLoading.value = true;
      const ids = props.submissions.map((item) => item._id);
      const success = root.$store.dispatch('submissions/archiveSubmissions', { ids, reason });
      isLoading.value = false;

      if (!success) {
        root.$store.dispatch(
          'feedback/add',
          `Something went wrong while archiving ${ids.length === 1 ? 'the submission' : ids.length + ' submissions'}.`
        );
      }
    };

    watch(isLoading, (val) => {
      emit('loading-change', val);
    });

    return {
      isOpen,
      isLoading,
      handleArchiveSubmissions,
    };
  },
});
</script>
