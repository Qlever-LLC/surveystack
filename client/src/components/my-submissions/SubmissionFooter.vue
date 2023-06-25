<template>
  <footer v-if="isOpen" class="action-bar">
    <v-container>
      <span class="flex-grow-1">Selected: {{ selected.length }}</span>

      <div class="buttons d-flex align-center">
        <submission-archive-bulk
          :submissions="unArchived"
          :disabled="isLoading"
          @loading-change="isLoading = $event"
        ></submission-archive-bulk>
        <submission-restore-bulk
          :submissions="archived"
          :disabled="isLoading"
          @loading-change="isLoading = $event"
        ></submission-restore-bulk>
        <submission-delete-bulk
          :submissions="archived"
          :disabled="isLoading"
          @loading-change="isLoading = $event"
        ></submission-delete-bulk>
        <export-json-bulk :submissions="selected" :disabled="isLoading" /><export-pdf-bulk
          :submissions="selected"
          :disabled="isLoading"
          @loading-change="isLoading = $event"
        ></export-pdf-bulk>
      </div>

      <div class="flex-grow-1 text-end">
        <v-btn text dark small @click="handleClear">Clear all</v-btn>
      </div>
    </v-container>
  </footer>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';
import SubmissionArchiveBulk from './actions/SubmissionArchiveBulk.vue';
import SubmissionDeleteBulk from './actions/SubmissionDeleteBulk.vue';
import SubmissionRestoreBulk from './actions/SubmissionRestoreBulk.vue';
import ExportJsonBulk from './actions/ExportJsonBulk.vue';
import ExportPdfBulk from './actions/ExportPdfBulk.vue';

export default defineComponent({
  components: {
    SubmissionArchiveBulk,
    SubmissionDeleteBulk,
    SubmissionRestoreBulk,
    ExportJsonBulk,
    ExportPdfBulk,
  },
  setup(props, { root }) {
    const selected = computed(() => root.$store.getters['mySubmissions/selected']);
    const isLoading = ref(false);
    const isOpen = computed(() => selected.value.length > 0);
    const memberships = computed(() => root.$store.getters['memberships/memberships']);
    const userId = computed(() => root.$store.getters['auth/user']._id);

    const unArchived = computed(() =>
      selected.value.filter(
        (item) =>
          // not archived
          !item.meta.archived &&
          // admin or creator
          (item.meta.creator === userId.value ||
            memberships.value.some(
              (membership) => membership.group._id === item.meta.group.id && membership.role === 'admin'
            ))
      )
    );

    const archived = computed(() =>
      selected.value.filter(
        (item) =>
          // archived
          item.meta.archived &&
          // admin or creator
          (item.meta.creator === userId.value ||
            memberships.value.some(
              (membership) => membership.group._id === item.meta.group.id && membership.role === 'admin'
            ))
      )
    );

    const handleClear = () => {
      root.$store.dispatch('mySubmissions/clearSelection');
    };

    return {
      selected,
      userId,
      isLoading,
      isOpen,
      unArchived,
      archived,
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
