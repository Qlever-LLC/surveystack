<template>
  <footer v-if="isOpen" class="action-bar">
    <v-container>
      <span class="flex-grow-1">Selected: {{ selected.length }}</span>

      <div class="buttons">
        <v-btn v-if="draftsToSubmit.length > 0" color="primary" dark>
          Submit drafts ({{ draftsToSubmit.length }})</v-btn
        >
        <v-btn v-if="draftsToDelete.length > 0" color="red lighten-2" dark>
          Delete drafts ({{ draftsToDelete.length }})</v-btn
        >
        <v-btn v-if="submissionsToArchive.length > 0" color="orange darken-1" dark>
          Archive submissions ({{ submissionsToArchive.length }})
        </v-btn>
        <v-btn v-if="submissionsToDelete.length > 0" color="red lighten-2" dark>
          Delete submissions ({{ submissionsToDelete.length }})
        </v-btn>
      </div>

      <div class="flex-grow-1 text-end">
        <v-btn text @click="handleClear">Clear all</v-btn>
      </div>
    </v-container>
  </footer>
</template>

<script>
import { computed, defineComponent, watch } from '@vue/composition-api';

export default defineComponent({
  emits: ['openChange'],
  setup(props, { root, emit }) {
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

    const handleClear = () => {
      root.$store.dispatch('submissions/clearSelection');
    };

    const isOpen = computed(() => selected.value.length > 1);

    watch(isOpen, (val) => {
      emit('openChange', val);
    });

    return {
      isOpen,
      selected,
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
  background-color: white;
  box-shadow: 0px -6px 8px rgba(71, 89, 118, 0.12);
  border-top: 1px solid var(--v-secondary-lighten4);
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
