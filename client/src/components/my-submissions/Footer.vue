<template>
  <footer v-if="isOpen" class="action-bar">
    <v-container>
      <span class="flex-grow-1">Selected: {{ selected.length }}</span>

      <div class="buttons d-flex align-center">
        <draft-submit-bulk
          :drafts="draftsToSubmit"
          :disabled="isLoading"
          @loading-change="isLoading = $event"
        ></draft-submit-bulk>
        <draft-delete-bulk
          :drafts="draftsToDelete"
          :disabled="isLoading"
          @loading-change="isLoading = $event"
        ></draft-delete-bulk>
        <submission-archive-bulk
          :submissions="submissionsToArchive"
          :disabled="isLoading"
          @loading-change="isLoading = $event"
        ></submission-archive-bulk>
        <submission-delete-bulk
          :submissions="submissionsToDelete"
          :disabled="isLoading"
          @loading-change="isLoading = $event"
        ></submission-delete-bulk>
      </div>

      <div class="flex-grow-1 text-end">
        <v-btn text dark @click="handleClear">Clear all</v-btn>
      </div>
    </v-container>
  </footer>
</template>

<script>
import { computed, defineComponent, ref, watch } from '@vue/composition-api';
import DraftSubmitBulk from './actions/DraftSubmitBulk.vue';
import DraftDeleteBulk from './actions/DraftDeleteBulk.vue';
import SubmissionArchiveBulk from './actions/SubmissionArchiveBulk.vue';
import SubmissionDeleteBulk from './actions/SubmissionDeleteBulk.vue';

export default defineComponent({
  components: {
    DraftSubmitBulk,
    DraftDeleteBulk,
    SubmissionArchiveBulk,
    SubmissionDeleteBulk,
  },
  emits: ['open-change'],
  setup(props, { root, emit }) {
    const selected = computed(() => root.$store.getters['submissions/selected']);
    const memberships = computed(() => root.$store.getters['memberships/memberships']);
    const userId = computed(() => root.$store.getters['auth/user']._id);
    const isLoading = ref(false);
    const isOpen = computed(() => selected.value.length > 0);
    const draftsToSubmit = computed(() =>
      selected.value.filter(
        (item) =>
          // Draft
          item.options.draft &&
          // Ready to submit
          item.meta.status.some((item) => item.type === 'READY_TO_SUBMIT')
      )
    );
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

    const handleClear = () => {
      root.$store.dispatch('submissions/clearSelection');
    };

    watch(isOpen, (val) => {
      emit('open-change', val);
    });

    return {
      selected,
      memberships,
      userId,
      isLoading,
      isOpen,
      draftsToSubmit,
      draftsToDelete,
      submissionsToArchive,
      submissionsToDelete,
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

    .buttons {
      & > * + * {
        margin-left: 12px;
      }
    }
  }
}
</style>
