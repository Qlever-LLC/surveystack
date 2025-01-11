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
      @togglePin="togglePinWithIcon"
      listType="card"
      :entities="state.networkOk ? decoratedSurveys : surveys.content"
      showPinned
      :enableTogglePinned="rightToTogglePin().allowed && !state.showArchived"
      :buttonNew="rightToEdit().allowed ? { title: 'Create new Survey', link: { name: 'group-surveys-new' } } : {}"
      :menu="surveyMenu"
      :loading="state.loading"
      :show-navigation-control="!$route.query.minimal_ui"
      title="">
      <template v-slot:title>
        <a-icon class="mr-2">mdi-list-box-outline</a-icon>
        All Surveys
        <a-chip class="ml-4 hidden-sm-and-down" color="accent" rounded="lg" variant="flat" disabled>
          {{ state.networkOk ? state.surveys.pagination.total : surveys.pagination.total }}
        </a-chip>
      </template>
      <template v-slot:afterName="{ entity }">
        <a-chip v-if="entity.meta?.group?.name" variant="flat" xSmall class="ml-2" :style="{ 'background-color': entity.meta.group.color }">
          {{ entity.meta?.group?.name }}
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
      <template v-slot:filter v-if="isGroupAdmin(getActiveGroupId()) && onlineStatus.value">
        <a-checkbox v-model="state.showArchived" label="View archived" dense hide-details color="primary" />
      </template>
      <template v-slot:noValue> No Surveys available </template>
      <template v-slot:pagination>
        <a-pagination
          v-if="state.networkOk ? decoratedSurveys.length > 0 : surveys.content.length > 0"
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
import { reactive, computed, inject, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import { useGroup } from '@/components/groups/group';
import { getPermission } from '@/utils/permissions';
import emitter from '@/utils/eventBus';
import { useQuery } from '@tanstack/vue-query';

import BasicList from '@/components/ui/BasicList2.vue';
import MemberSelector from '@/components/shared/MemberSelector.vue';
import CallForSubmissions from '@/pages/call-for-submissions/CallForSubmissions.vue';
import SurveyDescription from '@/pages/surveys/SurveyDescription.vue';
import parseISO from 'date-fns/parseISO';
import isValid from 'date-fns/isValid';
import formatDistance from 'date-fns/formatDistance';

import { useSurvey } from '@/components/survey/survey';
import { useGetPinnedSurveysForGroup } from '@/queries';
import { digestMessage } from '@/utils/hash';
import getGroupColor from '@/utils/groupColor';
import api from '@/services/api.service';

const onlineStatus = inject('onlineStatus');

const router = useRouter();
const { getActiveGroupId, isGroupAdmin } = useGroup();
const { rightToEdit, rightToTogglePin } = getPermission();
const PAGINATION_LIMIT = 10;
const { stateComposable, getMenu, getSurveys, togglePinSurvey, message, isADraft } = useSurvey();

const queryClient = useQueryClient();

const { data: data } = useGetPinnedSurveysForGroup(getActiveGroupId());

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
  loading: false,
  networkOk: false,
  showArchived: false,
});

const surveys = computed(() => {
  const contentValue = data.value.length === 0 ? [] : data.value;
  return {
    content: contentValue,
    pagination: {
      total: 0,
      skip: 0,
      limit: 100000,
    },
  };
});

const surveyMenu = computed(() => getMenu(onlineStatus.value));

const activeTabPaginationLength = computed(() => {
  const { total } = state.networkOk ? state.surveys.pagination : surveys.value.pagination;
  return total ? Math.ceil(total / PAGINATION_LIMIT) : 0;
});

initData();

function updateSearch(val) {
  state.search = val;
  state.page = 1;
  initData();
}

emitter.on('togglePin', () => {
  initData();
});

async function togglePinWithIcon(entity) {
  state.loading = true;
  await togglePinSurvey(entity);
  await initData();
  queryClient.invalidateQueries({ queryKey: ['pinnedSurveys'] });
  queryClient.invalidateQueries({ queryKey: ['pinnedSurveysGroup', getActiveGroupId()] });
  state.loading = false;
}

async function fetchSurveysWithPagination() {
  try {
    //laod the surveys
    const result = await getSurveys(getActiveGroupId(), state.search, state.page, PAGINATION_LIMIT, state.showArchived);
    //add createdAgo information
    const now = new Date();
    result.content.forEach((s) => {
      if (s.meta) {
        const parsedDate = parseISO(s.meta.dateCreated);
        if (isValid(parsedDate)) {
          s.createdAgo = formatDistance(parsedDate, now);
        }
      }
    });
    return result;
  } catch (error) {
    console.error('API fetch failed, falling back to cache', error);
    throw error;
  }
}

const groupIds = computed(() => {
  const groupIds = Array.from(new Set(state.surveys?.content?.map((s) => s.meta.group.id))) ?? [];
  return groupIds;
});

const shouldFetchGroups = computed(() => groupIds.value.length > 0);
const { data: groups } = useQuery({
  queryKey: ['group', groupIds],
  queryFn: async ({ queryKey }) => {
    const ids = queryKey[1];
    const requests = await Promise.allSettled(ids.map((id) => api.get(`/groups/${id}`)));
    const successfulResponses = requests.filter((r) => r.status === 'fulfilled');
    const groups = successfulResponses.map(async ({ value: { data: group } }) => ({
      id: group._id,
      name: group.name,
      path: group.path,
      color: getGroupColor(await digestMessage(group._id)),
    }));
    return await Promise.all(groups);
  },
  enabled: shouldFetchGroups,
  initialData: [],
});

async function initData() {
  state.loading = true;
  try {
    state.surveys = await fetchSurveysWithPagination();
    state.networkOk = true;
  } catch (error) {
    state.networkOk = false;
  } finally {
    state.loading = false;
  }
}

const decoratedSurveys = computed(() => {
  if (groups.value.length === 0) {
    return state.surveys.content;
  }
  return state.surveys.content.map((survey) => {
    const group = groups.value.find((group) => group.id === survey.meta.group.id) ?? survey.meta.group;
    return {
      ...survey,
      meta: {
        ...survey.meta,
        group: group,
      },
    };
  });
});

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

watch(() => state.showArchived, initData);
</script>
