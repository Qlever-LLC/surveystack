<!-- eslint-disable vue/no-deprecated-v-bind-sync -->
<template>
  <div>
    <app-submission-archive-dialog
      v-model="showArchiveModal"
      maxWidth="50rem"
      labelConfirm="Archive"
      @cancel="showArchiveModal = false"
      @confirm="(reason) => archiveSubmissions(selected, reason)"
    >
      <template v-slot:title>Confirm Submission Archiving</template>
    </app-submission-archive-dialog>

    <app-dialog v-model="showDeleteModal" @cancel="showDeleteModal = false" @confirm="deleteSubmissions(selected)">
      <template v-slot:title>Confirm deletion</template>
      <template> Are you sure you want to delete this submission? This can not be undone.</template>
    </app-dialog>

    <app-dialog
      v-model="reassignment.showModal"
      @cancel="reassignment.showModal = false"
      @confirm="reassign(selected)"
      labelConfirm="Reassign"
    >
      <template v-slot:title>Reassign Submission</template>
      <template>
        <a-select
          engineering="autocomplete"
          :items="reassignment.groups"
          v-model="reassignment.group"
          label="Group"
          :filter="reassignGroupFilter"
          itemSlot
        >
          <template v-slot:item="{ item }">
            <div class="d-flex flex-column py-1">
              <div>{{ item.text }}</div>
              <div class="text--secondary caption">{{ item.path }}</div>
            </div>
          </template>
        </a-select>
        <a-select
          engineering="autocomplete"
          :disabled="reassignment.group === null"
          :items="reassignment.users"
          v-model="reassignment.user"
          label="User"
        />
      </template>
    </app-dialog>

    <a-container>
      <div class="d-flex justify-space-between align-center my-5">
        <h1 v-if="surveyEntity">{{ surveyEntity.name }}</h1>
        <div>
          <a-btn v-if="survey" variant="outlined" color="secondary" :to="`/surveys/${survey}`">
            <a-icon left>mdi-note-text-outline</a-icon>
            View Survey
          </a-btn>
          <a-btn
            outlined
            color="secondary"
            class="ml-2"
            :disabled="surveyEntity && surveyEntity.meta.isLibrary"
            @click="startDraft(surveyEntity)"
          >
            <a-icon left>mdi-plus</a-icon>
            New submission
          </a-btn>
        </div>
      </div>
      <a-expansion-panels class="mb-6">
        <a-expansion-panel>
          <a-expansion-panel-title expand-icon="mdi-menu-down">
            <span class="text-body-1">Filters</span>
          </a-expansion-panel-title>
          <a-expansion-panel-text>
            <app-submissions-filter-basic
              v-if="!showAdvancedFilters && queryList"
              :queryList="queryList"
              @show-advanced="(ev) => (showAdvancedFilters = ev)"
              :basicFilters="basicFilters"
              @apply-basic-filters="applyBasicFilters"
              @reset="reset"
            />
            <app-submissions-filter-advanced
              v-if="showAdvancedFilters"
              v-model="filter"
              @show-advanced="(ev) => (showAdvancedFilters = ev)"
              @apply-advanced-filters="fetchData"
              @reset="reset"
            />
          </a-expansion-panel-text>
        </a-expansion-panel>
      </a-expansion-panels>
      <a-card class="my-5 px-2">
        <a-card-title class="d-flex justify-space-between align-center">
          <div class="text-body-1">API</div>
        </a-card-title>
        <a-card-text>
          <a class="body-2" :href="apiDownloadUrl" target="_blank">{{ apiDownloadUrl }}</a>
        </a-card-text>
        <a-card-text>
          <a-row>
            <a-col md="2" sm="6">
              <a-select label="Range" dense :items="apiDownloadRanges" hide-details v-model="apiDownloadRange" />
            </a-col>
            <a-col v-if="apiDownloadFormat === 'csv'" md="5" sm="6">
              <a-select
                label="Matrix answers"
                dense
                :items="apiDownloadExpandAllMatricesOptions"
                hide-details
                v-model="apiDownloadExpandAllMatrices"
              />
            </a-col>
            <a-col md="2" sm="6">
              <a-btn @click="startDownload" color="primary"> <a-icon left>mdi-download</a-icon>Download </a-btn>
            </a-col>
          </a-row>

          <a-row class="mt-5" v-if="apiDownloadRange === 'page'">
            <a-col sm="2">
              <a-select
                label="Page Size"
                dense
                :items="pageSizes"
                hide-details
                v-model="pageSize"
                @change="changedPaginationSize"
              />
            </a-col>
            <a-col cols="10">
              <a-pagination class="ml-0" v-model="page" :length="paginationTotalPages" @input="changedPaginationPage" />
            </a-col>
            <a-col cols="1">
              <div class="body-2 text--secondary mt-1 d-flex align-center justify-end" style="height: 100%">
                {{ submissions.pagination.total }} total
              </div>
            </a-col>
          </a-row>
        </a-card-text>
      </a-card>
    </a-container>

    <a-container>
      <a-tabs v-model="tab">
        <a-tab v-for="view in views" :key="view.tab">
          {{ view.tab }}
        </a-tab>
      </a-tabs>
      <a-window v-model="tab" touchless>
        <a-window-item>
          <!-- TODO '.sync' modifier on 'v-bind' directive is deprecated. Use 'v-model:propName' instead  vue/no-deprecated-v-bind-sync -->
          <app-submissions-table-client-csv
            :submissions="submissions"
            v-if="submissions"
            :selected.sync="selected"
            :archived="filter.showArchived"
            :dataTableProps="dateTableProps"
            @onDataTablePropsChanged="onDataTablePropsChanged"
            @excludeMetaChange="filter.showCsvMeta = $event"
            :excludeMeta="!filter.showCsvMeta"
            :loading="loading"
            style="margin: 3px 2px"
            :actionsAreDisabled="surveyEntity && surveyEntity.meta.isLibrary"
            @showDeleteModal="showDeleteModal = true"
            @archiveSubmissions="archiveSubmissions(selected, '', false)"
            @showArchiveModal="showArchiveModal = true"
            @reassignment="reassignment.showModal = true"
            @resubmit="resubmit(selected[0])"
            @showArchived="filter.showArchived = $event"
          />
        </a-window-item>
        <a-window-item>
          <app-submissions-tree :submissions="submissions" />
        </a-window-item>
        <a-window-item>
          <app-submissions-code :submissions="submissions" />
        </a-window-item>
      </a-window>

      <a-row class="my-2">
        <a-col cols="1">
          <a-select
            style="max-width: 5rem; display: inline-block"
            label="Page Size"
            dense
            :items="pageSizes"
            hide-details
            v-model="pageSize"
            @change="changedPaginationSize"
          />
        </a-col>
        <a-col cols="10">
          <a-pagination class="ml-0" v-model="page" :length="paginationTotalPages" @input="changedPaginationPage" />
        </a-col>
        <a-col cols="1">
          <div class="body-2 text--secondary mt-1 d-flex align-center justify-end" style="height: 100%">
            {{ submissions.pagination.total }} total
          </div>
        </a-col>
      </a-row>
    </a-container>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */

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
import appSubmissionsTree from '@/components/submissions/SubmissionTree.vue';
import appSubmissionsCode from '@/components/submissions/SubmissionCode.vue';
import appDialog from '@/components/ui/Dialog.vue';
import appSubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';

