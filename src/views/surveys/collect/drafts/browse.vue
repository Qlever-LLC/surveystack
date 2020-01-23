<template>
  <v-container
    class="pl-8 pr-8 "
    v-if="drafts.length > 0"
  >
    <v-row class="flex-grow-0 flex-shrink-1">
      <div class="title">
        <div class="inner-title">Drafts</div>
        <div class="subtitle-1 count grey--text text--darken-2">Total<br>{{ drafts.length }} Drafts</div>
      </div>
    </v-row>
    <v-row
      v-for="draft in drafts"
      :key="draft._id"
      justify="center"
      align="center"
      class="flex-grow-1 flex-shrink-0"
      style="min-width: 100px; max-width: 100%;"
    >
      <div>
        <div>{{ draft.name }}</div>
        <div>{{ draft._id }}</div>
      </div>
    </v-row>
  </v-container>
</template>

<script>
/* eslint-disable prefer-destructuring */


import * as db from '@/store/db';


const loadResults = () => new Promise((resolve, reject) => {
  db.openDb(() => {
    db.getAllSurveyResults((results) => {
      if (!results || results.length === 0) {
        reject();
      } else {
        resolve(results);
      }
    });
  });
});

export default {
  data() {
    return {
      drafts: [],
    };
  },

  methods: {
    persist() {
      db.persistSurveyResult(this.instance);
    },
  },
  computed: {
  },
  async created() {
    try {
      // const { id } = this.$route.params;
      // const { data } = await api.get(`/surveys/${id}`);

      try {
        const results = await loadResults();
        this.drafts = results;
      } catch (error) {
        this.drafts = [];
      }
    } catch (e) {
      console.log('something went wrong:', e);
    }
  },
};
</script>

<style scoped>
.full {
  width: 100%;
}

.count {
  flex-grow: 0;
}

.title {
  /* align-items: center; */
  line-height: 1.5rem !important;
  width: 100%;
  display: flex;
  justify-content: space-between;
  flex-wrap: nowrap;
  margin: 0.2rem 0;
}

.inner-title {
  flex-basis: 0;
  flex-grow: 1;
}

.pack {
  flex-basis: 0 !important;
}

.footer {
  border-top: 1px solid #ccc;
  background: #fff;
  margin: 0;
  border-radius: 0;
  -webkit-box-align: center;
  align-items: center;
  display: flex;
  -webkit-box-flex: 0 !important;
  flex: 0 1 auto !important;
  flex-wrap: wrap;
  padding: 6px 16px;
  transition-duration: 0.2s;
  transition-property: background-color, left, right;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  position: fixed;
  left: 0px;
  right: 0px;
  bottom: 0px;
}
</style>
