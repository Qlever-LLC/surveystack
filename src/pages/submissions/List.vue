<template>
  <div>
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

      <h4 class="mt-3">API</h4>
      <a
        class="body-2"
        :href="apiUrl"
        target="_blank"
      >{{apiUrl}}</a>

      <v-card
        v-if="selected.length > 0"
        class="mt-4"
      >
        <v-card-text>
          <div class="d-flex align-center">
            <div><span class="subtitle-2">ACTIONS</span><br />{{selected.length}} {{selected.length === 1 ? 'submission' : 'submissions'}} selected</div>
            <div class="ml-auto">
              <v-btn
                v-if="selected.length === 1"
                color="error"
                text
                @click="deleteSubmission(selected[0])"
              >
                DELETE
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>

    </v-container>

    <v-container>
      <v-tabs v-model="tab">
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
    </v-container>

  </div>
</template>


<script>
/* eslint-disable no-unused-vars */

import api from '@/services/api.service';
import { flattenSubmission } from '@/utils/submissions';
import appSubmissionsFilterBasic from '@/components/submissions/SubmissionFilterBasic.vue';
import appSubmissionsFilterAdvanced from '@/components/submissions/SubmissionFilterAdvanced.vue';
import appSubmissionsTableClientCsv from '@/components/submissions/SubmissionTableClientCsv.vue';
import appSubmissionsTree from '@/components/submissions/SubmissionTree.vue';
import appSubmissionsCode from '@/components/submissions/SubmissionCode.vue';

import { createQueryList } from '@/utils/surveys';

const defaultFilter = {
  match: '{}',
  project: '{}',
  sort: '{}',
  skip: 0,
  limit: 0,
  roles: '',
};

export default {
  components: {
    appSubmissionsFilterBasic,
    appSubmissionsFilterAdvanced,
    appSubmissionsTree,
    appSubmissionsTableClientCsv,
    appSubmissionsCode,
  },
  data() {
    return {
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
        limit: 0,
        roles: '',
      },
      basicFilters: [],
      submissions: {
        content: [],
        pagination: {
          total: 0,
          skip: 0,
          limit: 100000,
        },
      },
      selected: [],
      search: '',
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
    apiRequest() {
      const req = `/submissions/page?survey=${this.survey}&match=${this.filter.match}&sort=${this.filter.sort}&project=${this.filter.project}&skip=${this.filter.skip}&limit=${this.filter.limit}`;
      if (process.env.NODE_ENV === 'development') {
        return `${req}&roles=${this.filter.roles}`;
      }
      return req;
    },
    apiUrl() {
      return `${process.env.VUE_APP_API_URL}${this.apiRequest}`;
    },
    queryList() {
      if (!this.surveyEntity) {
        return null;
      }
      const list = createQueryList(this.surveyEntity, this.surveyEntity.latestVersion);
      return list;
    },
  },
  methods: {
    async fetchData() {
      try {
        const { data: submissions } = await api.get(this.apiRequest);
        this.submissions = submissions;
      } catch (e) {
        console.log('something went wrong:', e);
      }
    },
    async deleteSubmission(submission) {
      try {
        await api.delete(`/submissions/${submission._id}`);
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
  },
  async created() {
    this.survey = this.$route.query.survey;
    const r = await api.get(`/surveys/${this.survey}`);
    this.surveyEntity = r.data;
    console.log(this.surveyEntity);
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
