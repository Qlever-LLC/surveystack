<template>
  <div class="background wrapper">
    <v-container>
      <v-row class="my-2">
        <v-spacer />
        <v-btn color="primary" v-if="activeTab !== 'sent' && readyToSubmit.length" @click="handleSubmitCompleted">
          Submit Completed
          <v-icon class="ml-2">mdi-cloud-upload-outline</v-icon>
        </v-btn>
      </v-row>
      <v-row class="d-flex flex-grow-1">
        <v-tabs flat v-model="activeTab" centered icons-and-text grow @change="updateActiveTab">
          <v-tab v-for="tab in tabs" :key="tab.name" :href="`#${tab.name}`" class="background">
            <span class="d-flex flex-row align-center font-weight-regular">
              <v-icon class="mr-2">{{ tab.icon }}</v-icon
              >{{ tab.title }}
            </span>
          </v-tab>
        </v-tabs>
        <v-tabs-items v-model="activeTab" class="flex-grow-1" v-if="!isLoading">
          <v-tab-item
            v-for="tab in tabs"
            :key="tab.name"
            :value="tab.name"
            class="flex-grow-1 flex-column align-center justify-center align-content-center"
          >
            <!-- -->
            <v-card class="d-flex flex-column justify-space-between background">
              <template v-if="tab.name !== 'sent' && activeTabPageContent.length > 0">
                <template v-for="(item, i) in activeTabPageContent">
                  <v-list-item :key="i">
                    <v-list-item-content @click="select(item)" class="cursor-pointer" two-line>
                      <v-card :elevation="3" class="py-3 px-4">
                        <v-list-item-title class="text-h6 mb-2 font-weight-bold" v-if="surveyForSubmission(item)">
                          {{ surveyForSubmission(item).name }}
                        </v-list-item-title>
                        <v-list-item-title class="font-weight-regular" v-else> Loading name </v-list-item-title>
                        <v-list-item-subtitle class="font-weight-regular mt-2">
                          ID: {{ item._id }}
                        </v-list-item-subtitle>
                        <v-list-item-subtitle class="font-weight-regular mt-2">
                          {{ new Date(item.meta.dateCreated).toLocaleString() }}
                        </v-list-item-subtitle>
                      </v-card>
                    </v-list-item-content>
                    <v-list-item-action>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <v-btn
                            v-if="readyToSubmitHas(item._id)"
                            icon
                            @click="() => handleSubmitClick(item._id)"
                            v-on="on"
                          >
                            <v-icon> mdi-cloud-upload-outline </v-icon>
                          </v-btn>
                        </template>
                        <span>Upload Submission</span>
                      </v-tooltip>
                    </v-list-item-action>
                  </v-list-item>
                </template>

                <v-spacer class="flex-grow-1" />
                <v-card-actions>
                  <v-pagination v-model="page" :length="activeTabPaginationLength" color="grey darken-1" />
                </v-card-actions>
              </template>
              <div v-else-if="tab.name !== 'sent' && activeTabPageContent.length < 0">
                <v-row align="center" justify="center">
                  <v-col>
                    <v-alert color="primary" class="black-text" text>No Drafts</v-alert>
                  </v-col>
                </v-row>
              </div>

              <template v-else-if="tab.name === 'sent' && tab.content.length > 0">
                <template v-for="(item, i) in tab.content">
                  <v-list-item :key="i">
                    <v-list-item-content @click="select(item)" class="cursor-pointer" two-line>
                      <v-card :elevation="3" class="py-3 px-4">
                        <v-list-item-title class="text-h6 mb-2 font-weight-bold" v-if="surveyForSubmission(item)">
                          {{ surveyForSubmission(item).name }}
                        </v-list-item-title>
                        <v-list-item-title class="font-weight-regular" v-else> Loading name </v-list-item-title>
                        <v-list-item-subtitle class="font-weight-regular mt-2">
                          ID: {{ item._id }}
                        </v-list-item-subtitle>
                        <v-list-item-subtitle class="font-weight-regular mt-2">
                          {{ new Date(item.meta.dateCreated).toLocaleString() }}
                        </v-list-item-subtitle>
                      </v-card>
                    </v-list-item-content>
                  </v-list-item>
                </template>
                <v-pagination
                  v-model="remotePage"
                  :length="sentTabPaginationLength"
                  @input="fetchRemoteSubmissions"
                  color="grey darken-1"
                />
              </template>
              <div v-else>
                <v-row align="center" justify="center">
                  <v-col>
                    <v-alert color="primary" class="black-text" text>No Submissions</v-alert>
                  </v-col>
                </v-row>
              </div>
            </v-card>
          </v-tab-item>
        </v-tabs-items>
        <v-card v-else>
          <v-card-text class="d-flex align-center justify-center">
            <v-progress-circular :size="50" color="primary" indeterminate />
          </v-card-text>
        </v-card>
      </v-row>
      <confirm-submission-dialog
        ref="confirm-submission-dialog"
        v-if="confirmSubmissionIsVisible"
        @set-group="(val) => setSubmissionGroup(activeSubmissionId, val)"
        :groupId="activeSubmission.meta.group.id"
        :id="activeSubmissionId"
        :dateSubmitted="activeSubmission.meta.dateSubmitted"
        v-model="confirmSubmissionIsVisible"
        @close="handleConfirmSubmissionDialogClose"
        @submit="() => uploadSubmission(activeSubmission)"
      />
      <submitting-dialog v-model="this.isSubmitting" />
      <result-dialog
        v-model="showResult"
        :items="resultItems"
        @input="handleResultDialogInput"
        title="Result of Submission"
        persistent
      />
    </v-container>
  </div>
