<template>
  <div>
    <v-card-title class="pl-0">
      <v-icon class="mr-1">mdi-library</v-icon>
      Question Library
      <v-spacer></v-spacer>
      <v-btn icon key="library" @click="$emit('cancel')" class="mt-n5 mr-n6" :depressed="true" small tile elevation="0">
        <v-icon>
          mdi-close
        </v-icon>
      </v-btn>
    </v-card-title>

    <v-text-field v-model="search" label="Search" append-icon="mdi-magnify" />
    <div class="d-flex justify-end mb-4">
      <small class="text--secondary"> {{ surveys.pagination.total }} results </small>
    </div>
    <v-container v-if="loading" class="d-flex align-center justify-center" style="height: 100%">
      <v-progress-circular :size="50" color="primary" indeterminate />
    </v-container>
    <v-container fluid class="pa-0" v-else>
      <v-row dense>
        <v-col v-for="c in surveys.content" :key="c._id" :cols="!selectedSurvey ? 4 : 12" class="py-0">
          <v-card
            @click="toggleCard(c)"
            v-show="!selectedSurvey || selectedSurvey._id == c._id"
            class="control-item mb-2"
            elevation="7"
          >
            <v-row style="min-height:96px;">
              <v-col>
                <div class="title">{{ c.name }}</div>
                <div>
                  <small class="grey--text">{{ c._id }}</small>
                </div>
                <v-chip dark small outlined color="grey" class="font-weight-medium mt-1">
                  Version {{ c.latestVersion }}
                </v-chip>
              </v-col>
              <v-col align="right" md="auto">
                <v-btn
                  dark
                  v-if="selectedSurvey && selectedSurvey._id === c._id"
                  color="grey"
                  key="close"
                  @click.stop="toggleCard(c)"
                  class="mt-n5 mr-1 d-inline-block shadow white span-button"
                  outlined
                  small
                >
                  back
                </v-btn>
                <v-btn
                  dark
                  v-if="selectedSurvey && selectedSurvey._id === c._id"
                  color="white"
                  key="library"
                  @click="addToSurvey(c._id)"
                  class="mt-n5 d-inline-block shadow green span-button"
                  outlined
                  small
                >
                  add to survey
                </v-btn>
                <div>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <div v-bind="attrs" v-on="on">
                        <v-icon class="mr-1 pb-1">mdi-account-group</v-icon>
                        {{ c.meta.libraryUsageCountSurveys ? c.meta.libraryUsageCountSurveys : 0 }}
                      </div>
                    </template>
                    <span>Number of surveys using this</span>
                  </v-tooltip>
                </div>
                <div>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <div v-bind="attrs" v-on="on">
                        <v-icon class="mr-1">mdi-note-multiple-outline</v-icon>
                        {{ c.meta.libraryUsageCountSubmissions ? c.meta.libraryUsageCountSubmissions : 0 }}
                      </div>
                    </template>
                    <span>Number of submission using this</span>
                  </v-tooltip>
                </div>
              </v-col>
            </v-row>
            <v-row v-if="selectedSurvey && selectedSurvey._id === c._id">
              <v-col>
                <h4>Description</h4>
                <small v-html="selectedSurvey.meta.libraryDescription"></small>
                <br />
                <h4>Applications</h4>
                <small v-html="selectedSurvey.meta.libraryApplications"></small>
                <br />
                <h4>Maintainers</h4>
                <small v-html="selectedSurvey.meta.libraryMaintainers"></small>
                <br />
                <h4>Updates</h4>
                <small v-html="selectedSurvey.meta.libraryHistory"></small>
              </v-col>
              <v-col>
                <h4>Questions</h4>
                <graphical-view
                  :readOnly="true"
                  scale="0.75"
                  v-if="selectedSurvey && selectedSurvey._id === c._id"
                  class="graphical-view"
                  :controls="selectedSurvey.revisions[selectedSurvey.latestVersion - 1].controls"
                />
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <v-pagination
      v-if="surveys.content.length > 0 && !selectedSurvey"
      v-model="page"
      :length="activeTabPaginationLength"
      @input="() => fetchData()"
    />
  </div>
</template>
<script>
import moment from 'moment';
import api from '@/services/api.service';
import graphicalView from '@/components/builder/GraphicalView.vue';

const PAGINATION_LIMIT = 12;

export default {
  components: {
    graphicalView,
  },
  props: ['survey', 'libraryId'],
  data() {
    return {
      page: 1,
      search: '',
      surveys: {
        content: [],
        pagination: {
          total: 0,
          skip: 0,
          limit: 100000,
        },
        loading: false,
      },
      selectedSurvey: null,
    };
  },
  computed: {
    activeTabPaginationLength() {
      const { total } = this.surveys.pagination;
      return total ? Math.ceil(total / PAGINATION_LIMIT) : 0;
    },
  },
  methods: {
    async fetchData() {
      const now = moment();
      const queryParams = new URLSearchParams();
      if (this.search) {
        queryParams.append('q', this.search);
        console.log(this.search);
      }

      queryParams.append('isLibrary', 'true');
      queryParams.append('skip', (this.page - 1) * PAGINATION_LIMIT);
      queryParams.append('limit', PAGINATION_LIMIT);

      try {
        this.loading = true;
        const { data } = await api.get(`/surveys/list-page?${queryParams}`);
        this.loading = false;

        for (let i = 0; i < data.content.length; i++) {
          const s = data.content[i];
          if (!s.meta || !s.meta.dateCreated) {
            continue;
          }
          // eslint-disable-next-line no-param-reassign
          s.createdAgo = moment.duration(now.diff(s.meta.dateCreated)).humanize();

          // set selected survey
          if (this.libraryId && s._id === this.libraryId) {
            this.toggleCard(s);
          }
        }

        this.surveys = data;

        return data;
      } catch (e) {
        // TODO: use cached data?
        console.log('Error fetching surveys:', e);
      }
      // return [];
      return {
        content: [],
        pagination: {
          parsedLimit: 10,
          parsedSkip: 0,
          total: 0,
        },
        loading: false,
      };
    },
    addToSurvey(librarySurveyId) {
      this.$emit('add-questions-from-library', librarySurveyId);
    },
    async toggleCard(survey) {
      if (this.selectedSurvey && survey._id === this.selectedSurvey._id) {
        this.selectedSurvey = null; // deselect card
      } else {
        const { data } = await api.get(`/surveys/${survey._id}`);
        this.selectedSurvey = data; // select card
      }
    },
  },
  watch: {
    search(value) {
      this.page = 1;
      this.fetchData();
    },
  },
  created() {
    this.fetchData();
  },
};
</script>

<style scoped>
.control-item:first-child {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.control-item {
  padding: 0.75rem 1.25rem;
  border: 1px solid rgba(0, 0, 0, 0.125);
  margin-bottom: -1px;
  /* border-left: 2px solid transparent; */
  border-left-width: 2px;
  position: relative;
}

.control-item:hover::before,
.control-item-selected::before {
  border-color: #4caf50 !important;
}
/*
.control-item-selected {
border-left: 2px solid var(--v-primary-base);
}*/
.graphical-view {
  overflow: auto;
  margin-top: 6px;
}
.v-card:focus:before {
  opacity: 0 !important;
}
</style>
