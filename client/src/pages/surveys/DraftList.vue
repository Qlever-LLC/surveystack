<template>
  <a-container>
    <basic-list :entities="state.drafts" :menu="state.menu">
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-xml </a-icon>
        Drafts
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled> {{ state.drafts.length }} </a-chip>
      </template>
      <template v-slot:noValue> No Drafts available </template>
    </basic-list>
  </a-container>
</template>

<script setup>
import BasicList from '@/components/ui/BasicList2.vue';
import { reactive } from 'vue';
import { useStore } from 'vuex';
import { useGroup } from '@/components/groups/group';
const store = useStore();
const { getActiveGroupId, isGroupAdmin } = useGroup();

const state = reactive({
  drafts: [],
});

initData();

async function initData() {
  let rawDrafts = await store.dispatch('submissions/fetchLocalSubmissions');
  rawDrafts = sortSubmissions(rawDrafts);
  rawDrafts = await setSurveyNames(rawDrafts);
  state.drafts = rawDrafts;
}

function sortSubmissions(submissions) {
  return [...submissions].sort(
    (a, b) => new Date(b.meta.dateModified).valueOf() - new Date(a.meta.dateModified).valueOf()
  );
}

async function setSurveyNames(submissions) {
  for (let submission of submissions) {
    if (!submission.meta.survey.name) {
      const survey = await getSurvey(submission);
      if (survey) {
        submission.meta.survey.name = survey.name;
      }
    }
  }
  return submissions;
}

async function getSurvey(submission) {
  let survey = store.getters['surveys/getSurvey'](submission.meta.survey.id);
  if (!survey) {
    //not found in the local store, fetch the survey from backend
    console.warn('fetching survey name of survey id ' + submission.meta.survey.id);
    survey = await store.dispatch('surveys/fetchSurvey', { id: submission.meta.survey.id });
  }

  return survey;
}
</script>
<style scoped lang="scss"></style>
