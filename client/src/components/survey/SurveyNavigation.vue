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
      :entity="entity"
      :idx="String(idx)"
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
import api from '@/services/api.service';
import { useGroup } from '@/components/groups/group';
import { useSurvey } from '@/components/survey/survey';
import { useRouter } from 'vue-router';
import { reactive, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';

import ListItemCard from '@/components/ui/ListItemCard.vue';
import MemberSelector from '@/components/shared/MemberSelector.vue';
import CallForSubmissions from '@/pages/call-for-submissions/CallForSubmissions.vue';
import SurveyDescription from '@/pages/surveys/SurveyDescription.vue';

const { getActiveGroupId, isGroupVisitor } = useGroup();
const { stateComposable, message, tooglePinSurvey, togglePinEvent } = useSurvey();
const router = useRouter();
const store = useStore();

const state = reactive({
  surveys: [],
});

const menu = computed(() => stateComposable.menu);
const activeGroupId = computed(() => getActiveGroupId());

async function fetchPinnedFromAPI() {
  const queryParams = new URLSearchParams();
  queryParams.append('justPinned', true);
  const { data } = await api.get(`/groups/${getActiveGroupId()}?${queryParams}`);
  const surveyPromises = data.surveys.pinned.map(async (id) => {
    const { data } = await api.get(`/surveys/${id}`);
    return data;
  });
  const fetchedSurveys = await Promise.all(surveyPromises);
  state.surveys = fetchedSurveys;
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

watch(activeGroupId, async () => {
  if (isGroupVisitor()) {
    await fetchPinnedFromAPI();
  } else {
    state.surveys = store.getters['surveys/getPinnedSurveyForGroup'](activeGroupId.value);
  }
});

onMounted(async () => {
  if (isGroupVisitor()) {
    await fetchPinnedFromAPI();
  } else {
    watch(
      () => store.getters['surveys/getPinnedSurveyForGroup'](activeGroupId.value),
      (newVal) => {
        if (newVal) {
          state.surveys = store.getters['surveys/getPinnedSurveyForGroup'](activeGroupId.value);
        }
      },
      { immediate: true }
    );
  }
});
watch(togglePinEvent, (entity) => {
  tooglePin(entity);
});
async function tooglePin(entity) {
  await tooglePinSurvey(entity);
}
</script>

<style scoped lang="scss">
:deep(.whiteCard .v-list-item__content) {
  display: flex;
  align-items: center;
}
</style>
