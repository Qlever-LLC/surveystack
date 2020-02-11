<template>
  <div>
    <v-container>
      <div class="d-flex flex-column">
        <v-textarea
          v-model="match"
          outlined
          label="Match"
          rows="3"
        />
        <v-row>
          <v-col>
            <v-text-field
              v-model="sort"
              label="Sort"
            />
          </v-col>
          <v-col>
            <v-text-field
              v-model="project"
              label="Projection"
            />
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model.number="skip"
              label="Skip"
            />
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model.number="limit"
              label="Limit"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model.number="roles"
              label="Roles (Debug)"
            />
          </v-col>
          <v-col
            cols="6"
            class="d-flex align-center justify-end"
          >
            <v-btn
              @click="fetchData"
              :disabled="!validQuery"
              color="primary"
            >QUERY!</v-btn>
          </v-col>
        </v-row>

      </div>

      <h4>API</h4>
      <a
        class="body-2"
        :href="apiUrl"
        target="_blank"
      >{{apiUrl}}</a>
    </v-container>

    <!--
    <v-card>
      <v-card-title>
        Submissions
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="items"
        :items-per-page="5"
        class="elevation-1"
        :search="search"
      ></v-data-table>
    </v-card>
    -->
    <v-container>
      <v-card class="pa-3">
        <ul
          v-if="submissions.length > 0"
          class="list-group"
        >
          <li
            v-for="submission in submissions"
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
  </div>
</template>


<script>
/* eslint-disable no-unused-vars */

import api from '@/services/api.service';
import treeItem from '@/components/survey/TreeItem.vue';
import { flattenSubmission } from '@/utils/submissions';

// <tree-item class="item" :item="result" @make-folder="makeFolder" @add-item="addItem" />

export default {
  components: {
    treeItem,
  },
  data() {
    return {
      match: '{}',
      project: '{}',
      sort: '{}',
      skip: 0,
      limit: 0,
      roles: 'public',
      submissions: [],
      search: '',
    };
  },
  computed: {
    validQuery() {
      try {
        const match = JSON.parse(this.match);
        const sort = JSON.parse(this.sort);
        const project = JSON.parse(this.project);
      } catch (error) {
        return false;
      }

      return true;
    },
    headers() {
      const h = [];
      this.flatSubmissions.forEach((submission) => {
        const keys = Object.keys(submission);
        keys.forEach((k) => {
          if (h.some(tmp => tmp.value === k)) {
            return;
          }

          h.push({
            text: k,
            value: k,
          });
        });
      });
      return h;
    },
    items() {
      const table = [];
      // console.log(this.flatSubmissions);
      this.flatSubmissions.forEach((submission) => {
        const tableItem = {};
        Object.keys(submission).forEach((k) => {
          // console.log(submission[k]);
          if (submission[k].type === 'location') {
            const v = submission[k].value;
            // console.log(v);
            tableItem[k] = !v
              ? ''
              : Object.keys(v)
                .map(name => `${name}: ${v[name]}`)
                .join(' ');
          } else {
            tableItem[k] = submission[k].value;
          }
          // TODO serialize item for user
        });

        table.push(tableItem);
      });
      return table;
    },
    flatSubmissions() {
      return this.submissions.map(s => flattenSubmission(s));
    },
    apiRequest() {
      const { survey } = this.$route.query;
      return `/submissions?survey=${survey}&match=${this.match}&sort=${this.sort}&project=${this.project}&skip=${this.skip}&limit=${this.limit}&roles=${this.roles}`;
    },
    apiUrl() {
      return `${process.env.VUE_APP_API_URL}${this.apiRequest}`;
    },
  },
  methods: {
    async fetchData() {
      try {
        const { survey } = this.$route.query;
        const { data } = await api.get(this.apiRequest);
        this.submissions = data;
      } catch (e) {
        console.log('something went wrong:', e);
      }
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
