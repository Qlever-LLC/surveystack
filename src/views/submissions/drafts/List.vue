<template>
  <v-container class="pl-8 pr-8" v-if="drafts.length > 0">
    <v-row class="flex-grow-0 flex-shrink-1">
      <div class="title">
        <div class="inner-title">Drafts</div>
        <div class="subtitle-1 count grey--text text--darken-2">
          Total
          <br />
          {{ drafts.length }} Drafts
        </div>
      </div>
    </v-row>

    <v-card class="mx-auto" max-width="400" tile>
      <v-list>
        <v-subheader>Drafts</v-subheader>
        <v-list-item-group color="primary">
          <v-list-item v-for="draft in drafts" :key="draft._id" @click="select(draft)">
            <v-list-item-icon>
              <v-icon>mdi-pencil-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title v-html="draft.name"></v-list-item-title>
              <v-list-item-subtitle>{{ draft._id }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-card>
  </v-container>
  <v-container v-else>Currently no drafts</v-container>
</template>

<script>
/* eslint-disable prefer-destructuring */
import { loadResults } from '@/utils/drafts';
import * as db from '@/store/db';

export default {
  data() {
    return {
      drafts: [],
    };
  },

  methods: {
    select(draft) {
      console.log(`clicked ${draft._id}`);
      this.$router.push(`/surveys/collect/drafts/${draft._id}`);
    },
    persist() {
      db.persistSurveyResult(this.instance);
    },
  },
  computed: {},
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
