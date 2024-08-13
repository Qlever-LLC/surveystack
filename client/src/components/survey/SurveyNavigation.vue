<template>
  <call-for-submissions v-model="stateComposable.showCallForResponses" :selectedSurvey="stateComposable.selectedSurvey">
  </call-for-submissions>
  <survey-description v-model="stateComposable.showDescription" :selectedSurvey="stateComposable.selectedSurvey">
  </survey-description>
  <a-alert
    v-if="message.errorMessage"
    style="cursor: pointer"
    type="error"
    closable
    @click:close="message.errorMessage = null">
    {{ message.errorMessage }}
  </a-alert>
  <div class="ml-4 mt-4 text-white text-body-2">Surveys</div>
  <a-list dense class="px-4">
    <list-item-card
      v-for="(entity, idx) in state.surveys"
      :key="entity"
      @togglePin="togglePin"
      :entity="entity"
      :idx="String(idx)"
      :enableTogglePinned="rightToTogglePin().allowed"
      class="whiteCard"
      smallCard
      :menu="menu">
      <template v-slot:entitySubtitle></template>
    </list-item-card>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/surveys` }"
      dense
      prepend-icon="mdi-list-box-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">All Surveys</a-list-item-title>
    </a-list-item>
  </a-list>
  <member-selector
    :show="stateComposable.showSelectMember"
    :fixed-group-id="getActiveGroupId()"
    @hide="stateComposable.showSelectMember = false"
    @selected="(selectedMemb) => startDraftAs(selectedMemb)" />
</template>

<script setup>
import { useGroup } from '@/components/groups/group';
import { useSurvey } from '@/components/survey/survey';
import { useRouter, useRoute } from 'vue-router';
import { reactive, computed, watch } from 'vue';
import { getPermission } from '@/utils/permissions';
import emitter from '@/utils/eventBus';

import ListItemCard from '@/components/ui/ListItemCard.vue';
import MemberSelector from '@/components/shared/MemberSelector.vue';
import CallForSubmissions from '@/pages/call-for-submissions/CallForSubmissions.vue';
import SurveyDescription from '@/pages/surveys/SurveyDescription.vue';
import { getPinnedSurveysForGroup } from '@/utils/surveyStack';

const { getActiveGroupId } = useGroup();
const { stateComposable, message } = useSurvey();
const { rightToTogglePin } = getPermission();
const router = useRouter();
const route = useRoute();

const state = reactive({
  surveys: [],
});

const menu = computed(() => stateComposable.menu);

initData();

async function initData() {
  state.surveys = await getPinnedSurveysForGroup(getActiveGroupId());
}

function startDraftAs(selectedMember) {
  stateComposable.showSelectMember = false;
  if (selectedMember.user && stateComposable.selectedSurvey) {
    const surveyId = stateComposable.selectedSurvey._id;
    router.push(
      `/groups/${getActiveGroupId()}/surveys/${surveyId}/submissions/new?submitAsUserId=${selectedMember.user._id}`
    );
  }
  stateComposable.selectedSurvey = undefined;
}

async function togglePin() {
  await initData();
}

emitter.on('togglePin', () => {
  initData();
});
emitter.on('togglePinFromIcon', () => {
  initData();
});

watch(
  () => route.params.id,
  () => {
    initData();
  }
);
</script>

<style scoped lang="scss">
:deep(.whiteCard .v-list-item__content) {
  display: flex;
  align-items: center;
}
</style>
