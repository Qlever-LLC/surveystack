<template>
  <a-container class="basicListContainer">
    <basic-list listType="row" :entities="state.submissions" :menu="state.menu" :loading="state.loading">
      <template v-slot:title>
        <template v-if="route.name === 'group-my-submissions'"
          ><a-icon class="mr-2">mdi-file-document-multiple-outline</a-icon> My Responses
        </template>
        <template v-else><a-icon class="mr-2">mdi-file-document-multiple</a-icon> Group Responses </template>
        <a-chip class="ml-4 hidden-sm-and-down" color="accent" rounded="lg" variant="flat" disabled>
          {{ state.submissions.length }}
        </a-chip>
      </template>
      <template v-slot:entityTitle="{ entity }">
        <span v-if="entity.meta.survey.name">{{ entity.meta.survey.name }}</span>
        <span v-else class="text-red">Missing survey</span>
      </template>
      <template v-slot:entitySubtitle="{ entity }">
        Submitted {{ new Date(entity.meta.dateSubmitted).toLocaleString() }}
      </template>
      <template v-slot:pagination>
        <a-pagination
          v-model="state.paginationPage"
          :length="state.paginationLength"
          @update:modelValue="fetchRemoteSubmissions"
          color="grey-darken-1" />
      </template>
      <template v-slot:noValue> No Responses available</template>
    </basic-list>
  </a-container>
</template>

<script setup>
import BasicList from '@/components/ui/BasicList2.vue';
import { computed, reactive, watch } from 'vue';
import { useStore } from 'vuex';
import { useGroup } from '@/components/groups/group';
import api from '@/services/api.service';
import { useSubmission } from '@/pages/submissions/submission';
import { useRoute, useRouter } from 'vue-router';
import { getPermission } from '@/utils/permissions';
import { menuAction } from '@/utils/threeDotsMenu';

const store = useStore();
const router = useRouter();
const route = useRoute();
const { getActiveGroupId } = useGroup();
const { setSurveyNames } = useSubmission();
const { rightToManageSubmission } = getPermission();
const { createAction } = menuAction();

const PAGINATION_LIMIT = 10;

const props = defineProps({
  scope: {
    type: String,
    required: true,
    validator(value) {
      return ['group', 'user'].includes(value);
    },
  },
});

const state = reactive({
  loading: false,
  submissions: [],
  submissionsPagination: {
    total: 0,
    skip: 0,
    limit: 1e5,
  },
  paginationPage: 1,
  activeUser: store.getters['auth/user']._id,
  paginationLength: computed(() => {
    const { total } = state.submissionsPagination;
    return total ? Math.ceil(total / PAGINATION_LIMIT) : 0;
  }),
  menu: [
    {
      title: 'Edit',
      icon: 'mdi-open-in-new',
      action: (s) =>
        createAction(s, rightToManageSubmission, () => {
          resubmit(s);
        }),
      render: (s) => () => rightToManageSubmission(s).allowed && !s.meta.archived,
    },
    /*
    {
      title: 'Reassign (TODO)',
      icon: 'mdi-open-in-new',
      action: (e) => `/todo`,
    },
    {
      title: 'View Response (TODO)',
      icon: 'mdi-open-in-new',
      action: (e) => `/todo`,
    },
    {
      title: 'New from same survey (TODO)',
      icon: 'mdi-open-in-new',
      action: (e) => `/todo`,
    },
    {
      title: 'Archive (TODO)',
      icon: 'mdi-trash-can-outline',
      action: (e) => `/todo`,
      color: 'red',
    },*/
  ],
});

fetchRemoteSubmissions();

watch(() => props.scope, fetchRemoteSubmissions);

async function fetchRemoteSubmissions() {
  try {
    if (!state.activeUser && props.scope === 'user') {
      //do not load anything, scope is user but not active user found (probably not logged in)
      return;
    }
    state.loading = true;
    const queryParams = new URLSearchParams();
    queryParams.append('group', getActiveGroupId());
    queryParams.append('limit', PAGINATION_LIMIT);
    queryParams.append('skip', (state.paginationPage - 1) * PAGINATION_LIMIT);
    queryParams.append('sort', '{"meta.dateSubmitted":-1}');
    if (props.scope === 'user') {
      //only filter by the creator if route is my-submissions. if route is submissions, do not filter by activeUser at all
      queryParams.append('creator', state.activeUser);
    }

    const { data } = await api.get(`/submissions/page?${queryParams}`);
    // TODO: load survey group ids and decorate the submissions with it
    const surveyIdByGroupId = await getSubmissionSurveyGroupIds(data.content);

    state.submissions = decorateSubmissionsWithSurveyGroupIds(data.content, surveyIdByGroupId);
    state.submissionsPagination = data.pagination;

    try {
      //load survey names where required
      await setSurveyNames(state.submissions);
    } catch (err) {
      //could'nt find the survey name, ignore
    }
  } catch (err) {
    console.log('Could not fetch remote submissions', err);
    state.submissions = [];
    state.submissionsPagination = {
      total: 0,
      skip: 0,
      limit: 1e5,
    };
  } finally {
    state.loading = false;
  }
}

async function getSubmissionSurveyGroupIds(submissions) {
  const surveyIds = submissions.map((s) => s.meta.survey.id);
  const surveyPromises = surveyIds.map((id) => api.get(`/surveys?q=${id}&projections[]=meta.group.id`));
  const results = await Promise.all(surveyPromises);
  const groupIdBySurveyId = Object.fromEntries(
    results.map((s) => [s.data[0]._id, s.data[0].meta.group.id])
  );
  return groupIdBySurveyId;
}

function decorateSubmissionsWithSurveyGroupIds(submissions, groupIdBySurveyId) {
  return submissions.map((s) => {
    return { 
      ...s, 
      meta: { 
        ...s.meta, 
        survey: { 
          ...s.meta.survey, 
          meta: { 
            group: { 
              id: groupIdBySurveyId[s.meta.survey.id] 
            } 
          } 
        } 
      } 
    };
  });
}


function resubmit(submission) {
  const surveyGroupId = submission.meta.survey.meta.group.id;
  const surveyId = submission.meta.survey.id;
  router.push({
    name: 'group-survey-submissions-edit',
    params: { id: surveyGroupId, surveyId, submissionId: submission._id },
  });
}
</script>
<style scoped lang="scss"></style>
