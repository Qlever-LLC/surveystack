<template>
  <a-container class="basicListContainer">
    <app-submission-archive-dialog
      v-model="state.showArchiveModal"
      maxWidth="50rem"
      labelConfirm="Archive"
      @cancel="state.showArchiveModal = false"
      @confirm="(reason) => archiveSubmissions(state.selected, reason)">
      <template v-slot:title>Confirm Submission Archiving</template>
    </app-submission-archive-dialog>

    <app-dialog
      v-model="state.showDeleteModal"
      @cancel="state.showDeleteModal = false"
      @confirm="deleteSubmissions(state.selected)">
      <template v-slot:title>Confirm deletion</template>
      Are you sure you want to delete this submission? This can not be undone.
    </app-dialog>

    <app-dialog
      v-model="state.reassignment.showModal"
      @cancel="state.reassignment.showModal = false"
      @confirm="reassign(state.selected)"
      labelConfirm="Reassign">
      <template v-slot:title>Reassign Response</template>
      <a-select
        :items="state.reassignment.groups"
        item-title="text"
        item-value="value"
        v-model="state.reassignment.group"
        label="Group"
        :custom-filter="reassignGroupFilter"
        itemSlot>
        <template v-slot:item="{ props, item }">
          <a-list-item v-bind="props" :title="item.raw.text" :subtitle="item.raw.path"> </a-list-item>
        </template>
      </a-select>
      <a-select
        :disabled="state.reassignment.group === null"
        :items="state.reassignment.users"
        item-title="text"
        item-value="value"
        v-model="state.reassignment.user"
        label="User" />
    </app-dialog>

    <app-dialog
      v-model="state.showDownloadModal"
      maxWidth="70rem"
      labelConfirm="Download"
      @cancel="state.showDownloadModal = false"
      @confirm="startDownload">
      <template v-slot:title>Download</template>
      <a-card variant="text">
        <a-card-title class="px-0 d-flex justify-space-between align-center">
          <div class="text-body-1">API</div>
        </a-card-title>
        <a-card-text class="px-0">
          <a class="body-2" :href="apiDownloadUrl" ref="apiUrl" target="_blank">{{ apiDownloadUrl }}</a>
          <a-btn class="ml-2" icon @click="copyUrlToClipboard"><a-icon>mdi-content-copy</a-icon> </a-btn>
          <transition name="fade">
            <a-chip v-if="state.showCopiedChip" class="ml-2" variant="elevated" color="green-darken-3">
              URL copied</a-chip
            >
          </transition>
        </a-card-text>
        <a-card-text class="px-0">
          <a-row>
            <v-col md="2" sm="2">
              <a-select
                label="Format"
                dense
                :items="state.apiDownloadFormats"
                item-title="text"
                item-value="value"
                hide-details
                v-model="state.apiDownloadFormat" />
            </v-col>
            <a-col md="3" sm="3">
              <a-select
                label="Range"
                dense
                :items="state.apiDownloadRanges"
                item-title="text"
                item-value="value"
                hide-details
                v-model="state.apiDownloadRange" />
            </a-col>
            <a-col v-if="state.apiDownloadFormat === 'csv'" md="7" sm="6">
              <a-select
                label="Matrix answers"
                dense
                :items="state.apiDownloadExpandAllMatricesOptions"
                item-title="text"
                item-value="value"
                hide-details
                v-model="state.apiDownloadExpandAllMatrices" />
            </a-col>
          </a-row>

          <a-row class="mt-5" v-if="state.apiDownloadRange === 'page'">
            <a-col sm="2">
              <a-select
                style="max-width: 5rem; min-width: 5rem; display: inline-block"
                label="Page Size"
                dense
                :items="state.pageSizes"
                item-title="text"
                item-value="value"
                hide-details
                v-model="state.pageSize"
                @update:modelValue="changedPaginationSize" />
            </a-col>
            <a-col cols="10">
              <a-pagination
                style="min-width: 231px"
                class="ml-0"
                v-model="state.page"
                :length="paginationTotalPages"
                @update:modelValue="changedPaginationPage"
                color="grey-darken-1" />
            </a-col>
          </a-row>
        </a-card-text>
      </a-card>
      <template v-slot:iconLeftToConfirm><a-icon left>mdi-download</a-icon></template>
    </app-dialog>

    <a-alert
      v-if="message.errorMessage"
      style="cursor: pointer"
      type="error"
      closable
      @click:close="message.errorMessage = null">
      {{ message.errorMessage }}
    </a-alert>
    <basic-list
      :listType="state.tab === 'List' ? 'row' : 'custom'"
      :entities="state.submissions.content"
      labelSearch="Search by user name"
      :filter="() => state.submissions.content"
      :menu="state.menu"
      :loading="state.loading"
      @updateSearch="updateSearch">
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-chart-bar</a-icon>
        Results - {{ state.surveyEntity?.name }}
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled>
          {{ state.submissions.pagination.total }}
        </a-chip>
      </template>
      <template v-slot:titleBtn>
        <!-- <a-btn
            v-if="state.survey"
            variant="outlined"
            color="secondary"
            :to="{
              name: '...',
              params: { surveyId: state.survey },
            }">
            <a-icon left>mdi-note-text-outline</a-icon>
            View Survey
          </a-btn>
          <a-btn
            outlined
            color="secondary"
            class="ml-2"
            :disabled="state.surveyEntity && state.surveyEntity.meta.isLibrary"
            :to="`/groups/${$route.params.id}/surveys/${state.survey}/submissions/new`">
            <a-icon left>mdi-plus</a-icon>
            New response
          </a-btn> -->
        <a-btn outlined color="secondary" @click="state.showDownloadModal = true">
          <a-icon left>mdi-export</a-icon>
          Export Results
        </a-btn>
      </template>
      <template v-slot:customTypeList>
        <a-row>
          <a-col class="d-flex justify-center">
            <a-btn
              @click="updateView(view)"
              v-for="view in state.views"
              :key="view"
              class="mx-2"
              :class="{ 'inactive-btn': state.tab !== view }"
              :color="state.tab === view ? 'primary' : 'green-darken-3'">
              {{ view }}
            </a-btn>
          </a-col>
        </a-row>
      </template>
      <template v-slot:entityTitle="{ entity }">
        <span>{{ entity.meta.creatorDetail ? entity.meta.creatorDetail.name : 'anonymized' }}</span>
      </template>
      <template v-slot:entitySubtitle="{ entity }">
        Submitted {{ new Date(entity.meta.dateSubmitted).toLocaleString() }}
      </template>
      <template v-slot:filter>
        <a-switch v-model="state.filter.showArchived" label="View archived only" class="mt-2 ml-5" hideDetails />
        <div class="border rounded pa-2">
          <app-submissions-filter-basic
            v-if="!state.showAdvancedFilters && queryList"
            :queryList="queryList"
            @show-advanced="(ev) => (state.showAdvancedFilters = ev)"
            :basicFilters="state.basicFilters"
            @apply-basic-filters="applyBasicFilters"
            @reset="reset" />
          <app-submissions-filter-advanced
            class="mt-2"
            v-if="state.showAdvancedFilters"
            v-model="state.filter"
            @show-advanced="(ev) => (state.showAdvancedFilters = ev)"
            @apply-advanced-filters="fetchData"
            @reset="reset" />
        </div>
      </template>
      <template v-slot:customList>
        <app-submissions-table-client-csv
          :submissions="state.submissions"
          v-if="state.tab === 'Table' && state.submissions"
          v-model:selected="state.selected"
          :sortBy="state.sortBy"
          @onDataTablePropsChanged="onDataTablePropsChanged"
          @excludeMetaChange="state.filter.showCsvMeta = $event"
          :excludeMeta="!state.filter.showCsvMeta"
          :loading="state.loading"
          style="margin: 3px 2px"
          :actionsAreDisabled="state.surveyEntity && state.surveyEntity.meta.isLibrary"
          @showDeleteModal="state.showDeleteModal = true"
          @archiveSubmissions="archiveSubmissions(state.selected, '', false)"
          @showArchiveModal="state.showArchiveModal = true"
          @reassignment="state.reassignment.showModal = true"
          @resubmit="resubmit(state.selected[0])" />
        <app-submissions-code v-if="state.tab === 'Raw' && state.submissions" :submissions="state.submissions" />
      </template>
      <template v-slot:pagination>
        <a-row class="my-2 mx-4">
          <a-col sm="2">
            <a-select
              style="max-width: 5rem; min-width: 5rem; display: inline-block"
              label="Page Size"
              dense
              :items="state.pageSizes"
              item-title="text"
              item-value="value"
              hide-details
              v-model="state.pageSize"
              @update:modelValue="changedPaginationSize" />
          </a-col>
          <a-col cols="10">
            <a-pagination
              style="min-width: 231px"
              class="ml-0"
              v-model="state.page"
              :length="paginationTotalPages"
              @update:modelValue="changedPaginationPage"
              color="grey-darken-1" />
          </a-col>
        </a-row>
      </template>
      <template v-slot:noValue> No Results available </template>
    </basic-list>
  </a-container>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