import { createBasicQueryList } from '@/utils/surveyStack';
import downloadExternal from '@/utils/downloadExternal';

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
  { text: 'Add a row for each matrix answers', value: true },
  { text: 'Keep matrix answers in a single cell', value: false },
];

export default {
  components: {
    appSubmissionsFilterBasic,
    appSubmissionsFilterAdvanced,
    appSubmissionsTree,
    appSubmissionsTableClientCsv,
    appSubmissionsCode,
    appDialog,
    appSubmissionArchiveDialog,
  },
  data() {
    return {
      apiDownloadFormat: apiDownloadFormats[0].value,
      apiDownloadFormats,
      apiDownloadRanges,
      apiDownloadRange: apiDownloadRanges[0].value,
      apiDownloadExpandAllMatrices: true,
      apiDownloadExpandAllMatricesOptions,
      showAdvancedFilters: false,
      tab: null,
      views: [
        { tab: 'Table', component: 'table' },
        { tab: 'Tree', component: 'tree' },
        { tab: 'Raw', component: 'raw' },
      ],
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
      dateTableProps: {
        sortBy: [],
        sortDesc: [],
      },
      loading: false,
      reassignment: {
        showModal: false,
        group: null,
        user: null,
        groups: this.$store.getters['memberships/memberships']
          .filter((m) => m.role === 'admin')
          .map((m) => ({ text: m.group.name, value: m.group._id, path: m.group.path })),
        users: [],
      },
    };
  },
  computed: {
    validQuery() {
      try {
        const match = JSON.parse(this.filter.match);
        const sort = JSON.parse(this.filter.sort);
        const project = JSON.parse(this.filter.project);
      } catch (error) {
        return false;
      }

      return true;
    },
    apiFetchParams() {
      const baseParams = this.getApiBaseParams();
      return baseParams
        .filter((p) => p.include)
        .map((p) => `${p.key}=${p.value}`)
        .join('&');
    },
    apiDownloadParams() {
      const baseParams = this.getApiBaseParams();
      if (this.apiDownloadRange === 'all') {
        const skipParam = baseParams.find((p) => p.key === 'skip');
        skipParam.include = false;
        const limitParam = baseParams.find((p) => p.key === 'limit');
        limitParam.include = false;
      }
      return baseParams
        .filter((p) => p.include)
        .map((p) => `${p.key}=${p.value}`)
        .join('&');
    },
    apiFetchRequest() {
      return `/submissions/page?${this.apiFetchParams}`;
    },
    apiEndpoint() {
      let endpoint;
      switch (this.apiDownloadFormat) {
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
    },
    apiDownloadUrl() {
      if (process.env.NODE_ENV === 'development') {
        return `http://localhost:${process.env.VUE_APP_DEV_API_SERVER_PORT}${this.apiEndpoint}?${this.apiDownloadParams}`;
      }
      return `${window.location.origin}${this.apiEndpoint}?${this.apiDownloadParams}`;
    },
    queryList() {
      if (!this.surveyEntity) {
        return null;
      }
      const list = createBasicQueryList(this.surveyEntity, this.surveyEntity.latestVersion);
      return list;
    },
    paginationTotalPages() {
      return Math.ceil(this.submissions.pagination.total / this.submissions.pagination.limit);
    },
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const { data: submissions } = await api.get(this.apiFetchRequest);
        this.submissions = submissions;
        // turn back to the first page if it skipped all the submissions (can happen on filter update)
        if (this.page !== 1 && this.submissions.pagination.total <= this.submissions.pagination.skip) {
          this.changedPaginationPage(1);
        }
      } catch (e) {
        console.log('something went wrong:', e);
      } finally {
        this.loading = false;
      }
    },
    async fetchUsers(groupId) {
      const { data: memberships } = await api.get(`/memberships?group=${groupId}&populate=true`);
      this.reassignment.users = memberships
        .filter((m) => m.user)
        .map((m) => ({ text: `${m.user.name} <${m.user.email}>`, value: m.user._id }));
    },
    getApiBaseParams() {
      const params = [
        { key: 'survey', value: this.survey, include: true },
        { key: 'match', value: this.filter.match, include: this.filter.match !== '{}' },
        { key: 'sort', value: this.filter.sort, include: this.filter.sort !== '{}' },
        { key: 'project', value: this.filter.project, include: this.filter.project !== '{}' },
        { key: 'skip', value: this.filter.skip, include: this.filter.skip !== 0 },
        { key: 'limit', value: this.filter.limit, include: this.filter.limit !== 0 },
        {
          key: 'showIrrelevant',
          value: this.filter.showIrrelevant,
          include: this.filter.showIrrelevant,
        },
        { key: 'showArchived', value: this.filter.showArchived, include: this.filter.showArchived },
        {
          key: 'showCsvDataMeta',
          value: this.filter.showCsvDataMeta,
          include: this.filter.showCsvDataMeta,
        },
        { key: 'showCsvMeta', value: this.filter.showCsvMeta, include: this.filter.showCsvMeta },
        {
          key: 'expandAllMatrices',
          value: this.apiDownloadExpandAllMatrices,
          include: this.apiDownloadFormat === 'csv',
        },
        {
          key: 'roles',
          value: this.filter.roles,
          include: process.env.NODE_ENV === 'development' && this.filter.roles !== '',
        },
      ];

      return params;
    },
    async deleteSubmissions(submissions) {
      this.showDeleteModal = false;
      try {
        const ids = submissions.map((s) => s._id);
        await api.post('/submissions/bulk-delete', { ids });
        this.selected = [];
        this.fetchData();
      } catch (err) {
        this.$store.dispatch('feedback/add', err.response.data.message);
      }
    },
    async archiveSubmissions(submissions, reason, value = true) {
      try {
        const ids = submissions.map((s) => s._id);
        await api.post(`/submissions/bulk-archive?set=${value}&reason=${reason}`, { ids });
        this.selected = [];
        this.fetchData();
      } catch (err) {
        this.$store.dispatch('feedback/add', err.response.data.message);
      }
    },
    applyBasicFilters(basicFilters) {
      const match = {};
      basicFilters.forEach((basicFilter) => {
        Object.assign(match, basicFilter.query);
      });
      try {
        const stringified = JSON.stringify(match);
        this.filter.match = stringified;
        this.fetchData();
      } catch (error) {
        console.log('invalid basic filter JSON');
      }
    },
    reset() {
      this.filter = createDefaultFilter();
      this.basicFilters = [];
      this.fetchData();
    },
    onSubmissionsSelected(submissions) {
      this.selectedSubmissions = submissions;
    },
    startDraft(survey) {
      this.$store.dispatch('submissions/startDraft', { survey });
    },
    async resubmit(submission) {
      await this.$store.dispatch('submissions/fetchRemoteSubmission', submission._id);
      this.$router.push(`/submissions/drafts/${submission._id}`);
    },
    async reassign(submissions) {
      this.reassignment.showModal = false;
      const ids = submissions.map((s) => s._id);
      try {
        await api.post(`/submissions/bulk-reassign`, {
          ids,
          group: this.reassignment.group,
          creator: this.reassignment.user,
        });
        this.selected = [];
        this.fetchData();
      } catch (err) {
        this.$store.dispatch('feedback/add', err.response.data.message);
      }
    },
    reassignGroupFilter(item, queryText, itemText) {
      return `${itemText} ${item.path}`.toLocaleLowerCase().indexOf(queryText.toLocaleLowerCase()) > -1;
    },
    reassignUserFilter(item, queryText, itemText) {
      return `${itemText} ${item.email}`.toLocaleLowerCase().indexOf(queryText.toLocaleLowerCase()) > -1;
    },
    changedPaginationPage(p) {
      this.page = p;
      this.filter.skip = (p - 1) * this.filter.limit;
      this.fetchData();
    },
    changedPaginationSize() {
      this.page = 1;
      this.filter.limit = this.pageSize;
      this.filter.skip = 0;
      this.fetchData();
    },
    onDataTablePropsChanged(props) {
      const { sortBy, sortDesc } = props;
      const sort = {};

      if (sortBy.length > 0 && sortDesc.length > 0 && sortBy.length === sortDesc.length) {
        try {
          for (let i = 0; i < sortBy.length; i++) {
            sort[sortBy[i]] = sortDesc[i] ? -1 : 1;
          }
          this.filter.sort = JSON.stringify(sort);
          this.fetchData();
        } catch (error) {
          console.log('error parsing sort');
        }
      }

      if (sortBy.length === 0 && sortDesc.length === 0) {
        this.filter.sort = JSON.stringify(sort);
        this.fetchData();
      }

      this.dateTableProps = props;
    },
    async startDownload() {
      downloadExternal(this.apiDownloadUrl, `${this.surveyEntity.name}.${this.apiDownloadFormat}`);
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    'filter.showArchived': function () {
      this.selected = [];
      this.fetchData();
    },
    // eslint-disable-next-line func-names
    'reassignment.group': function (val) {
      this.reassignment.user = null;

      if (!val) {
        this.reassignment.users = [];
        return;
      }

      this.fetchUsers(val);
    },
  },
  async created() {
    this.survey = this.$route.query.survey;
    const { data: surveyEntity } = await api.get(`/surveys/${this.survey}?version=latest`);
    this.surveyEntity = surveyEntity;
    await this.fetchData();
  },
};
</script>

<style scoped>
body {
  font-family: Menlo, Consolas, monospace;
  color: #444;
}

.item {
  cursor: pointer;
}

.bold {
  font-weight: bold;
}

ul {
  padding-left: 1em;
  line-height: 1.5em;
  list-style-type: dot;
}

>>> .v-window {
  overflow: unset;
}
</style>
