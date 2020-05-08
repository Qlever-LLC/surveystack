<template>
  <v-container style="height: 100%">
    <v-container>
      <v-row class="d-flex flex-grow-1">
        <v-tabs
          dark
          flat
          background-color="primary"
          v-model="activeTab"
          centered
          icons-and-text
          grow
          @change="updateActiveTab"
        >
          <v-tab
            v-for="tab in tabs"
            :key="tab.name"
            :href="`#${tab.name}`"
          >
            {{ tab.title }}
            <v-icon>{{ tab.icon }}</v-icon>
          </v-tab>
        </v-tabs>
        <v-tabs-items
          v-model="activeTab"
          style="height: 100%;"
          class="flex-grow-1"
          v-if="!isLoading"
        >
          <v-tab-item
            v-for="tab in tabs"
            :key="tab.name"
            :value="tab.name"
            class="flex-grow-1 flex-column align-center justify-center align-content-center"
            style="height: 100%;"
          >
            <v-card>
              <!-- <div v-if="tab.name !== 'sent' && tab.content.length > 0"> -->
              <div v-if="tab.name !== 'sent' && activeTabPageContent.length > 0">
                <v-list >
                  <template v-for="(item, i) in activeTabPageContent">
                    <v-list-item
                      @click="select(item)"
                      :key="i"
                    >
                      <v-list-item-content two-line>
                        <v-list-item-title v-if="surveyForSubmission(item)">
                          {{ surveyForSubmission(item).name}}
                        </v-list-item-title>
                        <v-list-item-title v-else>
                          Loading name
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          ID: {{ item._id }} <br>
                          {{ (new Date(item.meta.dateCreated)).toLocaleString() }}
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider
                      v-if="i + 1 < tab.content.length"
                      :key="`divider_${i}`"
                    ></v-divider>
                  </template>
                </v-list>
                <v-pagination
                  v-model="page"
                  :length="activeTabPaginationLength"
                />
              </div>
              <div v-else-if="tab.name === 'sent' && tab.content.length > 0">
                <v-list >
                  <template v-for="(item, i) in tab.content">
                    <v-list-item
                      @click="select(item)"
                      :key="i"
                    >
                      <v-list-item-content two-line>
                        <v-list-item-title v-if="surveyForSubmission(item)">
                          {{ surveyForSubmission(item).name}}
                        </v-list-item-title>
                        <v-list-item-title v-else>
                          Loading name
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          ID: {{ item._id }} <br>
                          {{ (new Date(item.meta.dateCreated)).toLocaleString() }}
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider
                      v-if="i + 1 < tab.content.length"
                      :key="`divider_${i}`"
                    ></v-divider>
                  </template>
                </v-list>
                <v-pagination
                  v-model="remotePage"
                  :length="sentTabPaginationLength"
                  @input="fetchRemoteSubmissions"
                />
              </div>
              <v-container
                fill-height
                fluid
                v-else
              >
                <v-row
                  align="center"
                  justify="center"
                >
                  <v-col>
                    <div class="d-flex flex-column align-center">
                      <v-icon large>mdi-file-multiple</v-icon>
                      <v-alert
                        type="info"
                        text
                        class="ma-4"
                      >No drafts yet</v-alert>
                    </div>
                  </v-col>
                </v-row>
              </v-container>
            </v-card>

          </v-tab-item>
        </v-tabs-items>
        <v-card v-else width="100%" style="min-height: 50vh">
          <v-card-text class="d-flex align-center justify-center" style="height: 100%">
            <v-progress-circular
              :size="50"
              color="primary"
              indeterminate
            />
          </v-card-text>
        </v-card>
      </v-row>

    </v-container>
  </v-container>
</template>

<script>
import moment from 'moment';
import api from '@/services/api.service';
// TODO: figure out why there is an import cycle from submissions.strore > router
// eslint-disable-next-line import/no-cycle
import { types as submissionsTypes } from '@/store/modules/submissions.store';

const PAGINATION_LIMIT = 10;

export default {
  data() {
    return {
      isLoading: false,
      activeTab: 'drafts',
      page: 1,
      remoteSubmissions: [],
      remotePage: 1,
      remoteSubmissionsPagination: {
        total: 0,
        skip: 0,
        limit: 1e5,
      },
    };
  },
  updated() {
    this.$store.dispatch('appui/setTitle', 'My Submissions');
  },
  async created() {
    this.$store.dispatch(`submissions/${submissionsTypes.actions.fetchLocalSubmissions}`);

    await this.$store.dispatch('surveys/fetchSurveys');
  },
  beforeDestroy() {
    this.$store.dispatch('appui/reset');
  },
  computed: {
    activeTabBody() {
      return this.tabs.find(t => t.name === this.activeTab);
    },
    activeTabPageContent() {
      if (this.activeTab === 'drafts') {
        return this.getPageOfArray(this.activeTabBody.content, this.page);
      }
      return [];
    },
    activeUser() {
      return this.$store.getters['auth/user']._id;
    },
    sentTabPaginationLength() {
      const { total } = this.remoteSubmissionsPagination;
      return total ? Math.ceil(total / PAGINATION_LIMIT) : 0;
    },
    activeTabPaginationLength() {
      if (this.activeTab === 'drafts') {
        return Math.ceil(this.activeTabBody.content.length / PAGINATION_LIMIT);
      }
      return 1;
    },
    tabs() {
      return [
        {
          name: 'drafts',
          title: 'Drafts',
          content: this.sortSubmissions(this.$store.getters['submissions/drafts']),
          icon: 'mdi-file-document-edit',
        },
        // {
        //   name: 'outbox',
        //   title: 'Outbox',
        //   content: this.sortSubmissions(this.$store.getters['submissions/outbox']),
        //   icon: 'mdi-cloud-sync',

        // },
        {
          name: 'sent',
          title: 'Sent',
          content: this.remoteSubmissions,
          icon: 'mdi-email-check',
        },
      ];
    },
  },
  methods: {
    getPageOfArray(arr, page, limit = PAGINATION_LIMIT) {
      const rangeStart = (page - 1) * limit;
      const rangeEnd = page * limit;
      return arr.slice(rangeStart, rangeEnd);
    },
    async fetchRemoteSubmissions() {
      this.isLoading = true;
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('creator', this.activeUser);
        queryParams.append('limit', PAGINATION_LIMIT);
        queryParams.append('skip', (this.remotePage - 1) * PAGINATION_LIMIT);
        queryParams.append('sort', '{"meta.dateCreated":-1}');
        const { data } = await api.get(`/submissions/page?${queryParams}`);
        this.remoteSubmissions = data.content;
        this.remoteSubmissionsPagination = data.pagination;
      } catch (err) {
        console.log('Could not fetch remote submissions', err);
        this.remoteSubmissions = [];
        this.remoteSubmissionsPagination = {
          total: 0,
          skip: 0,
          limit: 1e5,
        };
      }
      this.isLoading = false;
    },
    async updateActiveTab(tab) {
      // console.log(tab);
      if (tab === 'sent') {
        await this.fetchRemoteSubmissions();
      }
    },
    surveyForSubmission(submission) {
      return this.$store.state.surveys.surveys.find(
        survey => survey._id === submission.meta.survey.id,
      );
    },
    select(draft) {
      console.log(`clicked ${draft._id}`);
      this.$router.push(`/submissions/drafts/${draft._id}`);
    },
    sortSubmissions(submissions) {
      return [...submissions].sort(
        (a, b) => (new Date(b.meta.dateModified)).valueOf() - (new Date(a.meta.dateModified)).valueOf(),
      );
    },
  },
};
</script>

<style>
</style>