/*
 Note how the submission object to methods like archiveSubmission
 is coming from v-data-table's row and is of the flattened form:
 {"_id": xxx, "meta.archived": 'false', ...}
 ... it's ok for now but working with the real JSON object would make more sense
*/
import api from '@/services/api.service';
import appSubmissionsFilterBasic from '@/components/submissions/SubmissionFilterBasic.vue';
import appSubmissionsFilterAdvanced from '@/components/submissions/SubmissionFilterAdvanced.vue';
import appSubmissionsTableClientCsv from '@/components/submissions/SubmissionTableClientCsv.vue';
import appSubmissionsCode from '@/components/submissions/SubmissionCode.vue';
import appDialog from '@/components/ui/Dialog.vue';
import appSubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';

import { createBasicQueryList } from '@/utils/surveyStack';
import downloadExternal from '@/utils/downloadExternal';

import { useGroup } from '@/components/groups/group';
import { getPermission } from '@/utils/permissions';
import { menuAction } from '@/utils/threeDotsMenu';

import BasicList from '@/components/ui/BasicList2.vue';

const store = useStore();
const router = useRouter();

const { rightToManageResponses } = getPermission();
const { message, createAction } = menuAction();

const defaultPageSize = 10;

const createDefaultFilter = () => ({
  match: '{}',
  project: '{}',
  sort: '{}',
  skip: 0,
  limit: defaultPageSize,
  showArchived: false,
  showIrrelevant: false,
  showCsvDataMeta: false,
  showCsvMeta: false,
  roles: '',
});

