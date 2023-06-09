<template>
  <footer v-if="isOpen" class="action-bar">
    <v-container>
      <span class="flex-grow-1">Selected: {{ selected.length }}</span>

      <div class="buttons">
        <v-btn
          v-if="draftsToSubmit.length > 0"
          color="primary"
          dark
          :disabled="!!loading"
          :loading="isSubmitDraft"
          @click.stop="handleSubmitDrafts"
        >
          Submit drafts ({{ draftsToSubmit.length }})
        </v-btn>
        <v-btn
          v-if="draftsToDelete.length > 0"
          color="red lighten-2"
          dark
          :disabled="!!loading"
          :loading="isDeleteDraft"
          @click.stop="handleDeleteDrafts"
        >
          Delete drafts ({{ draftsToDelete.length }})
        </v-btn>
        <v-btn
          v-if="submissionsToArchive.length > 0"
          color="orange darken-1"
          dark
          :disabled="!!loading"
          :loading="isArchiveSubmission"
          @click.stop="handleArchiveSubmissions"
        >
          Archive submissions ({{ submissionsToArchive.length }})
        </v-btn>
        <v-btn
          v-if="submissionsToDelete.length > 0"
          color="red lighten-2"
          dark
          :disabled="!!loading"
          :loading="isDeleteSubmission"
          @click.stop="handleDeleteSubmissions"
        >
          Delete submissions ({{ submissionsToDelete.length }})
        </v-btn>
      </div>

      <div class="flex-grow-1 text-end">
        <v-btn text dark @click="handleClear">Clear all</v-btn>
      </div>
    </v-container>
  </footer>
</template>

<script>
import { SubmissionLoadingActions } from '@/store/modules/submissions.store';
import { computed, defineComponent, ref, watch } from '@vue/composition-api';

export default defineComponent({
  emits: ['open-change'],
  setup(props, { root, emit }) {
    const loading = ref();
    const isSubmitDraft = computed(() => loading.value === SubmissionLoadingActions.SUBMIT_DRAFT);
    const isDeleteDraft = computed(() => loading.value === SubmissionLoadingActions.DELETE_DRAFT);
    const isArchiveSubmission = computed(() => loading.value === SubmissionLoadingActions.ARCHIVE_SUBMISSION);
    const isDeleteSubmission = computed(() => loading.value === SubmissionLoadingActions.DELETE_SUBMISSION);
    const selected = computed(() => root.$store.getters['submissions/selected']);
    const memberships = computed(() => root.$store.getters['memberships/memberships']);
    const userId = computed(() => root.$store.getters['auth/user']._id);
    const draftsToSubmit = computed(() => selected.value.filter((item) => item.options.draft));
    const draftsToDelete = computed(() => selected.value.filter((item) => item.options.draft));
    const submissionsToArchive = computed(() =>
      selected.value.filter(
        (item) =>
          // not archived
          !item.meta.archived &&
          // not a draft
          !item.options.draft &&
          // admin or creator
          (item.meta.creator === userId.value ||
            memberships.value.some(
              (membership) => membership.group._id === item.meta.group.id && membership.role === 'admin'
            ))
      )
    );
    const submissionsToDelete = computed(() =>
      selected.value.filter(
        (item) =>
          // archived
          item.meta.archived &&
          // not a draft
          !item.options.draft &&
          // admin or creator
          (item.meta.creator === userId.value ||
            memberships.value.some(
              (membership) => membership.group._id === item.meta.group.id && membership.role === 'admin'
            ))
      )
    );

    const handleSubmitDrafts = async () => {
      loading.value = SubmissionLoadingActions.SUBMIT_DRAFT;
      await root.$store.dispatch('submissions/submitDrafts', draftsToSubmit.value);
      loading.value = undefined;
    };

    const handleDeleteDrafts = () => {
      //
    };

    const handleDeleteSubmissions = () => {
      //
    };

    const handleArchiveSubmissions = () => {
      //
    };

    const handleClear = () => {
      root.$store.dispatch('submissions/clearSelection');
    };

    const isOpen = computed(() => selected.value.length > 1);

    watch(isOpen, (val) => {
      emit('open-change', val);
    });

    return {
      loading,
      isSubmitDraft,
      isDeleteDraft,
      isArchiveSubmission,
      isDeleteSubmission,
      isOpen,
      selected,
      draftsToSubmit,
      draftsToDelete,
      submissionsToArchive,
      submissionsToDelete,
      handleSubmitDrafts,
      handleDeleteDrafts,
      handleDeleteSubmissions,
      handleArchiveSubmissions,
      handleClear,
    };
  },
});
</script>

<style lang="scss">
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  box-shadow: 0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 6px 10px 0px rgba(0, 0, 0, 0.14),
    0px 1px 18px 0px rgba(0, 0, 0, 0.12);
  background-color: #455a64;
  border-top: 1px solid #546e7a;
  color: white;
  display: flex;
  justify-content: center;
  z-index: 1;

  .container {
    display: flex;
    align-items: center;
    max-width: 1280px;

    .buttons > * + * {
      margin-left: 12px;
    }
  }
}
</style>
