<template>
  <div style="height: 100%; max-height: 100%">
    <app-draft-component
      v-if="!loading && !hasError"
      :survey="survey"
      :submission="submission"
      :persist="!isResubmission()"
      @submit="submit"
    />
    <div v-else-if="loading && !hasError" class="d-flex align-center justify-center" style="height: 100%">
      <v-progress-circular :size="50" color="primary" indeterminate />
    </div>
    <div v-else-if="hasError" class="text-center mt-8">
      {{ errorMessage }} <router-link :to="`/surveys/${$route.params.surveyId}`">Back to survey.</router-link>
    </div>

    <confirm-leave-dialog ref="confirmLeaveDialog" title="Confirm Exit Draft" v-if="submission && survey">
      <p class="font-weight-bold" v-if="isResubmission()">
        Drafts are not saved when resubmitting a submission. Any changes will be lost if you leave.
      </p>
      Are you sure you want to exit this draft?
    </confirm-leave-dialog>

    <app-submission-archive-dialog
      v-if="submission && survey"
      v-model="showResubmissionDialog"
      maxWidth="50rem"
      labelConfirm="Edit anyway"
      @cancel="abortEditSubmitted"
      @confirm="(reason) => (submission.meta.archivedReason = reason)"
      reason="RESUBMIT"
      persistent
    >
      <template v-slot:title>Confirm Submission Edit</template>
      <template>
        This draft has previously been submitted. Are you sure you want to edit it? Submitting again will archive the
        original submission.
      </template>
    </app-submission-archive-dialog>

    <submitting-dialog v-model="submitting" />
    <result-dialog
      v-model="showResult"
      :items="resultItems"
      title="Result of Submission"
      persistent
      :to="
        survey && {
          name: 'surveys-detail',
          params: { id: survey._id },
          query: { minimal_ui: $route.query.minimal_ui },
        }
      "
      :survey="survey"
      :submission="submission"
      @close="onCloseResultDialog"
    />

    <result-dialog
      v-model="showApiComposeErrors"
      :items="apiComposeErrors"
      title="ApiCompose Errors"
      :survey="survey"
      :submission="submission"
      @close="showApiComposeErrors = false"
    />
  </div>
</template>

<script>
import api from '@/services/api.service';
import appMixin from '@/components/mixin/appComponent.mixin';
import resultMixin from '@/components/ui/ResultsMixin';
import appDraftComponent from '@/components/survey/drafts/DraftComponent.vue';
import resultDialog from '@/components/ui/ResultDialog.vue';
import ConfirmLeaveDialog from '@/components/shared/ConfirmLeaveDialog.vue';
import SubmittingDialog from '@/components/shared/SubmittingDialog.vue';
import appSubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';
import { uploadFileResources } from '@/utils/resources';
import { getApiComposeErrors } from '@/utils/draft';
import { createSubmissionFromSurvey, checkAllowedToSubmit, checkAllowedToResubmit } from '@/utils/submissions';
import { autoSelectActiveGroup } from '@/utils/memberships';
import * as db from '@/store/db';
import defaultsDeep from 'lodash/defaultsDeep';
import { ARCHIVE_REASONS } from '@/constants';

