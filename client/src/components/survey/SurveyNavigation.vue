<template>
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
      :key="entity._id"
      :entity="entity"
      :idx="String(idx)"
      class="whiteCard"
      :smallCard="true"
      :menu="state.menu">
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
import { reactive, watch } from 'vue';

import ListItemCard from '@/components/ui/ListItemCard.vue';
import MemberSelector from '@/components/shared/MemberSelector.vue';

const { getActiveGroupId } = useGroup();
const { stateComposable, getSurveys, message } = useSurvey();
const router = useRouter();
const route = useRoute();

const state = reactive({
  surveys: [],
  menu: [],
});

initData();

watch(route, () => {
  initData();
});

async function initData() {
  const surveyData = await getSurveys(getActiveGroupId(), '', 1, 2);
  state.surveys = surveyData?.content;
  state.menu = stateComposable.menu;
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
</script>

<style scoped lang="scss">
:deep(.whiteCard .v-list-item__content) {
  display: flex;
  align-items: center;
}
</style>
