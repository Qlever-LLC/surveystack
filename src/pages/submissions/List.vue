<template>
  <div>
    <app-dialog
      v-model="showArchiveModal"
      @cancel="showArchiveModal = false"
      @confirm="archiveSubmission(selected[0])"
    >
      <template v-slot:title>Confirm archiving</template>
      <template>
        Do you want to archive this submission?
      </template>
    </app-dialog>

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

    <v-container>
      <div class="d-flex justify-end">
        <v-btn
          outlined
          color="secondary"
          @click="startDraft(survey)"
        >
          <v-icon left>mdi-note-plus</v-icon>
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
        :href="apiUrl"
        target="_blank"
      >{{apiUrl}}</a>

      <v-radio-group
        v-model="apiSelection"
        row
        dense
        style="margin-top: 0px; margin-bottom: 0px"
        hide-details
      >
        <v-radio
          v-for="item in apiSelections"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        ></v-radio>
      </v-radio-group>

      <v-card
        v-if="selected.length > 0"
        class="mt-4"
      >
        <v-card-text>
          <div class="d-flex align-center">
            <div><span class="subtitle-2">ACTIONS</span><br />{{selected.length}} {{selected.length === 1 ? 'submission' : 'submissions'}} selected</div>
            <div
              class="ml-auto"
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
                @click="archiveSubmission(selected[0], false)"
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
                v-if="selected[0]['meta.archived'] !== 'true'"
                text
                color="secondary"
                @click="resubmit(selected[0])"
              >
                RESUBMIT...
              </v-btn>

            </div>
          </div>
        </v-card-text>
      </v-card>

    </v-container>

    <v-container>

      <div class="d-flex ">
        <v-select
          class="ml-auto"
          style="max-width: 5rem; display: inline-block"
          label="Page Size"
          dense
          :items="pageSizes"
          hide-details
          v-model="pageSize"
          @change="changedPaginationSize"
        ></v-select>
      </div>

      <div class="py-2">
        <v-pagination
          v-model="page"
          :length="paginationTotalPages"
          @input="changedPaginationPage"
        ></v-pagination>
      </div>

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
      <div class="text-center py-2">
        <v-pagination
          v-model="page"
          :length="paginationTotalPages"
          @input="changedPaginationPage"
        ></v-pagination>
      </div>
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

const apiSelections = [{ label: 'CSV', value: 'csv' }, { label: 'JSON', value: 'json' }];

export default {
  components: {
    appSubmissionsFilterBasic,
    appSubmissionsFilterAdvanced,
    appSubmissionsTree,
    appSubmissionsTableClientCsv,
    appSubmissionsCode,
    appDialog,
  },
  data() {
    return {
      apiSelection: apiSelections[0].value,
      apiSelections,
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
      pageSizes: [1, 5, 10, 20, 50, 100, 10000],
      pageSize: defaultPageSize,
      selected: [],
      search: '',
      showArchived: false,
      showArchiveModal: false,
      showDeleteModal: false,
      dateTableProps: {
        sortBy: [],
        sortDesc: [false],
      },
      loading: false,
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
    apiParams() {
      let params = `survey=${this.survey}&match=${this.filter.match}&sort=${this.filter.sort}&project=${this.filter.project}&skip=${this.filter.skip}&limit=${this.filter.limit}`;
      if (this.showArchived) {
        params += '&showArchived=true';
      }

      if (process.env.NODE_ENV === 'development') {
        return `${params}&roles=${this.filter.roles}`;
      }
      return params;
    },
    apiRequest() {
      return `/submissions/page?${this.apiParams}`;
    },
    apiUrl() {
      let endpoint;
      switch (this.apiSelection) {
        case 'csv':
          endpoint = '/submissions/csv';
          break;
        case 'json':
          endpoint = '/submissions';
          break;
        default:
          endpoint = '/submissions/page';
      }
      return `${process.env.VUE_APP_API_URL}${endpoint}?${this.apiParams}`;
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
        const { data: submissions } = await api.get(this.apiRequest);
        this.submissions = submissions;
      } catch (e) {
        console.log('something went wrong:', e);
      } finally {
        this.loading = false;
      }
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
    async archiveSubmission(submission, value = true) {
      this.showArchiveModal = false;
      try {
        const { data: archived } = await api.post(`/submissions/${submission._id}/archive?set=${value}`);
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
    changedPaginationPage(p) {
      this.page = p;
      this.filter.skip = (p - 1) * this.filter.limit;
      this.fetchData();
    },
    changedPaginationSize() {
      // console.log;
      this.page = 1;
      this.filter.limit = this.pageSize;
      this.filter.skip = 0;
      this.fetchData();
    },
    onDataTablePropsChanged(props) {
      const [sortBy] = props.sortBy;
      if (sortBy && props.sortDesc.length > 0) {
        try {
          const [sortDesc] = props.sortDesc;
          const sort = JSON.stringify({ [sortBy]: sortDesc ? -1 : 1 });
          this.filter.sort = sort;
          this.fetchData();
        } catch (error) {
          console.log('error parsing sort');
        }
      }

      if (!sortBy) {
        this.filter.sort = JSON.stringify({});
        this.fetchData();
      }

      this.dateTableProps = props;
    },
  },
  watch: {
    showArchived() {
      this.selected = [];
      this.fetchData();
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
