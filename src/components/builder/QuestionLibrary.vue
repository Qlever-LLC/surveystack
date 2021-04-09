<template>
  <div>
    <v-card-title class="pl-0">
      <v-icon class="mr-1">mdi-library</v-icon>
      Question Library</v-card-title>

    <v-text-field
      v-model="search"
      label="Search"
      append-icon="mdi-magnify"
    />
    <div class="d-flex justify-end mb-4">
      <small class="text--secondary">
        {{surveys.pagination.total}} results
      </small>
    </div>
    <v-container fluid class="pa-0">
      <v-row dense>
        <v-col
          v-for="e in surveys.content"
          :key="e._id"
          cols="4"
        >
          <v-card
            class="control-item mb-2"
            elevation="7"
          >
            <v-row>
              <v-col>
                <small>number</small>
                <br>
                {{e.name}}
                <br>
                <small>groups</small>
                <br>
                <v-btn
                  dark
                  color="white"
                  key="library"
                  @click="addToSurvey(e._id)"
                  class="ma-1 d-inline-block shadow green span-button"
                  outlined
                  small
                >
                  add to survey
                </v-btn>
              </v-col>
              <v-col align="right">
                <div>
                  <v-icon class="mr-1">mdi-account-group</v-icon>
                  34
                </div>
                <div>
                  <v-icon class="mr-1">mdi-note-multiple-outline</v-icon>
                  343
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script>
import moment from 'moment';
import api from '@/services/api.service';

const PAGINATION_LIMIT = 10;

export default {
  components: {

  },
  props: [
    'survey',
  ],
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
    };
  },
  computed: {
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
      if (this.isWhitelabel) {
        queryParams.append('prefix', this.whitelabelPartner.path);
      }

      queryParams.append('skip', (this.page - 1) * PAGINATION_LIMIT);
      queryParams.append('limit', PAGINATION_LIMIT);

      try {
        const { data } = await api.get(`/surveys/list-page?${queryParams}`);
        this.surveys = data;
        this.surveys.content.forEach((s) => {
          if (!s.meta || !s.meta.dateCreated) {
            return;
          }
          // eslint-disable-next-line no-param-reassign
          s.createdAgo = moment.duration(now.diff(s.meta.dateCreated)).humanize();
        });
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
      };
    },
    addToSurvey(librarySurveyId) {
      this.$emit('addToSurvey', librarySurveyId);
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

<style>
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
  border-color:#4CAF50 !important;
}
/*
.control-item-selected {
border-left: 2px solid var(--v-primary-base);
}*/
</style>
