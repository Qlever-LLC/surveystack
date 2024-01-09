<template>
  <div>
    <a-card-title class="pl-0">
      <a-icon class="mr-1">mdi-library</a-icon>
      Question Library
      <a-spacer />
      <a-btn icon key="library" @click="$emit('cancel')" class="mt-n5 mr-n6" small tile elevation="0">
        <a-icon> mdi-close </a-icon>
      </a-btn>
    </a-card-title>

    <a-text-field v-model="search" label="Search" append-inner-icon="mdi-magnify" />
    <div class="d-flex justify-end mb-4">
      <small class="text-secondary"> {{ surveys.pagination.total }} results </small>
    </div>
    <a-container v-if="loading" class="d-flex align-center justify-center" cssHeight100>
      <a-progress-circular :size="50" color="primary" indeterminate />
    </a-container>
    <a-container fluid class="pa-0" v-else>
      <a-row dense>
        <a-col v-for="c in activeSurveys" :key="c._id" :cols="!selectedSurvey ? 4 : 12" class="py-0">
          <a-card
            @click="toggleCard(c._id)"
            v-show="!selectedSurvey || selectedSurvey._id == c._id"
            class="control-item mb-2"
            elevation="7">
            <a-row cssMinHeight96px>
              <a-col cssMinWidth0px>
                <div class="title text-truncate">
                  {{ c.name }}
                  <a-tooltip bottom activator="parent">{{ c.name }}</a-tooltip>
                </div>
                <div>
                  <small class="text-grey">{{ c._id }}</small>
                </div>
                <a-chip small variant="outlined" color="grey" class="font-weight-medium mt-1">
                  Version {{ c.latestVersion }}
                </a-chip>
              </a-col>
              <a-col align="right" md="auto">
                <a-btn
                  dark
                  v-if="selectedSurvey && selectedSurvey._id === c._id"
                  color="grey"
                  key="close"
                  @click.stop="toggleCard(c._id)"
                  class="mt-n5 mr-1 d-inline-block shadow white span-button"
                  outlined
                  small>
                  back
                </a-btn>
                <a-btn
                  dark
                  v-if="selectedSurvey && selectedSurvey._id === c._id"
                  color="white"
                  key="library"
                  @click="addToSurvey(c._id)"
                  class="mt-n5 d-inline-block shadow bg-green span-button"
                  outlined
                  small>
                  add to survey
                </a-btn>
                <!--TODO Resolve #48, then uncomment this
                div>
                  <a-tooltip bottom>
                    <template v-slot:activator="{ props }">
                      <div v-bind="props">
                        <a-icon class="mr-1 pb-1">mdi-account-group</a-icon>
                        {{ c.meta.libraryUsageCountSurveys ? c.meta.libraryUsageCountSurveys : 0 }}
                      </div>
                    </template>
                    <span>Number of surveys using this</span>
                  </a-tooltip>
                </div-->
                <div>
                  <a-icon class="mr-1">mdi-note-multiple-outline</a-icon>
                  {{ c.meta.libraryUsageCountSubmissions ? c.meta.libraryUsageCountSubmissions : 0 }}
                  <a-tooltip bottom activator="parent">Number of submission using this</a-tooltip>
                </div>
              </a-col>
            </a-row>
            <a-row v-if="selectedSurvey && selectedSurvey._id === c._id">
              <a-col>
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
              </a-col>
              <a-col>
                <h4>Questions</h4>
                <graphical-view
                  :readOnly="true"
                  :scale="0.75"
                  v-if="selectedSurvey && selectedSurvey._id === c._id"
                  class="graphical-view"
                  :controls="selectedSurvey.revisions[selectedSurvey.revisions.length - 1].controls" />
              </a-col>
            </a-row>
          </a-card>
        </a-col>
      </a-row>
    </a-container>
    <a-pagination
      v-if="surveys.content.length > 0 && !selectedSurvey"
      v-model="page"
      :length="activeTabPaginationLength"
      @input="() => fetchData()" />
  </div>
</template>
<script>
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
      },
      loading: false,
      selectedSurvey: null,
    };
  },
  computed: {
    activeTabPaginationLength() {
      const { total } = this.surveys.pagination;
      return total ? Math.ceil(total / PAGINATION_LIMIT) : 0;
    },
    activeSurveys() {
      return this.selectedSurvey ? [this.selectedSurvey] : this.surveys.content;
    },
  },
  methods: {
    async fetchData() {
      const queryParams = new URLSearchParams();
      if (this.search) {
        queryParams.append('q', this.search);
      }

      queryParams.append('isLibrary', 'true');
      queryParams.append('skip', (this.page - 1) * PAGINATION_LIMIT);
      queryParams.append('limit', PAGINATION_LIMIT);

      try {
        this.loading = true;
        const { data } = await api.get(`/surveys/list-page?${queryParams}`);
        this.loading = false;
        this.surveys = data;
        return data;
      } catch (e) {
        console.log('Error fetching surveys:', e);
      }

      return {
        content: [],
        pagination: {
          parsedLimit: 10,
          parsedSkip: 0,
          total: 0,
        },
      };
    },
    addToSurvey(librarySurveyId) {
      this.$emit('add-questions-from-library', librarySurveyId);
    },
    async toggleCard(surveyId) {
      if (this.selectedSurvey && this.selectedSurvey._id === this.libraryId) {
        return; // prevent to switch to the list if editing mode
      } else if (this.selectedSurvey && this.selectedSurvey._id === surveyId) {
        this.selectedSurvey = null; // deselect card
      } else {
        const { data } = await api.get(`/surveys/${surveyId}?version=latest`);
        this.selectedSurvey = data; // select card
      }
    },
  },
  watch: {
    search() {
      this.page = 1;
      this.fetchData();
    },
    libraryId() {
      // Reset to list mode
      this.selectedSurvey = null;
    },
  },
  created() {
    // Load list of surveys
    this.fetchData();

    if (this.libraryId) {
      // Load the selected survey if editing mode
      this.toggleCard(this.libraryId);
    }
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

.graphical-view {
  overflow: auto;
  margin-top: 6px;
}

.v-card:focus:before {
  opacity: 0 !important;
}
</style>
