<template>
  <div>
    <app-submission-archive-dialog
      v-model="showArchiveModal"
      maxWidth="50rem"
      labelConfirm="Archive"
      @cancel="showArchiveModal = false"
      @confirm="(reason) => archiveSubmission(selected[0], reason)"
    >
      <template v-slot:title>Confirm Submission Archiving</template>
    </app-submission-archive-dialog>

    <app-dialog
      v-model="showDeleteModal"
      @cancel="showDeleteModal = false"
      @confirm="deleteSubmission(selected[0])"
    >
      <template v-slot:title>Confirm deletion</template>
      <template>
        Are you sure you want to delete this submission? This can not be undone.
      </template>
    </app-dialog>

    <app-dialog
      v-model="reassignment.showModal"
      @cancel="reassignment.showModal = false"
      @confirm="reassign(selected[0])"
      labelConfirm="Reassign"
    >
      <template v-slot:title>Reassign Submission</template>
      <template>
        <v-autocomplete
          :items="reassignment.groups"
          v-model="reassignment.group"
          label="Group"
          :filter="reassignGroupFilter"
        >
          <template v-slot:item="{item}">
            <div class="d-flex flex-column py-1">
              <div>{{item.text}}</div>
              <div class="text--secondary caption">{{item.path}}</div>
            </div>
          </template>
        </v-autocomplete>
        <v-autocomplete
          :disabled="reassignment.group === null"
          :items="reassignment.users"
          v-model="reassignment.user"
          label="User"
        ></v-autocomplete>
      </template>
    </app-dialog>

    <v-container>
      <div class="d-flex justify-end">
        <v-btn
          v-if="survey"
          outlined
          color="secondary"
          :to="`/surveys/${survey}`"
        >
          <v-icon left>mdi-note-text-outline</v-icon>
          View Survey
        </v-btn>
        <v-btn
          outlined
          color="secondary"
          class="ml-2"
          @click="startDraft(survey)"
        >
          <v-icon left>mdi-plus</v-icon>
          New submission
        </v-btn>
      </div>
      <h1 v-if="surveyEntity">{{surveyEntity.name}}</h1>

      <app-submissions-filter-basic
        v-if="!showAdvancedFilters && queryList"
        :queryList="queryList"
        @showAdvanced="(ev) => showAdvancedFilters = ev"
        :basicFilters="basicFilters"
        @apply-basic-filters="applyBasicFilters"
        @reset="reset"
      />

      <app-submissions-filter-advanced
        v-if="showAdvancedFilters"
        v-model="filter"
        @showAdvanced="(ev) => showAdvancedFilters = ev"
        @apply-advanced-filters="fetchData"
        @reset="reset"
      />

      <div class="d-flex justify-end">
        <v-checkbox
          label="View archived only"
          v-model="showArchived"
          dense
          hide-details
        />
      </div>

      <div
        class="d-flex justify-end"
        v-if="false"
      >
        <v-menu
          offset-y
          class="mb-3"
        >
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              class="mr-2"
              outlined
            >
              <v-icon left>mdi-chevron-down</v-icon>{{formats[selectedFormat].title}}
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              v-for="(item, index) in formats"
              :key="index"
              @click="() => setFormat(index)"
            >
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn
          @click="fetchData"
          :disabled="!validQuery"
          color="primary"
        >QUERY!</v-btn>
      </div>

      <h4>API</h4>
      <a
        class="body-2"
        :href="apiDownloadUrl"
        target="_blank"
      >{{apiDownloadUrl}}</a>

      <div class="d-flex align-center justify-start mt-4">
        <v-select
          style="max-width: 5rem; display: inline-block"
          label="Format"
          class="mr-3"
          dense
          :items="apiDownloadFormats"
          hide-details
          v-model="apiDownloadFormat"
        ></v-select>
        <v-select
          style="max-width: 7rem; display: inline-block"
          label="Range"
          class="mr-3"
          dense
          :items="apiDownloadRanges"
          hide-details
          v-model="apiDownloadRange"
        ></v-select>
        <v-btn
          @click="startDownload"
          color="primary"
        >
          <v-icon left>mdi-download</v-icon>Download
        </v-btn>
      </div>

      <v-card
        v-if="selected.length > 0"
        class="mt-4"
      >
        <v-card-text>
          <div class="d-flex align-center">
            <div><span class="subtitle-2">ACTIONS</span><br />{{selected.length}} {{selected.length === 1 ? 'submission' : 'submissions'}} selected</div>
            <div
              class="ml-auto d-flex flex-column flex-sm-row"
              v-if="selected.length === 1"
            >
              <v-btn
                v-if="selected[0]['meta.archived'] === 'true'"
                color="error"
                text
                @click="showDeleteModal = true"
              >
                DELETE
              </v-btn>
              <v-btn
                v-if="selected[0]['meta.archived'] === 'true'"
                text
                @click="archiveSubmission(selected[0], '', false)"
              >
                RESTORE
              </v-btn>
              <v-btn
                v-if="selected[0]['meta.archived'] !== 'true'"
                color="error"
                text
                @click="showArchiveModal = true"
              >
                ARCHIVE
              </v-btn>
              <v-btn
                @click="reassignment.showModal = true"
                text
                color="secondary"
              >REASSIGN</v-btn>
              <v-btn
                v-if="selected[0]['meta.archived'] !== 'true'"
                text
                color="primary"
                @click="resubmit(selected[0])"
              >
                RESUBMIT
              </v-btn>

            </div>
          </div>
        </v-card-text>
      </v-card>

    </v-container>

    <v-container>

      <v-row class="mt-2">
        <v-col cols="1">
          <v-select
            style="max-width: 5rem; display: inline-block"
            label="Page Size"
            dense
            :items="pageSizes"
            hide-details
            v-model="pageSize"
            @change="changedPaginationSize"
          ></v-select>
        </v-col>
        <v-col cols="10">
          <v-pagination
            class="ml-0"
            v-model="page"
            :length="paginationTotalPages"
            @input="changedPaginationPage"
          ></v-pagination>
        </v-col>
        <v-col cols="1">
          <div
            class="body-2 text--secondary mt-1 d-flex align-center justify-end"
            style="height: 100%"
          >{{submissions.pagination.total}} total</div>
        </v-col>
      </v-row>

      <v-tabs v-model="
          tab">
        <v-tab
          v-for="view in views"
          :key="view.tab"
        >
          {{view.tab}}
        </v-tab>
        <v-tabs-items
          v-model="tab"
          touchless
        >
          <v-tab-item>
            <app-submissions-table-client-csv
              :submissions="submissions"
              v-if="submissions"
              :selected.sync="selected"
              :archived="showArchived"
              :dataTableProps="dateTableProps"
              @onDataTablePropsChanged="onDataTablePropsChanged"
              :loading="loading"
            />
          </v-tab-item>
          <v-tab-item>
            <app-submissions-tree :submissions="submissions" />
          </v-tab-item>
          <v-tab-item>
            <app-submissions-code :submissions="submissions" />
          </v-tab-item>
        </v-tabs-items>
      </v-tabs>

      <v-row class="my-2">
        <v-col cols="1">
          <v-select
            style="max-width: 5rem; display: inline-block"
            label="Page Size"
            dense
            :items="pageSizes"
            hide-details
            v-model="pageSize"
            @change="changedPaginationSize"
          ></v-select>
        </v-col>
        <v-col cols="10">
          <v-pagination
            class="ml-0"
            v-model="page"
            :length="paginationTotalPages"
            @input="changedPaginationPage"
          ></v-pagination>
        </v-col>
        <v-col cols="1">
          <div
            class="body-2 text--secondary mt-1 d-flex align-center justify-end"
            style="height: 100%"
          >{{submissions.pagination.total}} total</div>
        </v-col>
      </v-row>

    </v-container>

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
import { flattenSubmission } from '@/utils/submissions';
import appSubmissionsFilterBasic from '@/components/submissions/SubmissionFilterBasic.vue';
import appSubmissionsFilterAdvanced from '@/components/submissions/SubmissionFilterAdvanced.vue';
import appSubmissionsTableClientCsv from '@/components/submissions/SubmissionTableClientCsv.vue';
import appSubmissionsTree from '@/components/submissions/SubmissionTree.vue';
import appSubmissionsCode from '@/components/submissions/SubmissionCode.vue';
import appDialog from '@/components/ui/Dialog.vue';
import appSubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';