const apiDownloadFormats = [
  { text: 'CSV', value: 'csv' },
  { text: 'JSON', value: 'json' },
];
const apiDownloadRanges = [
  { text: 'All data', value: 'all' },
  { text: 'Page only', value: 'page' },
];
const apiDownloadExpandAllMatricesOptions = [
  { text: 'Add a row for each matrix answers', value: 'true' },
  { text: 'Keep matrix answers in a single cell', value: 'false' },
];

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  surveyId: {
    type: String,
    required: true,
  },
});

const state = reactive({
  isOpen: undefined,
  apiDownloadFormat: apiDownloadFormats[0].value,
  apiDownloadFormats,
  apiDownloadRanges,
  apiDownloadRange: apiDownloadRanges[0].value,
  apiDownloadExpandAllMatrices: apiDownloadExpandAllMatricesOptions[0].value,
  apiDownloadExpandAllMatricesOptions,
  showAdvancedFilters: false,
  tab: 'List',
  views: ['List', 'Table', 'Raw'],
  survey: null,
  surveyEntity: null,
  formats: [
    { title: 'CSV', value: 'csv' },
    { title: 'JSON', value: 'json' },
  ],
  filter: createDefaultFilter(),
  basicFilters: [],
  submissions: {
    content: [],
    pagination: {
      total: 0,
      skip: 0,
      limit: defaultPageSize,
    },
  },
  page: 1,
  pageSizes: [1, 5, 10, 50, 100, 1000, 'All'].map((n) => ({ text: n, value: Number(n) || 0 })),
  pageSize: defaultPageSize,
  selected: [],
  search: '',
  showArchiveModal: false,
  showDeleteModal: false,
  showDownloadModal: false,
  sortBy: [],
  loading: false,
  reassignment: {
    showModal: false,
    group: null,
    user: null,
    groups: store.getters['memberships/memberships']
      .filter((m) => m.role === 'admin')
      .map((m) => ({ text: m.group.name, value: m.group._id, path: m.group.path })),
    users: [],
  },
  menu: [],
  showCopiedChip: false,
});

initData();

watch([() => props.id, () => props.surveyId], initData);

