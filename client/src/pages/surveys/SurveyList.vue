<template>
  <a-container>
    <a-alert
      v-if="message.successMessage"
      style="cursor: pointer"
      mode="fade"
      variant="text"
      type="success"
      @click="message.successMessage = null">
      {{ message.successMessage }}
    </a-alert>
    <a-alert
      v-if="message.errorMessage"
      style="cursor: pointer"
      mode="fade"
      variant="text"
      type="error"
      @click="message.errorMessage = null">
      {{ message.errorMessage }}
    </a-alert>
    <basic-list
      @updateSearch="updateSearch"
      @toogleStar="toogleStar"
      listCard
      :loading="state.loading"
      :entities="state.surveys.content"
      enablePinned
      :buttonNew="{ title: 'Create new Survey', link: { name: 'groups-new' } }"
      :menu="state.menu"
      :page="state.page">
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
import { printAlert } from '@/utils/alertPrinter';
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
const { rightToSubmitSurvey, rightToEditSurvey, rightToViewAnonymizedResults } = getPermission();
const { error, message } = printAlert();
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
  state.loading = true;

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
  } finally {
    state.loading = false;
  }
}

function createAction(survey, right, output) {
  const { allowed, message } = right(survey);
  if (allowed) {
    return output;
  } else {
    return () => error(message);
  }
}

async function initData() {
  state.menu = [
    {
      title: 'Start Survey',
      icon: 'mdi-open-in-new',
      action: (s) =>
        createAction(s, rightToSubmitSurvey, `/groups/${getActiveGroupId()}/surveys/${s._id}/submissions/new`),
      // {
      //   const { allowed, message } = rightToSubmitSurvey(s);
      //   if (allowed) {
      //     return `/groups/${getActiveGroupId()}/surveys/${s._id}/submissions/new`;
      //   } else {
      //     return () => error(message);
      //   }
      // }
      render: (s) => () => rightToSubmitSurvey(s).allowed,
      color: 'green',
    },
    {
      title: 'Start Survey as Member',
      icon: 'mdi-open-in-new',
      action: (s) => createAction(s, rightToSubmitSurvey, () => setSelectMember(s)),
      // {
      //   const { allowed, message } = rightToSubmitSurvey(s);
      //   if (allowed) {
      //     return () => setSelectMember(s);
      //   } else {
      //     return () => error(message);
      //   }
      // }
      render: (s) => () => rightToSubmitSurvey(s).allowed,
    },
    {
      title: 'Call for Submissions',
      icon: 'mdi-bullhorn',
      action: (s) =>
        createAction(s, rightToEditSurvey, `/groups/${getActiveGroupId()}/surveys/${s._id}/call-for-submissions`),
      // {
      //   const { allowed, message } = rightToEditSurvey();
      //   if (allowed) {
      //     return `/groups/${getActiveGroupId()}/surveys/${s._id}/call-for-submissions`;
      //   } else {
      //     return () => error(message);
      //   }
      // },
      render: (s) => () => rightToEditSurvey().allowed,
    },
    {
      title: 'Print Blank Survey',
      icon: 'mdi-printer',
      action: (s) => createAction(s, rightToSubmitSurvey, () => downloadPrintablePdf(s._id)),
      // {
      //   const { allowed, message } = rightToSubmitSurvey(s);
      //   if (allowed) {
      //     return () => downloadPrintablePdf(s._id);
      //   } else {
      //     return () => error(message);
      //   }
      // },
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
      action: (s) => createAction(s, rightToEditSurvey, `/groups/${getActiveGroupId()}/surveys/${s._id}/edit`),
      // {
      //   const { allowed, message } = rightToEditSurvey();
      //   if (allowed) {
      //     return `/groups/${getActiveGroupId()}/surveys/${s._id}/edit`;
      //   } else {
      //     return () => error(message);
      //   }
      // },
      render: (s) => () => rightToEditSurvey().allowed,
    },
    {
      title: 'View Results',
      icon: 'mdi-chart-bar',
      action: (s) =>
        createAction(s, rightToViewAnonymizedResults, `/groups/${getActiveGroupId()}/surveys/${s._id}/submissions`),
      // {
      //   const { allowed, message } = rightToViewAnonymizedResults();
      //   if (allowed) {
      //     return `/groups/${getActiveGroupId()}/surveys/${s._id}/submissions`;
      //   } else {
      //     return () => error(message);
      //   }
      // },
      render: (s) => () => rightToViewAnonymizedResults().allowed,
    },
    // {
    //   title: 'Share',
    //   icon: 'mdi-share',
    //   action: (s) => `/groups/${getActiveGroupId()}/surveys/${s._id}`,
    // }
  ];

  await Promise.all([fetchData()]);
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

  try {
    const { data } = await api.get(`/surveys/list-page-prio-pinned?${queryParams}`);

    data.pinned.forEach((s) => {
      s.pinnedSurveys = true;
      data.content.unshift(s);
    });
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

<style scoped lang="scss"></style>
