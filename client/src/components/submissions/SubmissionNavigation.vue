<template>
  <div class="ml-4 mt-4 text-white text-body-2">Responses</div>
  <a-list dense class="px-4">
    <a-list-item
      v-for="draft in state.drafts"
      :key="draft._id"
      @click="selectDraft(draft)"
      dense
      prepend-icon="mdi-file-document-edit-outline"
      class="bg-white mb-2"
      rounded="lg">
      <a-list-item-title>{{ draft.meta.survey.name }}</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/my-drafts`, query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-file-document-edit-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">My Draft Responses</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/my-submissions`, query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-file-document-multiple-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">My Responses</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/submissions`, query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-file-document-multiple"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">Group Responses</a-list-item-title>
    </a-list-item>
  </a-list>
  <confirm-submission-dialog
    v-if="state.confirmSubmissionIsVisible"
    @setGroup="setSubmissionGroup(state.activeSubmissionId, $event)"
    :groupId="getActiveGroupId()"
    :id="state.activeSubmissionId"
    :submitAsUser="state.activeSubmission.meta.submitAsUser"
    :dateSubmitted="state.activeSubmission.meta.dateSubmitted"
    v-model="state.confirmSubmissionIsVisible"
    @submit="submit(state.activeSubmission)" />
  <result-dialog
    v-model="showResult"
    :items="resultItems"
    title="Result of Submission"
    persistent
    @close="showResult = false" />
</template>
<script setup>
import { useGroup } from '@/components/groups/group';
import { computed, reactive, watch } from 'vue';
import { useSubmission } from '@/pages/submissions/submission';
import ConfirmSubmissionDialog from '@/components/survey/drafts/ConfirmSubmissionDialog.vue';
import { useResults } from '@/components/ui/results';
import ResultDialog from '@/components/ui/ResultDialog.vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import * as Sentry from '@sentry/vue';

const { getActiveGroupId } = useGroup();
const { getDrafts, isDraftReadyToSubmit, uploadSubmission } = useSubmission();
const { showResult, resultItems, result } = useResults();
const router = useRouter();
const store = useStore();

const state = reactive({
  drafts: [],
  confirmSubmissionIsVisible: false,
  activeSubmissionId: null,
  activeSubmission: computed(() => {
    return state?.activeSubmissionId ? store.getters['submissions/getSubmission'](state.activeSubmissionId) : null;
  }),
});

initData();

async function initData() {
  state.drafts = await getDrafts(getActiveGroupId(), 2);
}

//update the drafts if the drafts in store have been changed
store.watch(
  (_, getters) => getters['submissions/drafts'],
  async () => {
    await initData();
  },
  { immediate: true }
);

function selectDraft(draft) {
  if (isDraftReadyToSubmit(draft._id)) {
    state.activeSubmissionId = draft._id;
    state.confirmSubmissionIsVisible = true;
  } else {
    router.push(`/groups/${getActiveGroupId()}/surveys/${draft.meta.survey.id}/submissions/${draft._id}/edit`);
  }
}

async function submit(submission) {
  state.isSubmitting = true;
  try {
    const response = await uploadSubmission(submission);
    result({ response });
    await initData();
  } catch (error) {
    console.log('Draft submit error:', error);
    result({ response: null, error });
  } finally {
    state.isSubmitting = false;
  }
}
</script>