import { createQueryList } from '@/utils/surveys';

const defaultPageSize = 10;

const defaultFilter = {
  match: '{}',
  project: '{}',
  sort: '{}',
  skip: 0,
  limit: defaultPageSize,
  roles: '',
};

const apiDownloadFormats = [{ text: 'CSV', value: 'csv' }, { text: 'JSON', value: 'json' }];
const apiDownloadRanges = [{ text: 'All data', value: 'all' }, { text: 'Page only', value: 'page' }];


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
      selectedFormat: 0,
      filter: {
        match: '{}',
        project: '{}',
        sort: '{}',
        skip: 0,
        limit: defaultPageSize,
        roles: '',
      },
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
      pageSizes: [1, 5, 10, 50, 100, 1000, 'All'].map(n => ({ text: n, value: Number(n) || 0 })),
      pageSize: defaultPageSize,
      selected: [],
      search: '',
      showArchived: false,
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
        groups: this.$store.getters['memberships/memberships'].filter(m => m.role === 'admin').map(m => ({ text: m.group.name, value: m.group._id, path: m.group.path })),
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
      let params = `survey=${this.survey}&match=${this.filter.match}&sort=${this.filter.sort}&project=${this.filter.project}&skip=${this.filter.skip}&limit=${this.filter.limit}`;
      if (this.showArchived) {
        params += '&showArchived=true';
      }

      if (process.env.NODE_ENV === 'development') {
        return `${params}&roles=${this.filter.roles}`;
      }
      return params;
    },
    apiDownloadParams() {
      let params = `survey=${this.survey}&match=${this.filter.match}&sort=${this.filter.sort}&project=${this.filter.project}`;
      if (this.apiDownloadRange === 'page') {
        params += `&skip=${this.filter.skip}&limit=${this.filter.limit}`;
      } else {
        params += '&skip=0&limit=0';
      }

      if (this.showArchived) {
        params += '&showArchived=true';
      }

      if (process.env.NODE_ENV === 'development') {
        return `${params}&roles=${this.filter.roles}`;
      }
      return params;
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
      return `${window.location.origin}${this.apiEndpoint}?${this.apiDownloadParams}`;
    },
    queryList() {
      if (!this.surveyEntity) {
        return null;
      }
      const list = createQueryList(this.surveyEntity, this.surveyEntity.latestVersion);
      return list;
    },
    paginationTotalPages() {
      const r = Math.floor(this.submissions.pagination.total / this.submissions.pagination.limit) + 1;
      return r;
    },
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const { data: submissions } = await api.get(this.apiFetchRequest);
        this.submissions = submissions;
      } catch (e) {
        console.log('something went wrong:', e);
      } finally {
        this.loading = false;
      }
    },
    async fetchUsers(groupId) {
      const { data: memberships } = await api.get(`/memberships?group=${groupId}&populate=true`);
      this.reassignment.users = memberships.filter(m => m.user).map(m => ({ text: `${m.user.name} <${m.user.email}>`, value: m.user._id }));
    },
    async deleteSubmission(submission) {
      this.showDeleteModal = false;
      try {
        await api.delete(`/submissions/${submission._id}`);
        this.selected = [];
        this.fetchData();
      } catch (err) {
        this.$store.dispatch('feedback/add', err.response.data.message);
      }
    },
    async archiveSubmission(submission, reason, value = true) {
      try {
        const { data: archived } = await api.post(`/submissions/${submission._id}/archive?set=${value}&reason=${reason}`);
        this.selected = [];
        this.fetchData();
      } catch (err) {
        this.$store.dispatch('feedback/add', err.response.data.message);
      }
    },
    setFormat(ev) {
      this.selectedFormat = ev;
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
      Object.assign(this.filter, defaultFilter);
      this.basicFilters = [];
      this.fetchData();
    },
    onSubmissionsSelected(submissions) {
      this.selectedSubmissions = submissions;
    },
    startDraft(survey) {
      const group = this.$store.getters['memberships/activeGroup'];
      this.$store.dispatch('submissions/startDraft', { survey, group });
    },
    async resubmit(submission) {
      await this.$store.dispatch('submissions/fetchRemoteSubmission', submission._id);
      this.$router.push(`/submissions/drafts/${submission._id}`);
    },
    async reassign(submission) {
      console.log(`reassigning submission id ${submission._id}`);
      this.reassignment.showModal = false;
      try {
        await api.post(`/submissions/${submission._id}/reassign`, { group: this.reassignment.group, creator: this.reassignment.user });
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

      if ((sortBy.length > 0 && sortDesc.length > 0) && sortBy.length === sortDesc.length) {
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
      const element = document.createElement('a');

      element.setAttribute('href', this.apiDownloadUrl);
      element.setAttribute('download', `${this.surveyEntity.name}.${this.apiDownloadFormat}`);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    },
  },
  watch: {
    showArchived() {
      this.selected = [];
      this.fetchData();
    },
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
    const { data: surveyEntity } = await api.get(`/surveys/${this.survey}`);
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
</style>
