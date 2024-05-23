<template>
  <div class="ml-4 mt-4 text-white text-body-2">Surveys</div>
  <a-list dense class="px-4">
    <a-list-item
      v-for="survey in state.surveys"
      :key="survey._id"
      @click="selectSurvey(survey)"
      dense
      prepend-icon="mdi-list-box-outline"
      class="bg-white mb-2"
      rounded="lg">
      <a-list-item-title>{{ survey.name }}</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${getActiveGroupId()}/surveys` }"
      dense
      prepend-icon="mdi-list-box-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">All Surveys</a-list-item-title>
    </a-list-item>
  </a-list>
</template>

<script setup>
import { useGroup } from '@/components/groups/group';
import { useSurvey } from '@/components/survey/survey';
import { useRouter, useRoute } from 'vue-router';
import { reactive, watch } from 'vue';
import { getPermission } from '@/utils/permissions';
import { menuAction } from '@/utils/threeDotsMenu';

const { getActiveGroupId } = useGroup();
const { getSurveys } = useSurvey();
const { rightToSubmitSurvey } = getPermission();
const { createAction } = menuAction();
const router = useRouter();
const route = useRoute();

const state = reactive({
  surveys: [],
});

initData();

watch(route, () => {
  initData();
});

async function initData() {
  const surveyData = await getSurveys(getActiveGroupId(), '', 1, 2);
  state.surveys = surveyData?.content;
}

function selectSurvey(survey) {
  const startSurveyAction = createAction(
    survey,
    rightToSubmitSurvey,
    `/groups/${getActiveGroupId()}/surveys/${survey._id}/submissions/new`
  );
  router.push(startSurveyAction);
}
</script>