</template>

<script>
import moment from 'moment';
import api from '@/services/api.service';
// TODO: figure out why there is an import cycle from submissions.strore > router
// eslint-disable-next-line import/no-cycle
import { types as submissionsTypes } from '@/store/modules/submissions.store';
import ConfirmSubmissionDialog from '@/components/survey/drafts/ConfirmSubmissionDialog.vue';
import SubmittingDialog from '@/components/shared/SubmittingDialog.vue';
import ResultMixin from '@/components/ui/ResultsMixin';
import ResultDialog from '@/components/ui/ResultDialog.vue';

const PAGINATION_LIMIT = 10;

export default {
  mixins: [ResultMixin],
  components: {
    ConfirmSubmissionDialog,
    SubmittingDialog,
    ResultDialog,
  },
  watch: {
    activeSubmissionId(id) {
      this.activeSubmission = this.$store.getters['submissions/getSubmission'](id);
    },
  },
  data() {
    return {
      isSubmitting: false,
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
      activeSubmission: null,
      uploadQueue: [],
    };
  },
  updated() {
    this.$store.dispatch('appui/setTitle', 'My Submissions');
  },
  async created() {
    await Promise.all([
      this.$store.dispatch('submissions/fetchLocalSubmissions'),
      this.$store.dispatch('surveys/fetchSurveys'),
      this.$store.dispatch('resources/fetchLocalResources'),
    ]);
  },
  beforeDestroy() {
    this.$store.dispatch('appui/reset');
  },
  computed: {
    // activeSubmission() {
    //   // return this.$store.getters['submissions/getSubmission'](this.activeSubmissionId);
    //   return this.$store.state.submissions.submissions
    //     .find(({ _id }) => this.activeSubmissionId === _id);
    // },
    readyToSubmit() {
      // return this.$store.state.readyToSubmit.readyToSubmit || [];
      return this.$store.getters['submissions/readyToSubmit'];
    },
    activeTabBody() {
      return this.tabs.find((t) => t.name === this.activeTab);
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
    handleSubmitCompleted() {
      this.uploadQueue = [...this.readyToSubmit];
      this.uploadQueueNext();
    },
    async uploadSubmission(submission) {
      this.isSubmitting = true;
      try {
        const response = submission.meta.dateSubmitted
          ? await api.put(`/submissions/${submission._id}`, submission)
          : await api.post('/submissions', submission);
        await this.$store.dispatch('submissions/remove', submission._id);
        this.result({ response });
      } catch (err) {
        console.log('Draft submit error:', err);
      } finally {
        this.isSubmitting = false;
      }
    },
    handleSubmitClick(id) {
      this.activeSubmissionId = id;
      this.confirmSubmissionIsVisible = true;
    },
    handleConfirmSubmissionDialogClose({ done }) {
      this.activeSubmissionId = null;
      if (done) {
        this.uploadQueueNext();
      }
    },
    handleResultDialogInput(val) {
      if (!val) {
        // Closing result dialog
        this.uploadQueueNext();
      }
    },
    uploadQueueNext() {
      if (this.uploadQueue.length > 0) {
        this.activeSubmissionId = this.uploadQueue.shift() || null;
        this.confirmSubmissionIsVisible = true;
      }
    },
    getSubmission(id) {
      return this.$store.getters['submissions/getSubmission'](id);
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
      return this.$store.state.surveys.surveys.find((survey) => survey._id === submission.meta.survey.id);
    },
    async select(draft) {
      console.log('select', draft._id, this.getSubmission(draft._id));
      if (!this.getSubmission(draft._id)) {
        // TODO: should we persist this submission to IDB? not doing it for now
        // If we don't persist submission to IDB then it will throw an error if the user tries to refresh the page
        // But by not persisting it to IDB, we're preventing the user from creating drafts unnecessarily
        // The draft will be persisted anyways as soon as the user makes any edits to the submission.

        // TODO: if implementation changes here, also adapt @/pages/submissions/List.vue's 'resubmit' method
        await this.$store.dispatch('submissions/fetchRemoteSubmission', draft._id);
      }
      this.$router.push(`/submissions/drafts/${draft._id}`);
    },
    sortSubmissions(submissions) {
      return [...submissions].sort(
        (a, b) => new Date(b.meta.dateModified).valueOf() - new Date(a.meta.dateModified).valueOf()
      );
    },
    async setSubmissionGroup(id, groupId) {
      await this.$store.dispatch('submissions/update', {
        // ...submission,
        ...this.activeSubmission,
        meta: {
          // ...submission.meta,
          ...this.activeSubmission.meta,
          group: {
            id: groupId,
            path: null,
          },
        },
      });
      this.activeSubmission = this.$store.getters['submissions/getSubmission'](this.activeSubmissionId);
    },
  },
};
</script>

<style scoped>
.wrapper {
  height: 100%;
}
.cursor-pointer {
  cursor: pointer;
}
.v-tabs-items,
.v-tab-item {
  height: 100%;
}
.v-list-item,
.v-list-item {
  padding: 0 0;
}
</style>
