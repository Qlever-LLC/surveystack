<template>
  <div style="height: 100%; max-height: 100%">
    <app-draft-component
      v-if="!loading && !hasError"
      :survey="survey"
      :submission="submission"
      :persist="true"
      @submit="submit"
    />
    <div v-else-if="loading && !hasError" class="d-flex align-center justify-center" style="height: 100%">
      <v-progress-circular :size="50" color="primary" indeterminate />
    </div>
    <div v-else-if="hasError" class="text-center mt-8">
      Error Loading Draft Submission or Survey. Click <a @click="$router.back()">here</a> to go back to Survey.
    </div>

    <confirm-leave-dialog v-if="submission && survey" ref="confirmLeaveDialog" :submission="submission" />

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
      title="Result of Submission"
      :survey="survey"
      :submission="submission"
      :items="resultItems"
      :to="
        survey && {
          name: 'surveys-detail',
          params: { id: survey._id },
          query: { minimal_ui: $route.query.minimal_ui },
        }
      "
      persistent
      @close="onCloseResultDialog"
    />

    <result-dialog
      v-model="showApiComposeErrors"
      title="ApiCompose Errors"
      :survey="survey"
      :submission="submission"
      :items="apiComposeErrors"
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
import ConfirmLeaveDialog from '@/components/survey/drafts/ConfirmLeaveDialog.vue';
import SubmittingDialog from '@/components/shared/SubmittingDialog.vue';
import appSubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';
import { uploadFileResources } from '@/utils/resources';
import { getApiComposeErrors } from '@/utils/draft';
import { createSubmissionFromSurvey } from '@/utils/submissions';
import { defaultsDeep, get } from 'lodash';
import * as db from '@/store/db';

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
      showResubmissionDialog: false,
      apiComposeErrors: [],
      showApiComposeErrors: false,
    };
  },
  methods: {
    abortEditSubmitted() {
      this.$store.dispatch('mySubmissions/remove', this.submission._id);
      // TODO: should we remove the router guard in this situation? otherwise it pops up a modal asking if the user
      // is sure they want to leave. User can click 'cancel' when prompted whether they want to "Confirm editing submitted",
      // which deleted the submission from the store, then when prompted whether they want to leave the current draft
      // they can also click cancel, which may cause an error
      this.$router.push({ name: 'my-submissions-list' });
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

        // Delete draft after submit
        await this.$store.dispatch('submissions/deleteDrafts', [payload._id]);

        this.result({ response });
        this.isSubmitted = true;
        await this.$store.dispatch('mySubmissions/remove', this.submission._id);
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
    const { id } = this.$route.params;

    this.submission = await this.$store.dispatch('submissions/getDraft', id);
    if (!this.submission) {
      console.log('Error: submission not found');
      this.hasError = true;
      this.loading = false;
      return;
    }

    if (get(this.submission, 'meta.dateSubmitted', false)) {
      this.showResubmissionDialog = true;
    }

    this.survey = await this.$store.dispatch('surveys/fetchSurvey', {
      id: this.submission.meta.survey.id,
      version: this.submission.meta.survey.version,
    });
    const cleanSubmission = createSubmissionFromSurvey({
      survey: this.survey,
      version: this.submission.meta.survey.version,
    });
    // initialize data in case anything is missing from data
    defaultsDeep(this.submission.data, cleanSubmission.data);

    if (!this.survey) {
      console.log('Error: survey not found');
      this.hasError = true;
    }

    // Set proxy header if resubmit by proxy or admin.
    // Otherwise, remove it
    if (this.submission.meta.submitAsUser) {
      api.setHeader('x-delegate-to', this.submission.meta.submitAsUser._id);
    } else {
      api.removeHeader('x-delegate-to');
    }

    this.loading = false;
  },
  beforeRouteLeave(to, from, next) {
    if (this.submission && this.survey && !this.isSubmitted && !this.hasError) {
      this.$refs.confirmLeaveDialog.open(next);
      return;
    }

    api.removeHeader('x-delegate-to');

    next(true);
  },
};
</script>
