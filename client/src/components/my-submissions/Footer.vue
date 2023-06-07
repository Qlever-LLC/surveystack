<template>
  <footer v-if="isOpen" class="action-bar">
    <v-btn v-if="draftsToSubmit.length > 0" color="primary" dark> Submit drafts ({{ draftsToSubmit.length }})</v-btn>
    <v-btn v-if="draftsToDelete.length > 0" color="red lighten-2" dark>
      Delete drafts ({{ draftsToDelete.length }})</v-btn
    >
    <v-btn v-if="submissionsToArchive.length > 0" color="orange darken-1" dark>
      Archive submissions ({{ submissionsToArchive.length }})
    </v-btn>
    <v-btn v-if="submissionsToDelete.length > 0" color="red lighten-2" dark>
      Delete submissions ({{ submissionsToDelete.length }})
    </v-btn>
  </footer>
</template>

<script>
import { computed, defineComponent, watch } from '@vue/composition-api';

export default defineComponent({
  props: {
    submissions: {
      type: Array,
      required: true,
    },
  },
  emits: ['openChange'],
  setup(props, { root, emit }) {
    const memberships = computed(() => root.$store.getters['memberships/memberships']);
    const userId = computed(() => root.$store.getters['auth/user']._id);
    const draftsToSubmit = computed(() => props.submissions.filter((item) => item.options.draft));
    const draftsToDelete = computed(() => props.submissions.filter((item) => item.options.draft));
    const submissionsToArchive = computed(() =>
      props.submissions.filter(
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
      props.submissions.filter(
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

    const isOpen = computed(
      () =>
        props.submissions.length > 1 &&
        draftsToSubmit.value.length +
          submissionsToArchive.value.length +
          draftsToDelete.value.length +
          submissionsToArchive.value.length >
          1
    );

    watch(isOpen, (val) => {
      emit('openChange', val);
    });

    return {
      isOpen,
      draftsToSubmit,
      draftsToDelete,
      submissionsToArchive,
      submissionsToDelete,
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
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  z-index: 1;
}
</style>