const validQuery = computed(() => {
  try {
    JSON.parse(state.filter.match);
    JSON.parse(state.filter.sort);
    JSON.parse(state.filter.project);
  } catch (error) {
    return false;
  }

  return true;
});
const apiFetchParams = computed(() => {
  const baseParams = getApiBaseParams();
  return baseParams
    .filter((p) => p.include)
    .map((p) => `${p.key}=${p.value}`)
    .join('&');
});
const apiDownloadParams = computed(() => {
  const baseParams = getApiBaseParams();
  if (state.apiDownloadRange === 'all') {
    const skipParam = baseParams.find((p) => p.key === 'skip');
    skipParam.include = false;
    const limitParam = baseParams.find((p) => p.key === 'limit');
    limitParam.include = false;
  }
  return baseParams
    .filter((p) => p.include)
    .map((p) => `${p.key}=${p.value}`)
    .join('&');
});
const apiFetchRequest = computed(() => {
  return `/submissions/page?${apiFetchParams.value}`;
});
const apiEndpoint = computed(() => {
  let endpoint;
  switch (state.apiDownloadFormat) {
    case 'csv':
      endpoint = '/api/submissions/csv';
      break;
    case 'json':
      endpoint = '/api/submissions';
      break;
    default:
      endpoint = '/api/submissions/page';
  }
  return endpoint;
});
const apiDownloadUrl = computed(() => {
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:${process.env.VUE_APP_DEV_API_SERVER_PORT}${apiEndpoint.value}?${apiDownloadParams.value}`;
  }
  return `${window.location.origin}${apiEndpoint.value}?${apiDownloadParams.value}`;
});
const queryList = computed(() => {
  if (!state.surveyEntity) {
    return null;
  }
  const list = createBasicQueryList(state.surveyEntity, state.surveyEntity.latestVersion);
  return list;
});
const paginationTotalPages = computed(() => {
  return Math.ceil(state.submissions.pagination.total / state.submissions.pagination.limit);
});

async function updateSearch(val) {
  state.search = val;
  changedPaginationPage(1);
}

function copyUrlToClipboard() {
  navigator.clipboard.writeText(apiDownloadUrl.value).then(() => {
    state.showCopiedChip = true;
    setTimeout(() => {
      state.showCopiedChip = false;
    }, 750);
  });
}

async function initData() {
  state.loading = true;

  state.survey = props.surveyId;
  const { data: surveyEntity } = await api.get(`/surveys/${state.survey}?version=latest`);
  state.surveyEntity = surveyEntity;

  state.menu = [
    {
      title: 'Edit',
      icon: 'mdi-pencil',
      action: (s) =>
        createAction(s, rightToManageResponses, () => {
          resubmit(s);
        }),
      render: (s) => () => rightToManageResponses().allowed && !s.meta.archived,
      color: 'green',
    },
    {
      title: 'Restore',
      icon: 'mdi-backup-restore',
      action: (s) =>
        createAction(s, rightToManageResponses, () => {
          state.selected = [s];
          archiveSubmissions(state.selected, '', false);
        }),
      render: (s) => () => rightToManageResponses().allowed && s.meta.archived,
    },
    {
      title: 'Reassign',
      icon: 'mdi-open-in-new',
      action: (s) =>
        createAction(s, rightToManageResponses, () => {
          state.selected = [s];
          state.reassignment.showModal = true;
        }),
      render: (s) => () => rightToManageResponses().allowed,
    },
    {
      title: 'Archive',
      icon: 'mdi-archive',
      action: (s) =>
        createAction(s, rightToManageResponses, () => {
          state.selected = [s];
          state.showArchiveModal = true;
        }),
      render: (s) => () => rightToManageResponses().allowed && !s.meta.archived,
      color: 'red',
    },
    {
      title: 'Delete',
      icon: 'mdi-trash-can-outline',
      action: (s) =>
        createAction(s, rightToManageResponses, () => {
          state.selected = [s];
          state.showDeleteModal = true;
        }),
      render: (s) => () => rightToManageResponses().allowed && s.meta.archived,
      color: 'red',
    },
  ];

  await fetchData();
}
async function fetchData() {
  state.loading = true;
  try {
    const { data } = await api.get(apiFetchRequest.value);
    state.submissions = data;
    // turn back to the first page if it skipped all the submissions (can happen on filter update)
    if (state.page !== 1 && state.submissions.pagination.total <= state.submissions.pagination.skip) {
      changedPaginationPage(1);
    }
  } catch (e) {
    console.log('something went wrong:', e);
  } finally {
    state.loading = false;
  }
}

async function fetchUsers(groupId) {
  const { data: memberships } = await api.get(`/memberships?group=${groupId}&populate=true`);
  state.reassignment.users = memberships
    .filter((m) => m.user)
    .map((m) => ({ text: `${m.user.name} <${m.user.email}>`, value: m.user._id }));
}
function getApiBaseParams() {
  const params = [
    { key: 'survey', value: state.survey, include: true },
    { key: 'match', value: state.filter.match, include: state.filter.match !== '{}' },
    { key: 'sort', value: state.filter.sort, include: state.filter.sort !== '{}' },
    { key: 'project', value: state.filter.project, include: state.filter.project !== '{}' },
    { key: 'skip', value: state.filter.skip, include: state.filter.skip !== 0 },
    { key: 'limit', value: state.filter.limit, include: state.filter.limit !== 0 },
    {
      key: 'showIrrelevant',
      value: state.filter.showIrrelevant,
      include: state.filter.showIrrelevant,
    },
    { key: 'showArchived', value: state.filter.showArchived, include: state.filter.showArchived },
    {
      key: 'showCsvDataMeta',
      value: state.filter.showCsvDataMeta,
      include: state.filter.showCsvDataMeta,
    },
    { key: 'showCsvMeta', value: state.filter.showCsvMeta, include: state.filter.showCsvMeta },
    {
      key: 'expandAllMatrices',
      value: state.apiDownloadExpandAllMatrices,
      include: state.apiDownloadFormat === 'csv',
    },
    {
      key: 'roles',
      value: state.filter.roles,
      include: process.env.NODE_ENV === 'development' && state.filter.roles !== '',
    },
  ];

  if (state.search) {
    params.push({ key: 'search', value: state.search, include: true });
  }

  return params;
}
async function deleteSubmissions(submissions) {
  state.showDeleteModal = false;
  try {
    const ids = submissions.map((s) => s._id);
    await api.post('/submissions/bulk-delete', { ids });
    state.selected = [];
    fetchData();
  } catch (err) {
    store.dispatch('feedback/add', err.response.data.message);
  }
}
async function archiveSubmissions(submissions, reason, value = true) {
  try {
    const ids = submissions.map((s) => s._id);
    await api.post(`/submissions/bulk-archive?set=${value}&reason=${reason}`, { ids });
    state.selected = [];
    fetchData();
  } catch (err) {
    store.dispatch('feedback/add', err.response.data.message);
  }
}
function applyBasicFilters(basicFilters) {
  const match = {};
  basicFilters.forEach((basicFilter) => {
    Object.assign(match, basicFilter.query);
  });
  try {
    const stringified = JSON.stringify(match);
    state.filter.match = stringified;
    fetchData();
  } catch (error) {
    console.log('invalid basic filter JSON');
  }
}
function reset() {
  state.filter = createDefaultFilter();
  state.basicFilters = [];
  fetchData();
}
function onSubmissionsSelected(submissions) {
  state.selectedSubmissions = submissions;
}
function resubmit(submission) {
  router.push({
    name: 'group-survey-submissions-edit',
    params: { id: props.id, surveyId: state.survey, submissionId: submission._id },
  });
}
async function reassign(submissions) {
  state.reassignment.showModal = false;
  const ids = submissions.map((s) => s._id);
  try {
    await api.post(`/submissions/bulk-reassign`, {
      ids,
      group: state.reassignment.group,
      creator: state.reassignment.user,
    });
    state.selected = [];
    fetchData();
  } catch (err) {
    store.dispatch('feedback/add', err.response.data.message);
  }
}
function reassignGroupFilter(item, queryText, itemText) {
  return `${itemText} ${item.path}`.toLocaleLowerCase().indexOf(queryText.toLocaleLowerCase()) > -1;
}
function reassignUserFilter(item, queryText, itemText) {
  return `${itemText} ${item.email}`.toLocaleLowerCase().indexOf(queryText.toLocaleLowerCase()) > -1;
}
function changedPaginationPage(p) {
  state.page = p;
  state.filter.skip = (p - 1) * state.filter.limit;
  fetchData();
}
function changedPaginationSize() {
  state.page = 1;
  state.filter.limit = state.pageSize;
  state.filter.skip = 0;
  fetchData();
}
function onDataTablePropsChanged(props) {
  const sort = {};

  if (props.length === 0) {
    state.filter.sort = JSON.stringify(sort);
    fetchData();
  } else if (props.length > 0) {
    try {
      for (let i = 0; i < props.length; i++) {
        sort[props[i].key] = props[i].order === 'desc' ? -1 : 1;
      }
      state.filter.sort = JSON.stringify(sort);
      fetchData();
    } catch (error) {
      console.log('error parsing sort');
    }
  }

  state.sortBy = props;
}
async function startDownload() {
  downloadExternal(apiDownloadUrl, `${state.surveyEntity.name}.${state.apiDownloadFormat}`);
}

function updateView(view) {
  state.tab = view;
}

watch(
  () => state.filter.showArchived,
  () => {
    state.selected = [];
    fetchData();
  }
);

watch(
  () => state.reassignment.group,
  (val) => {
    state.reassignment.user = null;
    if (!val) {
      state.reassignment.users = [];
      return;
    }

    fetchUsers(val);
  }
);
</script>

<style scoped lang="scss">
.inactive-btn {
  opacity: 0.5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
