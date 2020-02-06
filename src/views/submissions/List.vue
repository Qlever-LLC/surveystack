<template>
  <div>
    <v-container>
      <div class="d-flex flex-column">
        <v-textarea
          v-model="q"
          outlined
        />
        <v-btn
          @click="fetchData"
          :disabled="!validQuery"
          class="ml-auto"
        >QUERY!</v-btn>
      </div>
    </v-container>
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

    <ul
      v-if="submissions.length > 0"
      class="list-group"
    >
      <li
        v-for="submission in submissions"
        :key="submission._id"
        class="list-group-item"
      >
        <small class="grey--text text--darken-1">{{submission._id}}</small>
        <small class="grey--text text--darken-1">(Version {{submission.meta.version}})</small>
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
      q: '',
      search: '',
      submissions: [],
    };
  },
  computed: {
    validQuery() {
      try {
        const q = JSON.parse(this.q);
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
  },
  methods: {
    async fetchData() {
      try {
        const { survey } = this.$route.query;
        const { data } = await api.get(
          `/submissions?survey=${survey}&q=${this.q}`,
        );
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
