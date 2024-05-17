<template>
  <a-container>
    <basic-list
      :entities="state.drafts"
      :menu="state.menu"
      :buttonNew="{ title: 'Submit Completed TODO', action: () => handleSubmitCompleted() }"
      :loading="state.loading">
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-xml</a-icon>
        My Draft Responses
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled>
          {{ state.drafts.length }}
        </a-chip>
      </template>
      <template v-slot:entityTitle="{ entity }">
        {{ entity.meta.survey.name }}
      </template>
      <template v-slot:entitySubtitle="{ entity }">
        Created {{ new Date(entity.meta.dateCreated).toLocaleString() }}
      </template>
      <template v-slot:pagination>
        <a-pagination v-model="state.paginationPage" :length="state.paginationLength" color="grey-darken-1" />
      </template>
      <template v-slot:noValue> No Drafts available</template>
    </basic-list>
  </a-container>

  <confirm-submission-dialog
    v-if="state.confirmSubmissionIsVisible"
    @setGroup="setSubmissionGroup(state.activeSubmissionId, $event)"
    :groupId="state.activeSubmission.meta.group.id"
    :id="state.activeSubmissionId"
    :submitAsUser="state.activeSubmission.meta.submitAsUser"
    :dateSubmitted="state.activeSubmission.meta.dateSubmitted"
    v-model="state.confirmSubmissionIsVisible"
    @close="handleConfirmSubmissionDialogClose"
    @submit="submit(state.activeSubmission)" />
  <submitting-dialog v-model="state.isSubmitting" />
  <result-dialog
    v-model="showResult"
    :items="resultItems"
    @update:modelValue="handleResultDialogInput"
    title="Result of Submission"
    persistent
    @close="showResult = false" />
</template>
<script setup>
import BasicList from '@/components/ui/BasicList2.vue';
import { computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useGroup } from '@/components/groups/group';
import { useSubmission } from '@/pages/submissions/submission';
import ConfirmSubmissionDialog from '@/components/survey/drafts/ConfirmSubmissionDialog.vue';
import ResultDialog from '@/components/ui/ResultDialog.vue';
import SubmittingDialog from '@/components/shared/SubmittingDialog.vue';
import { useResults } from '@/components/ui/results';

const store = useStore();
const { getActiveGroupId } = useGroup();
const { getDrafts, isDraftReadyToSubmit, getDraftsReadyToSubmit, uploadSubmission } = useSubmission();

const PAGINATION_LIMIT = 10;

const { showResult, resultItems, result } = useResults();

const state = reactive({
  loading: false,
  drafts: [],
  paginationLength: computed(() => {
    return Math.ceil(state.drafts.length / PAGINATION_LIMIT);
  }),
  menu: [
    {
      title: 'Submit',
      icon: 'mdi-open-in-new',
      action: (e) => () => handleSubmitClick(e._id),
      render: (e) => () => isDraftReadyToSubmit(e._id),
      color: 'green',
      buttonFixed: true,
    },
    {
      title: 'Continue',
      icon: 'mdi-open-in-new',
      action: (e) => `/groups/${getActiveGroupId()}/surveys/${e.meta.survey.id}/submissions/${e._id}/edit`,
      render: (e) => () => !isDraftReadyToSubmit(e._id),
      color: 'green',
      buttonFixed: true,
    },
    {
      title: 'Delete',
      icon: 'mdi-trash-can-outline',
      action: (e) => `/todo`,
      color: 'red',
      disabled: true,
      buttonHover: true,
    },
  ],
  isSubmitting: false,
  confirmSubmissionIsVisible: false,
  activeSubmissionId: null,
  activeSubmission: computed(() => {
    return state?.activeSubmissionId ? store.getters['submissions/getSubmission'](state.activeSubmissionId) : null;
  }),
  uploadQueue: [],
});

initData();

async function initData() {
  try {
    state.loading = true;
    state.drafts = await getDrafts(getActiveGroupId());
  } finally {
    state.loading = false;
  }
}

function handleSubmitClick(id) {
  state.activeSubmissionId = id;
  state.confirmSubmissionIsVisible = true;
}

function handleSubmitCompleted() {
  state.uploadQueue = [...getDraftsReadyToSubmit()];
  uploadQueueNext();
}

async function setSubmissionGroup(id, groupId) {
  await store.dispatch('submissions/update', {
    // ...submission,
    ...state.activeSubmission,
    meta: {
      // ...submission.meta,
      ...state.activeSubmission.meta,
      group: {
        id: groupId,
        path: null,
      },
    },
  });
  state.activeSubmission = store.getters['submissions/getSubmission'](state.activeSubmissionId);
}

function handleConfirmSubmissionDialogClose({ done }) {
  state.activeSubmissionId = null;
  if (done) {
    uploadQueueNext();
  }
}

function uploadQueueNext() {
  if (state.uploadQueue.length > 0) {
    state.activeSubmissionId = state.uploadQueue.shift() || null;
    state.confirmSubmissionIsVisible = true;
  }
}

async function submit(submission) {
  state.isSubmitting = true;
  try {
    const response = uploadSubmission(submission);
    result({ response });
  } catch (error) {
    console.log('Draft submit error:', error);
    result({ response: null, error });
  } finally {
    state.isSubmitting = false;
  }
}

function handleResultDialogInput(val) {
  if (!val) {
    // Closing result dialog
    uploadQueueNext();
  }
}
</script>
<style scoped lang="scss"></style>
