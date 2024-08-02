<template>
  <call-for-submissions v-model="stateComposable.showCallForResponses" :selectedSurvey="stateComposable.selectedSurvey">
  </call-for-submissions>
  <survey-description v-model="stateComposable.showDescription" :selectedSurvey="stateComposable.selectedSurvey">
  </survey-description>
  <a-container class="basicListContainer">
    <a-alert
      v-if="message.errorMessage"
      style="cursor: pointer"
      type="error"
      closable
      @click:close="message.errorMessage = null">
      {{ message.errorMessage }}
    </a-alert>
    <basic-list
      @updateSearch="updateSearch"
      @tooglePin="tooglePin"
      listType="card"
      :entities="state.surveys.content"
      showPinned
      :enableTogglePinned="rightToTogglePin().allowed"
      :buttonNew="rightToEdit().allowed ? { title: 'Create new Survey', link: { name: 'group-surveys-new' } } : {}"
      :menu="state.menu"
      :loading="state.loading"
      :show-navigation-control="!$route.query.minimal_ui"
      title="">
      <template v-slot:title>
        <a-icon class="mr-2">mdi-list-box-outline</a-icon>
        All Surveys
        <a-chip class="ml-4 hidden-sm-and-down" color="accent" rounded="lg" variant="flat" disabled>
          {{ state.surveys.pagination.total }}
        </a-chip>
      </template>
      <template v-slot:preMenu="{ entity }">
        <a-chip
          v-if="isADraft(entity)"
          x-small
          class="mr-2 py-0 px-1"
          color="blue"
          variant="outlined"
          disabled
          style="opacity: 1">
          draft
        </a-chip>
      </template>
      <template v-slot:noValue> No Surveys available </template>
      <template v-slot:pagination>
        <a-pagination
          v-if="state.surveys.content.length > 0"
          v-model="state.page"
          :length="activeTabPaginationLength"
          @update:modelValue="() => initData()" />
      </template>
      <member-selector
        :show="stateComposable.showSelectMember"
        :fixed-group-id="getActiveGroupId()"
        @hide="stateComposable.showSelectMember = false"
        @selected="(selectedMemb) => startDraftAs(selectedMemb)" />
    </basic-list>
  </a-container>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useGroup } from '@/components/groups/group';
import { getPermission } from '@/utils/permissions';

import BasicList from '@/components/ui/BasicList2.vue';
import MemberSelector from '@/components/shared/MemberSelector.vue';
import CallForSubmissions from '@/pages/call-for-submissions/CallForSubmissions.vue';
import SurveyDescription from '@/pages/surveys/SurveyDescription.vue';
import parseISO from 'date-fns/parseISO';
import isValid from 'date-fns/isValid';
import formatDistance from 'date-fns/formatDistance';

import { useSurvey } from '@/components/survey/survey';

const router = useRouter();
const store = useStore();
const { getActiveGroupId } = useGroup();
const { rightToEdit, rightToTogglePin } = getPermission();
const PAGINATION_LIMIT = 10;
const { stateComposable, getSurveys, tooglePinSurvey, togglePinEvent, message, isADraft } = useSurvey();

const state = reactive({
  page: 1,
  search: '',
  surveys: {
    content: [],
    pagination: {
      total: 0,
      skip: 0,
      limit: 100000,
    },
  },
  menu: [],
  loading: false,
});

const activeTabPaginationLength = computed(() => {
  const { total } = state.surveys.pagination;
  return total ? Math.ceil(total / PAGINATION_LIMIT) : 0;
});

initData();

function updateSearch(val) {
  state.search = val;
  state.page = 1;
  initData();
}

watch(togglePinEvent, (entity) => {
  tooglePin(entity);
});
async function tooglePin(entity) {
  state.loading = true;
  await tooglePinSurvey(entity);
  await initData();
  state.loading = false;
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

async function initData() {
  state.loading = true;
  state.menu = stateComposable.menu;
  try {
    //laod the surveys
    state.surveys = await getSurveys(getActiveGroupId(), state.search, state.page, PAGINATION_LIMIT);
    //add createdAgo information
    const now = new Date();
    state.surveys.content.forEach((s) => {
      if (s.meta) {
        const parsedDate = parseISO(s.meta.dateCreated);
        if (isValid(parsedDate)) {
          s.createdAgo = formatDistance(parsedDate, now);
        }
      }
    });
  } catch (e) {
    const surveysContent = store.getters['surveys/getPinnedSurveyForGroup'](getActiveGroupId());

    state.surveys = {
      content: surveysContent,
      pagination: {
        total: 0,
        skip: 0,
        limit: 100000,
      },
    };
  } finally {
    state.loading = false;
  }
}
</script>
