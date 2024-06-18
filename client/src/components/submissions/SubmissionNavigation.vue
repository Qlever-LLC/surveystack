<template>
  <div class="ml-4 mt-4 text-white text-body-2">Responses</div>
  <a-list dense class="px-4">
    <list-item-card
      v-for="(entity, idx) in groupDrafts"
      :key="entity._id"
      :entity="entity"
      :idx="String(idx)"
      class="whiteCard"
      :smallCard="true"
      :menu="menu">
      <template v-slot:entityTitle>
        {{ entity.meta.survey.name }}
      </template>
      <template v-slot:entitySubtitle v-if="entity.meta.dateCreated">
        {{ createSubtitle(entity) }} ago
      </template>
      <template v-slot:entitySubtitle v-else></template>
    </list-item-card>
    <a-list-item
      :to="{ path: `/groups/${props.id}/my-drafts` }"
      dense
      prepend-icon="mdi-file-document-edit-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">My Draft Responses</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${props.id}/my-submissions` }"
      dense
      prepend-icon="mdi-file-document-multiple-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">My Responses</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${props.id}/submissions` }"
      dense
      prepend-icon="mdi-file-document-multiple"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">Group Responses</a-list-item-title>
    </a-list-item>
  </a-list>
  <confirm-dialog
    v-model="showDeleteDialog"
    title="Delete Draft"
    :error="null"
    message="Are you sure you want to delete this draft?"
    button="Delete"
    button-color="error"
    :loading="deleteDraftIsPending"
    @confirm="handleConfirmDelete"
    @cleanup="resetDeleteDraft"
  />
</template>
<script setup>
import { computed, ref, toRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import parseISO from 'date-fns/parseISO';
import formatDistance from 'date-fns/formatDistance';
import { useAllDrafts, useDeleteDraft } from '../../queries';
import ListItemCard from '@/components/ui/ListItemCard.vue';
import ConfirmDialog from '../shared/ConfirmDialog.vue';

const props = defineProps({
  // group id from route param
  id: String,
});

const router = useRouter();
const route = useRoute();
const store = useStore();
const { data: allDrafts } = useAllDrafts();
const {
  isPending: deleteDraftIsPending,
  mutate: deleteDraft,
  reset: resetDeleteDraft,
} = useDeleteDraft();

const groupDrafts = computed(
  () => allDrafts.value.filter(draft => draft.meta.group?.id === props.id).slice(0, 2)
);

const showDeleteDialog = ref(false);
const activeDeleteDraft = ref(null);
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
    color: 'red',
    disabled: false,
    buttonHover: true,
  },
]);

const isReadyToSubmit = draft => draft.meta.status.some(status => status.type === 'READY_TO_SUBMIT');
const isUnauthorizedToSubmit = draft => draft.meta.status.some(status => status.type === 'UNAUTHORIZED_TO_SUBMIT');
const createSubtitle = draft => {
  return isReadyToSubmit(draft) ?
    'Marked for submission' :
    isUnauthorizedToSubmit(draft) ?
    'Unauthorized to submit' :
    `Last modified ${formatDistance(parseISO(draft.meta.dateModified), new Date())} ago`;
};

const handleConfirmDelete = () => {
  resetDeleteDraft();
  deleteDraft(toRaw(activeDeleteDraft.value));
  showDeleteDialog.value = false;
  activeDeleteDraft.value = null;
};

const showDeleteDialogFor = draft => {
  activeDeleteDraft.value = draft;
  showDeleteDialog.value = true;
}
</script>

<style scoped lang="scss">
:deep(.whiteCard .v-list-item__content) {
  display: flex;
  align-items: center;
}
</style>
