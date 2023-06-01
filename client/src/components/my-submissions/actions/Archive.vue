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
      <template v-slot:title>Confirm Submission Archiving</template>
    </submission-archive-dialog>
  </div>
</template>

<script>
import { get } from 'lodash';
import { computed, defineComponent, ref } from '@vue/composition-api';
import SubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';
import api from '@/services/api.service';

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
    const isArchiving = ref(false);
    const loading = computed(() => root.$store.getters['submissions/getLoading'](props.submission._id));

    const handleArchive = async (reason) => {
      try {
        isArchiving.value = true;

        await api.post(`/submissions/bulk-archive?set=true&reason=${reason}`, {
          ids: [props.submission._id],
        });

        const hideArchived = root.$store.getters['submissions/filter'].hideArchived;
        if (hideArchived) {
          root.$store.dispatch('submissions/removeSubmission', props.submission._id);
        } else {
          root.$store.dispatch('submissions/setSubmission', {
            ...props.submission,
            meta: { ...props.submission.meta, archived: true },
          });
        }
      } catch (e) {
        root.$store.dispatch('feedback/add', get(e, 'response.data.message', 'Failed to archive submission'));
      } finally {
        isArchiving.value = false;
      }
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
