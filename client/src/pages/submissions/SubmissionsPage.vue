<template>
  <a-container>
    <basic-list listType="row" :entities="state.submissions" :menu="state.menu" :loading="state.loading">
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-xml</a-icon>
        My Responses
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled>
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
      <template v-slot:noValue> No Drafts available</template>
    </basic-list>
  </a-container>
</template>

<script setup>
import BasicList from '@/components/ui/BasicList2.vue';
import { computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useGroup } from '@/components/groups/group';
import api from '@/services/api.service';
import { useSubmission } from '@/pages/submissions/submission';
import { useRoute, useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();
const route = useRoute();
const { getActiveGroupId } = useGroup();
const { setSurveyNames } = useSubmission();

const PAGINATION_LIMIT = 10;

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
      action: (e) => () => resubmit(e),
      color: 'green',
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

initData();

async function initData() {
  await fetchRemoteSubmissions();
}

async function fetchRemoteSubmissions() {
  try {
    state.loading = true;
    const queryParams = new URLSearchParams();
    queryParams.append('group', getActiveGroupId());
    queryParams.append('limit', PAGINATION_LIMIT);
    queryParams.append('skip', (state.paginationPage - 1) * PAGINATION_LIMIT);
    queryParams.append('sort', '{"meta.dateCreated":-1}');
    if (route.name === 'group-my-submissions' || route.name === 'group-my-drafts') {
      //only filter by the creator if route is my-submissions. if route is submissions, do not filter by activeUser at all
      queryParams.append('creator', state.activeUser);
    }

    const { data } = await api.get(`/submissions/page?${queryParams}`);
    state.submissions = data.content;
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

function resubmit(submission) {
  router.push({
    name: 'group-survey-submissions-edit',
    params: { id: getActiveGroupId(), surveyId: submission.meta.survey.id, submissionId: submission._id },
  });
}
</script>
<style scoped lang="scss"></style>
