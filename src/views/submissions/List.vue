<template>
  <div>
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
          v-for="(control, i) in submission.data"
          :key="i"
        >
          <tree-item
            class="item"
            :item="control"
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
import {
  falttenSubmission,
} from '@/utils/surveys';

// <tree-item class="item" :item="result" @make-folder="makeFolder" @add-item="addItem" />

export default {
  components: {
    treeItem,
  },
  data() {
    return {
      search: '',
      submissions: [],
    };
  },
  computed: {
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
      this.flatSubmissions.forEach((submission) => {
        const tableItem = {};
        Object.keys(submission).forEach((k) => {
          tableItem[k] = submission[k];
        });

        table.push(tableItem);
      });
      return table;
    },
    flatSubmissions() {
      return this.submissions.map(s => falttenSubmission(s));
    },
  },
  async created() {
    try {
      const { survey } = this.$route.query;
      const { data } = await api.get(`/submissions?survey=${survey}`);
      // console.log(data);
      this.submissions = data;
    } catch (e) {
      console.log('something went wrong:', e);
    }
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
