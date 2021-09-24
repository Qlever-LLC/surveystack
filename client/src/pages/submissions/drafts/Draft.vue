<template>
  <div style="height:100%; max-height:100%">
    <div class="d-flex flex-column-reverse flex-md-row" v-if="!loading && !hasError">
      <div class="d-flex flex-column flex-item-left">
        <app-navbar :positionSticky="true" />
        <app-draft-component
          class="flex-item-left"
          :survey="survey"
          :submission="submission"
          :persist="true"
          @submit="submit"
          @setImage="setImage"
        />
      </div>

      <image-container
        class="flex-item-right"
        :imageDesktop="imageSet[selectedImageSetId].desktop"
        :imageMobile="imageSet[selectedImageSetId].mobile"
        :imageFallbackColor="imageSet[selectedImageSetId].fallbackColor"
      />
      <!-- uses css to set background image, or maybe <img srcset={} /> -->
    </div>
    <div v-else-if="loading && !hasError" class="d-flex align-center justify-center" style="height: 100%">
      <v-progress-circular :size="50" color="primary" indeterminate />
    </div>
    <div v-else-if="hasError" class="text-center mt-8">
      Error Loading Draft Submission or Survey
    </div>

    <confirm-leave-dialog ref="confirmLeaveDialog" title="Confirm Exit Draft" v-if="submission && survey">
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
      @close="onCloseResultDialog"
    />
  </div>
</template>

<script>
import appNavbar from '@/components/Navbar.vue';
import api from '@/services/api.service';
import appMixin from '@/components/mixin/appComponent.mixin';
import * as db from '@/store/db';
import resultMixin from '@/components/ui/ResultsMixin';

import appDraftComponent from '@/components/survey/drafts/DraftComponent.vue';
import resultDialog from '@/components/ui/ResultDialog.vue';
import ConfirmLeaveDialog from '@/components/shared/ConfirmLeaveDialog.vue';
import SubmittingDialog from '@/components/shared/SubmittingDialog.vue';
import appSubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';
import imageContainer from '@/components/survey/drafts/ImageContainer';

export default {
  mixins: [appMixin, resultMixin],
  components: {
    appNavbar,
    appDraftComponent,
    resultDialog,
    ConfirmLeaveDialog,
    SubmittingDialog,
    appSubmissionArchiveDialog,
    imageContainer,
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
      // each question will have imageSet defined
      imageSet: [
        //src: https://www.responsivebreakpoints.com/
        {
          desktop: 'https://res.cloudinary.com/responsivebreakpoints/image/upload/c_scale,w_1400/v1451080425/dog.jpg',
          mobile: 'https://res.cloudinary.com/responsivebreakpoints/image/upload/c_scale,w_591/v1451080425/dog.jpg',
          fallbackColor: '#ff0000',
        },
        {
          desktop:
            'https://res.cloudinary.com/responsivebreakpoints/image/upload/c_scale,w_1400/v1452003467/woman_glasses.jpg',
          mobile:
            'https://res.cloudinary.com/responsivebreakpoints/image/upload/c_scale,w_590/v1452003467/woman_glasses.jpg',
          fallbackColor: '#ff0000',
        },
        {
          desktop:
            'https://res.cloudinary.com/responsivebreakpoints/image/upload/c_scale,w_1400/v1451071843/castle.jpg',
          mobile: 'https://res.cloudinary.com/responsivebreakpoints/image/upload/c_scale,w_503/v1451071843/castle.jpg',
          fallbackColor: '#ff0000',
        },
        {
          desktop: 'https://res.cloudinary.com/responsivebreakpoints/image/upload/c_scale,w_1400/v1453714657/robot.png',
          mobile: 'https://res.cloudinary.com/responsivebreakpoints/image/upload/c_scale,w_540/v1453714657/robot.png',
          fallbackColor: '#ff0000',
        },
      ],
      selectedImageSetId: 0,
      /*
      // example survey def
      {
        resources: [
          {
            type: 'IMAGE_REMOTE',
            id: 'asdf12345',
            value: 'http://placekitten.com/700/700',
          },
          // ....
        ]
        revisions: [
          controls: [
            // ....
            { // example question object
              type: 'number',
              options: {
                //imageSet: 'asdf12345', // resource id, defined at survey definition top level
                imageSet: {
                  desktop: 'asdf12345',
                  mobile: 'asdf12346',
                  fallbackColor: '#ff0000',
                }
              }
            },
            // ...
          ]
        ]
      }


      */
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
    setImage() {
      const id = parseInt(Math.random() * 100) % this.imageSet.length;
      this.selectedImageSetId = id;
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
      this.submitting = true;
      this.submission.meta.status = this.addReadyToSubmit(this.submission.meta.status || []);

      let message;
      try {
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

    this.survey = await this.$store.dispatch('surveys/fetchSurvey', this.submission.meta.survey.id);
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

<style scoped>
.flex-item-left {
  flex: 100%;
  padding: 0px;
}

.flex-item-right {
  height: 25vh;
  margin: 56px 0px 0px;
}

@media (min-width: 960px) {
  .flex-item-right,
  .flex-item-left {
    flex: 50%;
  }
  .flex-item-left {
    height: 100vh;
  }
  .flex-item-right {
    margin: 0px;
    height: 100vh;
  }
}
</style>
