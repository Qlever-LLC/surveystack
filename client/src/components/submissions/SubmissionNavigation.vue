<template>
  <div class="ml-4 mt-4 text-white text-body-2">Responses</div>
  <a-list dense class="px-4">
    <list-item-card
      v-for="(entity, idx) in state.drafts"
      :key="entity._id"
      :entity="entity"
      :idx="String(idx)"
      class="whiteCard"
      :smallCard="true"
      :menu="state.menu">
      <template v-slot:entityTitle>
        {{ entity.meta.survey.name }}
      </template>
      <template v-slot:entitySubtitle v-if="entity.meta.dateCreated">
        Created {{ new Date(entity.meta.dateCreated).toLocaleString() }}
      </template>
      <template v-slot:entitySubtitle v-else></template>
    </list-item-card>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/my-drafts` }"
      dense
      prepend-icon="mdi-file-document-edit-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">My Draft Responses</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/my-submissions` }"
      dense
      prepend-icon="mdi-file-document-multiple-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">My Responses</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/submissions` }"
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
import ListItemCard from '@/components/ui/ListItemCard.vue';

import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

const { getActiveGroupId } = useGroup();
const { getDrafts, isDraftReadyToSubmit, uploadSubmission } = useSubmission();
const { showResult, resultItems, result } = useResults();
const router = useRouter();
const route = useRoute();
const store = useStore();

const state = reactive({
  drafts: [],
  menu: [],
  confirmSubmissionIsVisible: false,
  activeSubmissionId: null,
  activeSubmission: computed(() => {
    return state?.activeSubmissionId ? store.getters['submissions/getSubmission'](state.activeSubmissionId) : null;
  }),
});

initData();

watch(route, () => {
  initData();
});

async function initData() {
  state.drafts = await getDrafts(getActiveGroupId(), 2);
  state.menu = [
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
  ];
}

//update the drafts if the drafts in store have been changed
store.watch(
  (_, getters) => getters['submissions/drafts'],
  async () => {
    await initData();
  },
  { immediate: true }
);

function handleSubmitClick(id) {
  state.activeSubmissionId = id;
  state.confirmSubmissionIsVisible = true;
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

<style scoped lang="scss">
:deep(.whiteCard .v-list-item__content) {
  display: flex;
  align-items: center;
}
</style>