export default {
  mixins: [appMixin, resultMixin],
  components: {
    appDraftComponent,
    resultDialog,
    ConfirmLeaveDialog,
    SubmittingDialog,
    appSubmissionArchiveDialog,
  },
  data() {
    return {
      submission: null,
      survey: null,
      loading: false,
      submitting: false,
      isSubmitted: false,
      hasError: false,
      errorMessage: '',
      showResubmissionDialog: false,
      apiComposeErrors: [],
      showApiComposeErrors: false,
    };
  },
  methods: {
    isResubmission() {
      return this.submission && this.submission.meta && this.submission.meta.dateSubmitted;
    },
    isProxySubmission() {
      return this.submission && this.submission.meta && this.submission.meta.submitAsUser;
    },
    abortEditSubmitted() {
      this.$store.dispatch('submissions/remove', this.submission._id);
      // TODO: should we remove the router guard in this situation? otherwise it pops up a modal asking if the user
      // is sure they want to leave. User can click 'cancel' when prompted whether they want to "Confirm editing submitted",
      // which deleted the submission from the store, then when prompted whether they want to leave the current draft
      // they can also click cancel, which may cause an error
      this.$router.push({ name: 'my-submissions' });
    },
    addReadyToSubmit(status) {
      return [
        ...status.filter(({ type }) => type !== 'READY_TO_SUBMIT'),
        {
          type: 'READY_TO_SUBMIT',
          value: {
            at: new Date().toISOString(),
          },
        },
      ];
    },
    onCloseResultDialog() {
      // send message to parent iframe that submission was completed
      const message = this.isSubmitted
        ? {
            type: 'SUBMISSION_RESULT_SUCCESS_CLOSE',
            payload: { submissionId: this.submission._id },
          }
        : {
            type: 'SUBMISSION_RESULT_ERROR_CLOSE',
            payload: {},
          };
      window.parent.postMessage(message, '*');
    },
    async submit({ payload }) {
      this.apiComposeErrors = getApiComposeErrors(this.survey, payload);
      if (this.apiComposeErrors.length > 0) {
        this.showApiComposeErrors = true;
        return;
      }

      this.submitting = true;
      this.submission.meta.status = this.addReadyToSubmit(this.submission.meta.status || []);

      let message;
      try {
        await uploadFileResources(this.$store, this.survey, payload, true);
        const response = payload.meta.dateSubmitted
          ? await api.put(`/submissions/${payload._id}`, payload)
          : await api.post('/submissions', payload);
        this.result({ response });
        this.isSubmitted = true;
        await this.$store.dispatch('submissions/remove', this.submission._id);
        message = {
          type: 'SUBMISSION_SUBMIT_SUCCESS',
          payload: { submissionId: this.submission._id },
        };
      } catch (error) {
        console.log('Draft submit error:', error);
        await db.persistSubmission(this.submission);
        this.result({ error });
        message = {
          type: 'SUBMISSION_SUBMIT_ERROR',
          payload: {},
        };
      } finally {
        this.submitting = false;
        // Sent message to parent frame that Submission succeeded or failed
        window.parent.postMessage(message, '*');
      }
    },
  },
  async created() {
    this.loading = true;
    const { surveyId } = this.$route.params;

    try {
      this.survey = (await api.get(`/surveys/${surveyId}?version=latest`)).data;
    } catch (error) {
      this.hasError = true;
      this.errorMessage = 'Survey not found.';
      this.loading = false;
      return;
    }
    const isLoginRequired = this.survey.meta.submissions === 'user' || this.survey.meta.submissions === 'group';
    if (isLoginRequired && !this.$store.getters['auth/isLoggedIn']) {
      this.$router.push({
        name: 'auth-login',
        params: { redirect: this.$route.path, autoJoin: true },
      });
      return;
    }

    const surveyResourcesLoaded = this.survey.resources
      ? this.$store.dispatch('resources/fetchResources', this.survey.resources)
      : Promise.resolve();

    const user = this.$store.getters['auth/user'];
    try {
      await this.$store.dispatch('memberships/getUserMemberships', user._id);
    } catch (error) {
      this.hasError = true;
      this.errorMessage = 'Error fetching user memberships. Please refresh to try again.';
      this.loading = false;
      return;
    }

    const allowedToSubmit = checkAllowedToSubmit(
      this.survey,
      this.$store.getters['auth/isLoggedIn'],
      this.$store.getters['memberships/groups']
    );
    if (!allowedToSubmit.allowed) {
      this.hasError = true;
      this.errorMessage = allowedToSubmit.message;
      this.loading = false;
      return;
    }

    // If the user is on the new-submission route, initialize a new submission and then redirect to the edit-submission route for that submission
    if (this.$route.name === 'new-submission') {
      const { group, submitAsUserId } = this.$route.query;
      if (group) {
        // see analysis in https://gitlab.com/our-sci/software/surveystack/-/merge_requests/230#note_1286909610
        await autoSelectActiveGroup(this.$store, group);
      }

      const createSubmissionConfig = { survey: this.survey, version: this.survey.latestVersion };
      if (submitAsUserId) {
        try {
          const { data: submitAsUser } = await api.get(`/users/${submitAsUserId}`);
          createSubmissionConfig.submitAsUser = submitAsUser;
        } catch (error) {
          this.hasError = true;
          this.errorMessage = 'Error fetching user to submit as. Please refresh to try again.';
          this.loading = false;
          return;
        }
      }

      this.submission = createSubmissionFromSurvey(createSubmissionConfig);
      this.$router.replace({ name: 'edit-submission', params: { surveyId, submissionId: this.submission._id } });
    } else if (this.$route.name === 'edit-submission') {
      const { submissionId } = this.$route.params;
      await this.$store.dispatch('submissions/fetchLocalSubmissions');
      const localSubmission = this.$store.getters['submissions/getSubmission'](submissionId);
      if (localSubmission) {
        this.submission = localSubmission;
      } else {
        let remoteSubmission;
        try {
          remoteSubmission = await this.$store.dispatch('submissions/fetchRemoteSubmission', submissionId);
        } catch (error) {
          // Swallow this error for now. This case is handled below where we set a 'Submission not found.' error message if there is no submission.
        }
        if (remoteSubmission) {
          this.submission = remoteSubmission;
        }
      }
      if (!this.submission) {
        this.hasError = true;
        this.errorMessage = 'Submission not found.';
        this.loading = false;
        return;
      }
    }

    if (this.isResubmission()) {
      const allowedToResubmit = checkAllowedToResubmit(
        this.submission,
        this.$store.getters['memberships/memberships'],
        user._id
      );
      if (!allowedToResubmit) {
        this.hasError = true;
        this.errorMessage = 'You are not allowed to edit this submission.';
        this.loading = false;
        return;
      }

      const editSubmissionReason = this.$route.query.reason;
      if (editSubmissionReason && ARCHIVE_REASONS.includes(editSubmissionReason)) {
        this.submission.meta.archivedReason = editSubmissionReason;
      } else {
        this.showResubmissionDialog = true;
      }
    }

    if (this.survey.latestVersion !== this.submission.meta.survey.version) {
      try {
        this.survey = await this.$store.dispatch('surveys/fetchSurvey', {
          id: this.submission.meta.survey.id,
          version: this.submission.meta.survey.version,
        });
      } catch (error) {
        this.hasError = true;
        this.errorMessage = 'Survey not found.';
        this.loading = false;
        return;
      }
    }

    const cleanSubmission = createSubmissionFromSurvey({
      survey: this.survey,
      version: this.submission.meta.survey.version,
    });
    // initialize data in case anything is missing from data
    defaultsDeep(this.submission.data, cleanSubmission.data);

    // Set proxy header if resubmit by proxy or admin.
    // Otherwise, remove it
    if (this.isProxySubmission()) {
      api.setHeader('x-delegate-to', this.submission.meta.submitAsUser._id);
    } else {
      api.removeHeader('x-delegate-to');
    }

    await surveyResourcesLoaded;
    this.loading = false;
  },
  beforeRouteLeave(to, from, next) {
    if (from.name === 'new-submission' && to.name === 'edit-submission') {
      // This is a programmatic navigation that doesn't leave this component (the two routes share this component)
      // We don't need the confirm leave dialog in this case.
      return next(true);
    }

    if (this.submission && this.survey && !this.isSubmitted && !this.hasError) {
      this.$refs.confirmLeaveDialog.open(next);
      return;
    }

    api.removeHeader('x-delegate-to');

    next(true);
  },
};
</script>
