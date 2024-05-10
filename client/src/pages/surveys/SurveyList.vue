<template>
  <a-container>
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
      @toogleStar="toogleStar"
      listCard
      :entities="state.surveys.content"
      enablePinned
      :buttonNew="rightToEdit().allowed ? { title: 'Create new Survey', link: { name: 'group-surveys-new' } } : false"
      :menu="state.menu"
      :page="state.page"
      :loading="state.loading">
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-cube-outline </a-icon>
        Surveys
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled>
          {{ state.surveys.pagination.total }}
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
        :show="state.showSelectMember"
        :fixed-group-id="getActiveGroupId()"
        @hide="state.showSelectMember = false"
        @selected="(selectedMemb) => startDraftAs(selectedMemb)" />
    </basic-list>
  </a-container>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useGroup } from '@/components/groups/group';
import { getPermission } from '@/utils/permissions';
import { menuAction } from '@/utils/threeDotsMenu';
import { get } from 'lodash';
import { parse as parseDisposition } from 'content-disposition';
import downloadExternal from '@/utils/downloadExternal';

import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistance from 'date-fns/formatDistance';
import api from '@/services/api.service';

import BasicList from '@/components/ui/BasicList2.vue';
import MemberSelector from '@/components/shared/MemberSelector.vue';

const store = useStore();
const router = useRouter();
const { getActiveGroupId } = useGroup();
const { rightToSubmitSurvey, rightToEdit, rightToViewAnonymizedResults, rightToView } = getPermission();
const { message, createAction } = menuAction();
const PAGINATION_LIMIT = 10;

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
  showSelectMember: false,
  selectedSurvey: undefined,
  loading: false,
});

const activeTabPaginationLength = computed(() => {
  const { total } = state.surveys.pagination;
  return total ? Math.ceil(total / PAGINATION_LIMIT) : 0;
});
const groups = computed(() => {
  return store.getters['memberships/groups'];
});
const isWhitelabel = computed(() => {
  return store.getters['whitelabel/isWhitelabel'];
});
const whitelabelPartner = computed(() => {
  return store.getters['whitelabel/partner'];
});

initData();

function updateSearch(val) {
  state.search = val;
  state.page = 1;
  initData();
}
async function toogleStar(entity) {
  const group = groups.value.find((g) => g._id === getActiveGroupId());
  const index = group.surveys.pinned.indexOf(entity._id);
  if (index > -1) {
    group.surveys.pinned.splice(index, 1);
  } else {
    group.surveys.pinned.push(entity._id);
  }

  await api.put(`/groups/${group._id}`, group);
  await initData();
}
function setSelectMember(survey) {
  state.showSelectMember = true;
  state.selectedSurvey = survey;
}
function startDraftAs(selectedMember) {
  this.showSelectMember = false;
  if (selectedMember.user && state.selectedSurvey) {
    const surveyId = state.selectedSurvey._id;
    router.push(
      `/groups/${getActiveGroupId()}/surveys/${surveyId}/submissions/new?submitAsUserId=${selectedMember.user._id}`
    );
  }
  state.selectedSurvey = undefined;
}
async function downloadPrintablePdf(survey) {
  try {
    const { headers, data } = await api.get(`/surveys/${survey}/pdf`);
    const disposition = parseDisposition(headers['content-disposition']);
    downloadExternal(data, disposition.parameters.filename);
  } catch (e) {
    console.error('Failed to download printable PDF', e);
    store.dispatch(
      'feedback/add',
      get(
        e,
        'response.data.message',
        'Sorry, something went wrong while downloading a PDF of paper version. Try again later.'
      )
    );
  }
}

async function initData() {
  try {
    state.loading = true;
    state.menu = [
      {
        title: 'Start Survey',
        icon: 'mdi-open-in-new',
        action: (s) =>
          createAction(s, rightToSubmitSurvey, `/groups/${getActiveGroupId()}/surveys/${s._id}/submissions/new`),
        render: (s) => () => rightToSubmitSurvey(s).allowed,
        color: 'green',
      },
      {
        title: 'Start Survey as Member',
        icon: 'mdi-open-in-new',
        action: (s) => createAction(s, rightToSubmitSurvey, () => setSelectMember(s)),
        render: (s) => () => rightToSubmitSurvey(s).allowed,
      },
      {
        title: 'Call for Submissions',
        icon: 'mdi-bullhorn',
        action: (s) =>
          createAction(s, rightToEdit, `/groups/${getActiveGroupId()}/surveys/${s._id}/call-for-submissions`),
        render: (s) => () => rightToEdit().allowed,
      },
      {
        title: 'Description',
        icon: 'mdi-book-open',
        action: (s) => createAction(s, rightToView, `/groups/${getActiveGroupId()}/surveys/${s._id}/description`),
        render: (s) => () => rightToView(s).allowed,
      },
      {
        title: 'Print Blank Survey',
        icon: 'mdi-printer',
        action: (s) => createAction(s, rightToSubmitSurvey, () => downloadPrintablePdf(s._id)),
        render: (s) => () => rightToSubmitSurvey(s).allowed,
      },
      // {
      //   title: 'View',
      //   icon: 'mdi-file-document',
      //   action: (s) => `/groups/${getActiveGroupId()}/surveys/${s._id}`,
      // },
      {
        title: 'Edit',
        icon: 'mdi-pencil',
        action: (s) => createAction(s, rightToEdit, `/groups/${getActiveGroupId()}/surveys/${s._id}/edit`),
        render: (s) => () => rightToEdit().allowed,
      },
      {
        title: 'View Results',
        icon: 'mdi-chart-bar',
        action: (s) =>
          createAction(s, rightToViewAnonymizedResults, `/groups/${getActiveGroupId()}/surveys/${s._id}/submissions`),
        render: (s) => () => rightToViewAnonymizedResults().allowed,
      },
      // {
      //   title: 'Share',
      //   icon: 'mdi-share',
      //   action: (s) => `/groups/${getActiveGroupId()}/surveys/${s._id}`,
      // }
    ];

    await Promise.all([fetchData()]);
  } finally {
    state.loading = false;
  }
}
async function fetchData(user = null) {
  const now = new Date();
  const queryParams = new URLSearchParams();
  if (user) {
    queryParams.append('creator', user);
  }
  if (state.search) {
    queryParams.append('q', state.search);
  }
  if (isWhitelabel.value) {
    queryParams.append('prefix', whitelabelPartner.value.path);
  }

  queryParams.append('groupId', getActiveGroupId());
  queryParams.append('isLibrary', 'false');
  queryParams.append('skip', (state.page - 1) * PAGINATION_LIMIT);
  queryParams.append('limit', PAGINATION_LIMIT);
  queryParams.append('prioPinned', true);

  try {
    const { data } = await api.get(`/surveys/list-page?${queryParams}`);

    if (data.pinned) {
      data.pinned.forEach((s) => {
        s.pinnedSurveys = true;
        data.content.unshift(s);
      });
    }
    delete data.pinned;

    state.surveys = data;
    state.surveys.content.forEach((s) => {
      if (s.meta) {
        const parsedDate = parseISO(s.meta.dateCreated);
        if (isValid(parsedDate)) {
          s.createdAgo = formatDistance(parsedDate, now);
        }
      }
    });
    return data;
  } catch (e) {
    // TODO: use cached data?
    console.log('Error fetching surveys:', e);
  }
  return {
    content: [],
    pagination: {
      parsedLimit: 10,
      parsedSkip: 0,
      total: 0,
    },
  };
}
</script>
