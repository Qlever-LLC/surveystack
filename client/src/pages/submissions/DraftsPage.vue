<template>
  <a-container class="basicListContainer">
    <basic-list listType="row" :showSearch="false" :entities="currentPageDrafts" :menu="menu" :loading="isPending">
      <template v-slot:title>
        <a-icon class="mr-2">mdi-file-document-edit-outline</a-icon>
        My Draft Responses
        <a-chip class="ml-4 hidden-sm-and-down" color="accent" rounded="lg" variant="flat" disabled>
          {{ groupDrafts.length }}
        </a-chip>
      </template>
      <template v-slot:entityTitle="{ entity }">
        {{ entity.meta.survey.name }}
      </template>
      <template v-slot:entitySubtitle="{ entity }">
        <span v-if="isUnauthorizedToSubmit(entity)" @click.stop.capture="openUnauthorizedDialog">
          {{ createSubtitle(entity) }}
        </span>
        <template v-else>
          {{ createSubtitle(entity) }}
        </template>
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
    @cleanup="resetDeleteDraft" />
  <confirm-dialog
    v-model="showUnauthorizedDialog"
    title="Unauthorized to Submit"
    :message="[
      'You attempted to submit this draft but were not authorized. This could be due to the survey\'s permissions changing or you losing access to a group, for example.',
      'If this has been resolved, you can retry submitting by continuing the draft.',
      'If you are unable to regain access to submit this draft, you can delete it to remove it from your drafts.',
    ]"
    button="Okay"
    :showCancelButton="false"
    @confirm="handleConfirmUnauthorized" />
</template>
<script setup>
import BasicList from '@/components/ui/BasicList2.vue';
import { computed, ref, toRaw, watchEffect } from 'vue';
import formatDistance from 'date-fns/formatDistance';
import parseISO from 'date-fns/parseISO';
import { useAllDrafts, useDeleteDraft } from '../../queries';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import { decorateSubmissionsWithSurveyGroupIds, getSubmissionSurveyGroupIds } from '@/utils/submissions';

const props = defineProps({
  // group id from route param
  id: String,
});

const PAGINATION_LIMIT = 10;
const { data: allDrafts, isPending } = useAllDrafts();
const { isPending: deleteDraftIsPending, mutate: deleteDraft, reset: resetDeleteDraft } = useDeleteDraft();

const groupDrafts = computed(() => allDrafts.value.filter(
    (draft) => draft.meta.group?.id === props.id
  ));

const groupIdBySurveyId = ref({});
watchEffect(async () => {
  groupIdBySurveyId.value = await getSubmissionSurveyGroupIds(allDrafts.value);
});
const currentPageDrafts = computed(() =>
  groupDrafts.value.slice((paginationPage.value - 1) * PAGINATION_LIMIT, paginationPage.value * PAGINATION_LIMIT)
);
const showUnauthorizedDialog = ref(false);
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
    action: (e) => {
      const surveyId = e.meta.survey.id;
      const groupId = groupIdBySurveyId.value[surveyId];
      return `/groups/${groupId}/surveys/${surveyId}/submissions/${e._id}/edit`
    },
    render: (e) => () => {
      const surveyId = e.meta.survey.id;
      const groupId = groupIdBySurveyId.value[surveyId];
      return Boolean(groupId);
    },
    color: 'green',
    buttonFixed: true,
  },
  {
    title: 'Delete',
    icon: 'mdi-trash-can-outline',
    action: (e) => () => openDeleteDialogFor(e),
    render: (e) => () => true,
    color: 'red',
  },
]);

const isReadyToSubmit = (draft) => draft.meta.status.some((status) => status.type === 'READY_TO_SUBMIT');
const isUnauthorizedToSubmit = (draft) => draft.meta.status.some((status) => status.type === 'UNAUTHORIZED_TO_SUBMIT');
const createSubtitle = (draft) => {
  return isReadyToSubmit(draft)
    ? 'Marked for submission (pending internet connection)'
    : isUnauthorizedToSubmit(draft)
      ? 'Unauthorized to submit (click to learn more)'
      : `Last modified ${formatDistance(parseISO(draft.meta.dateModified), new Date())} ago`;
};

const handleConfirmDelete = () => {
  resetDeleteDraft();
  deleteDraft(toRaw(activeDeleteDraft.value));
  showDeleteDialog.value = false;
  activeDeleteDraft.value = null;
};

const openDeleteDialogFor = (draft) => {
  activeDeleteDraft.value = draft;
  showDeleteDialog.value = true;
};

const handleConfirmUnauthorized = () => {
  showUnauthorizedDialog.value = false;
};

const openUnauthorizedDialog = () => {
  showUnauthorizedDialog.value = true;
};
</script>
