<template>
  <div>
    <v-container>
      <v-menu
        offset-y
        class="mb-3"
      >
        <template v-slot:activator="{ on }">
          <v-btn
            color="primary"
            dark
            v-on="on"
          >
            {{formats[selectedFormat].title}}
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

      <app-submissions-filter
        v-model="filter"
        class="mt-3"
      />

      <div class="d-flex justify-end">
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
    </v-container>

    <v-container>
      <v-tabs v-model="tab">
        <v-tab
          v-for="view in views"
          :key="view.tab"
        >
          {{view.tab}}
        </v-tab>
        <v-tabs-items v-model="tab">
          <v-tab-item>
            <app-submissions-table-client-csv
              :submissions="submissions"
              v-if="submissions"
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
import appSubmissionsFilter from '@/components/submissions/SubmissionFilter.vue';
import appSubmissionsTableClientCsv from '@/components/submissions/SubmissionTableClientCsv.vue';
import appSubmissionsTree from '@/components/submissions/SubmissionTree.vue';
import appSubmissionsCode from '@/components/submissions/SubmissionCode.vue';


export default {
  components: {
    appSubmissionsFilter,
    appSubmissionsTree,
    appSubmissionsTableClientCsv,
    appSubmissionsCode,
  },
  data() {
    return {
      tab: null,
      views: [
        { tab: 'Table', component: 'table' },
        { tab: 'Tree', component: 'tree' },
        { tab: 'Raw', component: 'raw' },
      ],
      survey: null,
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
        roles: 'public',
      },
      submissions: {
        content: [],
        pagination: {
          total: 0,
          skip: 0,
          limit: 100000,
        },
      },
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
      return `/submissions/page?survey=${this.survey}&match=${this.filter.match}&sort=${this.filter.sort}&project=${this.filter.project}&skip=${this.filter.skip}&limit=${this.filter.limit}&roles=${this.filter.roles}`;
    },
    apiUrl() {
      return `${process.env.VUE_APP_API_URL}${this.apiRequest}`;
    },
  },
  methods: {
    async fetchData() {
      try {
        this.survey = this.$route.query.survey;
        this.submissions = (await api.get(this.apiRequest)).data;
      } catch (e) {
        console.log('something went wrong:', e);
      }
    },
    setFormat(ev) {
      this.selectedFormat = ev;
    },
  },
  async created() {
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
