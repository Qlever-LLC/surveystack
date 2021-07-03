
<template>
  <div style="height: 100%; max-height: 100%;">
    <app-draft-component
      v-if="!loading && !hasError"
      :survey="survey"
      :submission="submission"
      :persist="true"
      @submit="submit"
    />
    <div
      v-else-if="loading && !hasError"
      class="d-flex align-center justify-center"
      style="height: 100%"
    >
      <v-progress-circular
        :size="50"
        color="primary"
        indeterminate
      />
    </div>
    <div
      v-else-if="hasError"
      class="text-center mt-8"
    >
      Error Loading Draft Submission or Survey
    </div>

    <confirm-leave-dialog
      ref="confirmLeaveDialog"
      title="Confirm Exit Draft"
      v-if="submission && survey"
    >
      Are you sure you want to exit this draft?
    </confirm-leave-dialog>

    <app-submission-archive-dialog
      v-if="submission && survey"
      v-model="showResubmissionDialog"
      maxWidth="50rem"
      labelConfirm="Edit anyway"
      @cancel="abortEditSubmitted"
      @confirm="(reason) => submission.meta.archivedReason = reason"
      reason="RESUBMIT"
      persistent
    >
      <template v-slot:title>Confirm Submission Edit</template>
      <template>
        This draft has previously been submitted. Are you sure you want to edit it?
        Submitting again will archive the original submission.
      </template>
    </app-submission-archive-dialog>

    <submitting-dialog v-model="submitting" />
    <result-dialog
      v-model="showResult"
      :items="resultItems"
      title="Result of Submission"
      persistent
      :to="survey && {name: 'surveys-detail', params: { id: survey._id }}"
      @close="onCloseResultDialog"
    />
  </div>

</template>


<script>
import api from '@/services/api.service';
import appMixin from '@/components/mixin/appComponent.mixin';
import * as db from '@/store/db';
import resultMixin from '@/components/ui/ResultsMixin';


import appDraftComponent from '@/components/survey/drafts/DraftComponent.vue';
import resultDialog from '@/components/ui/ResultDialog.vue';
import ConfirmLeaveDialog from '@/components/shared/ConfirmLeaveDialog.vue';
import SubmittingDialog from '@/components/shared/SubmittingDialog.vue';
import appSubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';


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
    };
  },
  methods: {
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
      window.parent.postMessage({
        type: 'SUBMISSION_RESULT_CLOSE',
        payload: {
          isSubmitted: this.isSubmitted,
          submission: this.submission,
          submissionId: this.submission._id,
        },
      }, '*');
    },
    async submit({ payload }) {
      this.submitting = true;
      this.submission.meta.status = this.addReadyToSubmit(this.submission.meta.status || []);

      try {
        const response = payload.meta.dateSubmitted
          ? await api.put(`/submissions/${payload._id}`, payload)
          : await api.post('/submissions', payload);
        this.result({ response });
        this.isSubmitted = true;
        await this.$store.dispatch('submissions/remove', this.submission._id);
      } catch (error) {
        console.log('Draft submit error:', error);
        await db.persistSubmission(this.submission);
        this.result({ error });
      } finally {
        this.submitting = false;
      }
    },
  },
  async created() {
    this.loading = true;

    // // console.log(window.parent);
    // window.setInterval(() => {
    //   console.log(window.parent.postessage);
    //   const something = window.parent.postMessage('ping', '*');
    //   console.log('-', something);
    // }, 2000);

    const { id } = this.$route.params;

    try {
      this.submission = await this.$store.dispatch('submissions/fetchLocalSubmission', id);
    } catch (error) {
      console.log('Error: submssion not found');
      this.hasError = true;
      this.loading = false;

      return;
    }
    if (!this.submission) {
      console.log('Error: submssion not found');
      this.hasError = true;
      this.loading = false;
      return;
    }

    if (this.submission && this.submission.meta && this.submission.meta.dateSubmitted) {
      this.showResubmissionDialog = true;
    }

    this.survey = await this.$store.dispatch(
      'surveys/fetchSurvey',
      this.submission.meta.survey.id,
    );
    if (!this.survey) {
      console.log('Error: survey not found');
    }

    this.loading = false;
  },
  beforeRouteLeave(to, from, next) {
    if (this.submission && this.survey && !this.isSubmitted) {
      this.$refs.confirmLeaveDialog.open(next);
      return;
    }
    next(true);
  },

};
</script>
