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
      <div class="text-right text--secondary"><small>total {{submissions.pagination.total}} records</small></div>
      <v-card class="pa-3">
        <ul
          v-if="submissions.content.length > 0"
          class="list-group"
        >
          <li
            v-for="submission in submissions.content"
            :key="submission._id"
            class="list-group-item pa-2"
          >
            <small class="grey--text text--darken-1">{{submission._id}}</small>
            <small class="grey--text text--darken-1">, Version {{submission.meta.version}}</small>
            <small
              v-if="submission.meta.path"
              class="grey--text text--darken-1"
            >, {{submission.meta.path}}</small>
            <div
              v-for="(item, name, i) in submission.data"
              :key="i"
            >
              <tree-item
                class="item"
                :item="item"
                :name="name"
              />
            </div>
          </li>
        </ul>
      </v-card>
    </v-container>
    <app-submissions-table-client-csv v-if="false" />
  </div>
</template>


<script>
/* eslint-disable no-unused-vars */

import api from '@/services/api.service';
import treeItem from '@/components/survey/TreeItem.vue';
import { flattenSubmission } from '@/utils/submissions';
import appSubmissionsFilter from '@/components/submissions/SubmissionFilter.vue';
import appSubmissionsTableClientCsv from '@/components/submissions/SubmissionTableClientCsv.vue';


export default {
  components: {
    treeItem,
    appSubmissionsFilter,
    appSubmissionsTableClientCsv,
  },
  data() {
    return {
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
