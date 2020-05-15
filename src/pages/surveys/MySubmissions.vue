<template>
  <v-container style="height: 100%">
    <v-container>
      <v-row class="d-flex flex-grow-1">
        <v-tabs
          flat
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
            <v-card min-height="70vh" class="d-flex flex-column justify-space-between">
              <template v-if="tab.name !== 'sent' && activeTabPageContent.length > 0">
                <v-card-text >
                  <v-list >
                    <template v-for="(item, i) in activeTabPageContent">
                      <v-list-item
                        :key="i"
                      >
                        <v-list-item-content
                          @click="select(item)"
                          class="cursor-pointer"
                          two-line
                        >
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
                        <v-list-item-action>
                          <v-btn icon>
                            <v-icon v-if="readyToSubmitHas(item._id)">
                              mdi-cloud-upload
                            </v-icon>
                          </v-btn>
                        </v-list-item-action>
                      </v-list-item>
                      <v-divider
                        v-if="i + 1 < tab.content.length"
                        :key="`divider_${i}`"
                      ></v-divider>
                    </template>
                  </v-list>
                </v-card-text>
                <v-spacer class="flex-grow-1" />
                <v-card-actions>
                  <v-pagination
                    v-model="page"
                    :length="activeTabPaginationLength"
                    class=""
                  />
                </v-card-actions>
              </template>
              <template v-else-if="tab.name === 'sent' && tab.content.length > 0">
                <v-list >
                  <template v-for="(item, i) in tab.content">
                    <v-list-item
                      :key="i"
                    >
                      <v-list-item-content
                        @click="select(item)"
                        class="cursor-pointer"
                        two-line
                      >
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
                <v-spacer />
                <v-pagination
                  v-model="remotePage"
                  :length="sentTabPaginationLength"
                  @input="fetchRemoteSubmissions"
                />
              </template>
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
      <!-- :group="submission.meta.group.id"
      @submit="() => submit(submission)"
      @set-group="(val) => $set(submission.meta.group, 'id', val)" -->
    <confirm-submission-dialog
      v-if="confirmSubmissionIsVisible"
      :group="activeSubmission.meta.group.id"
      @set-group="(val) => setSubmissionGroup(activeSubmissionId, val)"
      v-model="confirmSubmissionIsVisible"
      @submit="() => submit(activeSubmissionId)"
    />
  </v-container>
</template>

<script>
import moment from 'moment';
import api from '@/services/api.service';
// TODO: figure out why there is an import cycle from submissions.strore > router
// eslint-disable-next-line import/no-cycle
import { types as submissionsTypes } from '@/store/modules/submissions.store';
import ConfirmSubmissionDialog from '@/components/survey/drafts/ConfirmSubmissionDialog.vue';


const PAGINATION_LIMIT = 10;

export default {
  components: {
    ConfirmSubmissionDialog,
  },
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
      confirmSubmissionIsVisible: false,
      activeSubmissionId: null,
    };
  },
  updated() {
    this.$store.dispatch('appui/setTitle', 'My Submissions');
  },
  async created() {
    // await this.$store.dispatch(`submissions/${submissionsTypes.actions.fetchLocalSubmissions}`);

    // await this.$store.dispatch('surveys/fetchSurveys');
    // await this.$store.dispatch('readyToSubmit/getAll');

    await Promise.all([
      this.$store.dispatch('submissions/fetchLocalSubmissions'),
      this.$store.dispatch('surveys/fetchSurveys'),
      // this.$store.dispatch('readyToSubmit/getAll'),
    ]);
  },
  beforeDestroy() {
    this.$store.dispatch('appui/reset');
  },
  computed: {
    activeSubmission() {
      return this.$store.getters.submissions.getSubmission(this.activeSubmissionId);
    },
    readyToSubmit() {
      // return this.$store.state.readyToSubmit.readyToSubmit || [];
      return this.$store.getters['submissions/readyToSubmit'];
    },
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
    getSubmission(id) {
      return this.$store.getters.submissions.getSubmission(id);
    },
    readyToSubmitHas(id) {
      return this.readyToSubmit.indexOf(id) > -1;
    },
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
    async uploadSubmission(submission) {
      const response = await api.post('/submissions', submission);
    },
    setSubmissionGroup(id, groupId) {
      // this.$store.commit('');
      console.log('set submission group');
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
