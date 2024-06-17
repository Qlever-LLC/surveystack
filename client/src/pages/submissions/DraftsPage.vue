<template>
  <a-container class="basicListContainer">
    <basic-list
      listType="row"
      :showSearch="false"
      :entities="groupDrafts"
      :menu="menu"
      :loading="isPending">
      <template v-slot:title>
        <a-icon class="mr-2">mdi-file-document-edit-outline</a-icon>
        My Draft Responses
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled>
          {{ groupDrafts.length }}
        </a-chip>
      </template>
      <template v-slot:entityTitle="{ entity }">
        {{ entity.meta.survey.name }}
      </template>
      <template v-slot:entitySubtitle="{ entity }">
        {{ createSubtitle(entity) }}
      </template>
      <template v-slot:pagination>
        <a-pagination v-model="paginationPage" :length="paginationLength" color="grey-darken-1" />
      </template>
      <template v-slot:noValue>No Drafts available</template>
    </basic-list>
  </a-container>
  <confirm-dialog
    v-model="showDeleteDialog"
    title="Delete Draft"
    message="Are you sure you want to delete this draft?"
    button="Delete"
    button-color="error"
    :loading="deleteDraftIsPending"
    @confirm="handleConfirmDelete"
    @cleanup="resetDeleteDraft"
  />
</template>
<script setup>
import BasicList from '@/components/ui/BasicList2.vue';
import { computed, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import formatDistance from 'date-fns/formatDistance';
import parseISO from 'date-fns/parseISO';
import { useGroup } from '@/components/groups/group';
import { useAllDrafts, useDeleteDraft } from '../../queries';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';

const props = defineProps({
  // group id from route param
  id: String,
});

const PAGINATION_LIMIT = 10;
const { data: allDrafts, isPending, isError } = useAllDrafts();
const {
  isPending: deleteDraftIsPending,
  mutate: deleteDraft,
  reset: resetDeleteDraft,
} = useDeleteDraft();

const groupDrafts = computed(
  () => allDrafts.value.filter(draft => draft.meta.group?.id === props.id)
);
const showDeleteDialog = ref(false);
const activeDeleteDraft = ref(null);
const paginationPage = ref(1);
const paginationLength = computed(() => {
  const length = groupDrafts.value?.length;
  return length ? Math.ceil(length / PAGINATION_LIMIT) : 0;
});
const menu = computed(() => [
  {
    title: 'Continue',
    icon: 'mdi-open-in-new',
    action: (e) => `/groups/${props.id}/surveys/${e.meta.survey.id}/submissions/${e._id}/edit`,
    render: (e) => () => true,
    color: 'green',
    buttonFixed: true,
  },
  {
    title: 'Delete',
    icon: 'mdi-trash-can-outline',
    action: (e) => () => showDeleteDialogFor(e),
    render: (e) => () => true,
    color: 'red',
  },
]);

const createSubtitle = draft => {
  const isReadyToSubmit = draft.meta.status.some(status => status.type === 'READY_TO_SUBMIT');
  return isReadyToSubmit ?
    'Marked for submission (pending internet connection)' :
    `Last modified ${formatDistance(parseISO(draft.meta.dateModified), new Date())} ago`;
};

const handleConfirmDelete = () => {
  resetDeleteDraft();
  deleteDraft(activeDeleteDraft.value);
  showDeleteDialog.value = false;
  activeDeleteDraft.value = null;
};

const showDeleteDialogFor = draft => {
  activeDeleteDraft.value = draft;
  showDeleteDialog.value = true;
};
</script>
