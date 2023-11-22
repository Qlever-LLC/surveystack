<template>
  <div class="background wrapper">
    <v-container>
      <a-row class="my-2">
        <a-spacer />
        <v-btn color="primary" v-if="activeTab !== 'sent' && readyToSubmit.length" @click="handleSubmitCompleted">
          Submit Completed
          <a-icon class="ml-2">mdi-cloud-upload-outline</a-icon>
        </v-btn>
      </a-row>
      <a-row class="d-flex flex-grow-1">
        <a-tabs v-model="activeTab" centered icons-and-text grow @change="updateActiveTab">
          <a-tab href="#drafts" class="background">
            <span class="d-flex flex-row align-center font-weight-regular">
              <a-icon class="mr-2">mdi-file-document-edit</a-icon>Drafts
            </span>
          </a-tab>
          <a-tab href="#sent" class="background">
            <span class="d-flex flex-row align-center font-weight-regular">
              <a-icon class="mr-2">mdi-email-check</a-icon>Sent
            </span>
          </a-tab>
        </a-tabs>
        <a-window v-model="activeTab" class="flex-grow-1" v-if="!isLoading">
          <a-window-item
            v-for="tab in tabs"
            :key="tab.name"
            :value="tab.name"
            class="flex-grow-1 flex-column align-center justify-center align-content-center"
          >
            <!-- -->
            <v-card class="d-flex flex-column justify-space-between background">
              <template v-if="tab.name !== 'sent' && activeTabPageContent.length > 0">
                <template v-for="(item, i) in activeTabPageContent">
                  <a-list-item :key="i">
                    <v-list-item-content @click="select(item)" class="cursor-pointer" two-line>
                      <v-card :elevation="3" class="py-3 px-4">
                        <a-list-item-title class="text-h6 mb-2 font-weight-bold" v-if="item.meta.survey.name">
                          {{ item.meta.survey.name }}
                        </a-list-item-title>
                        <a-list-item-title class="font-weight-regular" v-else> Loading name </a-list-item-title>
                        <a-list-item-subtitle class="font-weight-regular mt-2">
                          ID: {{ item._id }}
                        </a-list-item-subtitle>
                        <a-list-item-subtitle class="font-weight-regular mt-2">
                          {{ new Date(item.meta.dateCreated).toLocaleString() }}
                        </a-list-item-subtitle>
                      </v-card>
                    </v-list-item-content>
                    <a-list-item-action>
                      <a-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <v-btn
                            v-if="readyToSubmitHas(item._id)"
                            icon
                            @click="() => handleSubmitClick(item._id)"
                            v-on="on"
                          >
                            <a-icon> mdi-cloud-upload-outline </a-icon>
                          </v-btn>
                        </template>
                        <span>Upload Submission</span>
                      </a-tooltip>
                    </a-list-item-action>
                  </a-list-item>
                </template>

                <a-spacer class="flex-grow-1" />
                <v-card-actions>
                  <v-pagination v-model="page" :length="activeTabPaginationLength" color="grey darken-1" />
                </v-card-actions>
              </template>
              <div v-else-if="tab.name !== 'sent' && activeTabPageContent.length < 0">
                <a-row align="center" justify="center">
                  <v-col>
                    <a-alert color="primary" class="black-text" text>No Drafts</a-alert>
                  </v-col>
                </a-row>
              </div>

              <template v-else-if="tab.name === 'sent' && tab.content.length > 0">
                <template v-for="(item, i) in tab.content">
                  <a-list-item :key="i">
                    <v-list-item-content @click="select(item)" class="cursor-pointer" two-line>
                      <v-card :elevation="3" class="py-3 px-4">
                        <a-list-item-title class="text-h6 mb-2 font-weight-bold" v-if="item.meta.survey.name">
                          {{ item.meta.survey.name }}
                        </a-list-item-title>
                        <a-list-item-title class="font-weight-regular" v-else> Loading name </a-list-item-title>
                        <a-list-item-subtitle class="font-weight-regular mt-2">
                          ID: {{ item._id }}
                        </a-list-item-subtitle>
                        <a-list-item-subtitle class="font-weight-regular mt-2">
                          {{ new Date(item.meta.dateCreated).toLocaleString() }}
                        </a-list-item-subtitle>
                      </v-card>
                    </v-list-item-content>
                  </a-list-item>
                </template>
                <v-pagination
                  v-model="remotePage"
                  :length="sentTabPaginationLength"
                  @input="fetchRemoteSubmissions"
                  color="grey darken-1"
                />
              </template>
              <div v-else>
                <a-row align="center" justify="center">
                  <v-col>
                    <a-alert color="primary" class="black-text" text>No Submissions</a-alert>
                  </v-col>
                </a-row>
              </div>
            </v-card>
          </a-window-item>
        </a-window>
        <v-card v-else>
          <v-card-text class="d-flex align-center justify-center">
            <a-progress-circular :size="50" color="primary" indeterminate />
          </v-card-text>
        </v-card>
      </a-row>
      <confirm-submission-dialog
        ref="confirm-submission-dialog"
        v-if="confirmSubmissionIsVisible"
        @set-group="(val) => setSubmissionGroup(activeSubmissionId, val)"
        :groupId="activeSubmission.meta.group.id"
        :id="activeSubmissionId"
        :submitAsUser="activeSubmission.meta.submitAsUser"
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
import api from '@/services/api.service';
// TODO: figure out why there is an import cycle from submissions.strore > router
// eslint-disable-next-line import/no-cycle
import ConfirmSubmissionDialog from '@/components/survey/drafts/ConfirmSubmissionDialog.vue';
import SubmittingDialog from '@/components/shared/SubmittingDialog.vue';
import ResultMixin from '@/components/ui/ResultsMixin';
import ResultDialog from '@/components/ui/ResultDialog.vue';
import { uploadFileResources } from '@/utils/resources';

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
      localSubmissions: [],
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
    let submissions = await this.$store.dispatch('submissions/fetchLocalSubmissions');
    submissions = this.sortSubmissions(submissions);
    this.localSubmissions = await this.setSurveyNames(submissions);
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
          content: this.localSubmissions,
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
        const survey = await this.getSurvey(submission);
        await uploadFileResources(this.$store, survey, submission, true);
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

        //load survey names where required
        await this.setSurveyNames(this.remoteSubmissions);
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
    async setSurveyNames(submissions) {
      for (let submission of submissions) {
        if (!submission.meta.survey.name) {
          const survey = await this.getSurvey(submission);
          if (survey) {
            submission.meta.survey.name = survey.name;
          }
        }
      }
      return submissions;
    },
    async getSurvey(submission) {
      let survey = this.$store.getters['surveys/getSurvey'](submission.meta.survey.id);
      if (!survey) {
        //not found in the local store, fetch the survey from backend
        console.warn('fetching survey name of survey id ' + submission.meta.survey.id);
        survey = await this.$store.dispatch('surveys/fetchSurvey', { id: submission.meta.survey.id });
      }

      return survey;
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
