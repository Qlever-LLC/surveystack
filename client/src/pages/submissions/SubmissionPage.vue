<template>
  <div class="rounded basicListContainer" style="height: 100%; max-height: 100%">
    <app-draft-component
      v-if="!state.loading && !state.hasError"
      :survey="state.survey"
      :submission="state.submission"
      :persist="!isResubmission() && !isProxySubmission()"
      @submit="submit" />
    <div v-else-if="state.loading && !state.hasError" class="d-flex align-center justify-center" style="height: 100%">
      <a-progress-circular :size="50" />
    </div>
    <div v-else-if="state.hasError" class="text-center mt-8">
      {{ state.errorMessage }}
      <router-link :to="`/groups/${id}/surveys`">Back to survey list</router-link>
    </div>

    <confirm-leave-dialog ref="confirmLeaveDialogRef" title="Confirm Exit Draft" v-if="state.submission && state.survey">
      <p class="font-weight-bold" v-if="isResubmission()">
        Drafts are not saved when resubmitting a submission. Any changes will be lost if you leave.
      </p>
      <p class="font-weight-bold" v-if="isProxySubmission()">
        Drafts are not saved when submitting as another user. Any changes will be lost if you leave.
      </p>
      Are you sure you want to exit this draft?
    </confirm-leave-dialog>

    <app-submission-archive-dialog
      v-if="state.submission && state.survey"
      v-model="state.showResubmissionDialog"
      maxWidth="50rem"
      labelConfirm="Edit anyway"
      @cancel="abortEditSubmitted"
      @confirm="(reason) => (state.submission.meta.archivedReason = reason)"
      reason="RESUBMIT"
      persistent>
      <template v-slot:title>Confirm Submission Edit</template>
      <template>
        This draft has previously been submitted. Are you sure you want to edit it? Submitting again will archive the
        original submission.
      </template>
    </app-submission-archive-dialog>

    <submitting-dialog v-model="state.submitting" />
    <result-dialog
      v-model="showResult"
      :items="resultItems"
      title="Result of Submission"
      persistent
      :to="
        state.survey && {
          name: 'group-my-submissions',
          params: { id },
          query: { minimal_ui: route.query.minimal_ui },
        }
      "
      :survey="state.survey"
      :submission="state.submission"
      @close="onCloseResultDialog" />

    <result-dialog
      v-model="state.showApiComposeErrors"
      :items="state.apiComposeErrors"
      title="ApiCompose Errors"
      :survey="state.survey"
      :submission="state.submission"
      @close="state.showApiComposeErrors = false" />
  </div>
</template>

<script>
import { watch, defineComponent, reactive, toRaw, ref } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useQueryClient } from '@tanstack/vue-query';
import api from '@/services/api.service';
import appDraftComponent from '@/components/survey/drafts/DraftComponent.vue';
import resultDialog from '@/components/ui/ResultDialog.vue';
import ConfirmLeaveDialog from '@/components/shared/ConfirmLeaveDialog.vue';
import SubmittingDialog from '@/components/shared/SubmittingDialog.vue';
import appSubmissionArchiveDialog from '@/components/survey/drafts/SubmissionArchiveDialog.vue';
import { uploadFileResources } from '@/utils/resources';
import { getApiComposeErrors } from '@/utils/draft';
import { createSubmissionFromSurvey, checkAllowedToSubmit, checkAllowedToResubmit } from '@/utils/submissions';
import * as db from '@/store/db';
import defaultsDeep from 'lodash/defaultsDeep';
import { ARCHIVE_REASONS } from '@/constants';
import { useAllDrafts, useSyncDrafts } from '../../queries';
import { useResults } from '../../components/ui/results';

export default defineComponent({
  components: {
    appDraftComponent,
    resultDialog,
    ConfirmLeaveDialog,
    SubmittingDialog,
    appSubmissionArchiveDialog,
  },
  props: {
    routeAction: {
      required: true,
      type: String, // 'new' or 'edit'
    },
    submissionId: {
      required: false,
      type: String,
    },
    surveyId: {
      required: true,
      type: String,
    },
    submitAsUserId: {
      required: false,
      type: String,
    },
    id: { // group id from route
      required: true,
      type: String,
    },
  },
  setup(props) {
    const {
      showResult,
      resultItems,
      result,
      reset: resetResults,
    } = useResults();
    const router = useRouter();
    const route = useRoute();
    const store = useStore();
    const confirmLeaveDialogRef = ref();
    const queryClient = useQueryClient();

    const initialState = {
      submission: null,
      survey: null,
      loading: true,
      submitting: false,
      isSubmitted: false,
      hasError: false,
      errorMessage: '',
      showResubmissionDialog: false,
      apiComposeErrors: [],
      showApiComposeErrors: false,
    };
    const state = reactive({ ...initialState });
    const { isPending: allDraftsIsPending, data: allDraftsData, isError: allDraftsIsError } = useAllDrafts();
    const { mutate: syncDrafts } = useSyncDrafts();

    const resetComponentState = () => {
      Object.assign(state, initialState);
      resetResults();
    };

    watch(
      [() => props.submissionId, () => props.routeAction],
      ([newSubmissionId, newRouteAction], [oldSubmissionId, oldRouteAction]) => {
        const isNavigatingFromEditToNew = oldRouteAction === 'edit' && newRouteAction === 'new';
        const isNavigatingToNewSubmissionId = oldRouteAction === 'edit' &&
          newRouteAction === 'edit' &&
          oldSubmissionId !== newSubmissionId;
        const submissionChanged = isNavigatingFromEditToNew || isNavigatingToNewSubmissionId;
        if (submissionChanged) {
          resetComponentState();
          init();
        }
      },
    );

    const handleLeave = (next) => (isLeaving) => {
      if (isLeaving) {
        syncDrafts();
      }
      next(isLeaving);
    }
    onBeforeRouteUpdate((to, from, next) => {
      if (state.submission && state.survey && !state.isSubmitted && !state.hasError) {
        confirmLeaveDialogRef.value.open(handleLeave(next));
        return;
      }
      api.removeHeader('x-delegate-to');
      next(true);
    });
    onBeforeRouteLeave((to, from, next) => {
      if (from.name === 'group-survey-submissions-new' && to.name === 'group-survey-submissions-edit') {
        // This is a programmatic navigation that doesn't leave this component (the two routes share this component)
        // We don't need the confirm leave dialog in this case.
        return next(true);
      }

      if (state.submission && state.survey && !state.isSubmitted && !state.hasError) {
        confirmLeaveDialogRef.value.open(handleLeave(next));
        return;
      }
      api.removeHeader('x-delegate-to');
      next(true);
    });

    function isResubmission() {
      return state.submission.meta.isDraft === false && state.submission?.meta?.dateSubmitted;
    };
    function isProxySubmission() {
      return state.submission && state.submission.meta && state.submission.meta.submitAsUser;
    };
    function abortEditSubmitted() {
      router.push(`/groups/${props.id}/my-submissions`);
    };
    function addReadyToSubmit(status) {
      return [
        ...status.filter(({ type }) => type !== 'READY_TO_SUBMIT'),
        {
          type: 'READY_TO_SUBMIT',
          value: {
            at: new Date().toISOString(),
          },
        },
      ];
    };
    function onCloseResultDialog() {
      // send message to parent iframe that submission was completed
      const message = state.isSubmitted
        ? {
            type: 'SUBMISSION_RESULT_SUCCESS_CLOSE',
            payload: { submissionId: state.submission._id },
          }
        : {
            type: 'SUBMISSION_RESULT_ERROR_CLOSE',
            payload: {},
          };
      window.parent.postMessage(message, '*');
    };
    async function submit({ payload }) {
      state.apiComposeErrors = getApiComposeErrors(state.survey, payload);
      if (state.apiComposeErrors.length > 0) {
        state.showApiComposeErrors = true;
        return;
      }

      state.submitting = true;
      state.submission.meta.status = addReadyToSubmit(state.submission.meta.status || []);

      let message;
      try {
        await uploadFileResources(store, state.survey, payload, true);
        const response = isResubmission()
          ? await api.put(`/submissions/${payload._id}`, payload)
          : await api.post('/submissions', payload);
        result({ response });
        state.isSubmitted = true;
        await db.deleteSubmission(state.submission._id);
        queryClient.invalidateQueries({ queryKey: ['localDrafts'] });
        queryClient.invalidateQueries({ queryKey: ['remoteDrafts'] });
        message = {
          type: 'SUBMISSION_SUBMIT_SUCCESS',
          payload: { submissionId: state.submission._id },
        };
      } catch (error) {
        console.log('Draft submit error:', error);
        await db.persistSubmission(state.submission);
        queryClient.invalidateQueries({ queryKey: ['localDrafts'] });
        result({ error });
        message = {
          type: 'SUBMISSION_SUBMIT_ERROR',
          payload: {},
        };
      } finally {
        state.submitting = false;
        // Sent message to parent frame that Submission succeeded or failed
        window.parent.postMessage(message, '*');
      }
    };
    async function init() {
      state.loading = true;

      try {
        state.survey = (await api.get(`/surveys/${props.surveyId}?version=latest`)).data;
      } catch (error) {
        state.hasError = true;
        state.errorMessage = 'Survey not found.';
        state.loading = false;
        return;
      }
      const isLoginRequired = state.survey.meta.submissions === 'user' || state.survey.meta.submissions === 'group';
      if (isLoginRequired && !store.getters['auth/isLoggedIn']) {
        router.push({
          name: 'auth-login',
          query: { redirect: route.path, autoJoin: true },
        });
        return;
      }

      const surveyResourcesLoaded = state.survey.resources
        ? store.dispatch('resources/fetchResources', state.survey.resources)
        : Promise.resolve();

      const user = store.getters['auth/user'];
      try {
        await store.dispatch('memberships/getUserMemberships', user._id);
      } catch (error) {
        state.hasError = true;
        state.errorMessage = 'Error fetching user memberships. Please refresh to try again.';
        state.loading = false;
        return;
      }

      const allowedToSubmit = checkAllowedToSubmit(
        state.survey,
        store.getters['auth/isLoggedIn'],
        store.getters['memberships/groups']
      );
      if (!allowedToSubmit.allowed) {
        state.hasError = true;
        state.errorMessage = allowedToSubmit.message;
        state.loading = false;
        return;
      }

      // If the user is on the group-survey-submissions-new route, initialize a new submission and then redirect to the group-survey-submissions-edit route for that submission
      if (route.name === 'group-survey-submissions-new') {
        const createSubmissionConfig = { survey: state.survey, version: state.survey.latestVersion };
        if (props.submitAsUserId) {
          try {
            const { data: submitAsUser } = await api.get(`/users/${props.submitAsUserId}`);
            createSubmissionConfig.submitAsUser = submitAsUser;
          } catch (error) {
            state.hasError = true;
            state.errorMessage = 'Error fetching user to submit as. Please refresh to try again.';
            state.loading = false;
            return;
          }
        }
        state.submission = createSubmissionFromSurvey(createSubmissionConfig);
        await router.replace({
          name: 'group-survey-submissions-edit',
          params: { submissionId: state.submission._id },
        });
      } else if (route.name === 'group-survey-submissions-edit') {
        const allDraftsReady = new Promise((resolve, reject) => {
          watch(
            allDraftsIsPending,
            (newValue, oldValue) => {
              if (newValue === false) {
                resolve(); 
              }
            },
            { immediate: true }
          );
        });
        const remoteSubmissionReady = api.get(`/submissions/${props.submissionId}?pure=1`);
        const [
          allDraftsReadySettled,
          remoteSubmissionReadySettled,
        ] = await Promise.allSettled([
          allDraftsReady,
          remoteSubmissionReady,
        ]);
        if (remoteSubmissionReadySettled.status === 'fulfilled') {
          state.submission = remoteSubmissionReadySettled.value.data;
        } else {
          state.submission = toRaw(allDraftsData.value.find(draft => draft._id === props.submissionId));
        }

        if (!state.submission) {
          state.hasError = true;
          state.errorMessage = 'Submission not found.';
          state.loading = false;
          return;
        }
      }

      if (isResubmission()) {
        const allowedToResubmit = checkAllowedToResubmit(
          state.submission,
          store.getters['memberships/memberships'],
          user._id
        );
        if (!allowedToResubmit) {
          state.hasError = true;
          state.errorMessage = 'You are not allowed to edit this submission.';
          state.loading = false;
          return;
        }

        const editSubmissionReason = route.query.reason;
        if (editSubmissionReason && ARCHIVE_REASONS.includes(editSubmissionReason)) {
          state.submission.meta.archivedReason = editSubmissionReason;
        } else {
          state.showResubmissionDialog = true;
        }
      }

      if (state.survey.latestVersion !== state.submission.meta.survey.version) {
        try {
          state.survey = await store.dispatch('surveys/fetchSurvey', {
            id: state.submission.meta.survey.id,
            version: state.submission.meta.survey.version,
          });
        } catch (error) {
          state.hasError = true;
          state.errorMessage = 'Survey not found.';
          state.loading = false;
          return;
        }
      }

      const cleanSubmission = createSubmissionFromSurvey({
        survey: state.survey,
        version: state.submission.meta.survey.version,
      });
      // initialize data in case anything is missing from data
      defaultsDeep(state.submission.data, cleanSubmission.data);

      // Set proxy header if resubmit by proxy or admin.
      // Otherwise, remove it
      if (isProxySubmission()) {
        api.setHeader('x-delegate-to', state.submission.meta.submitAsUser._id);
      } else {
        api.removeHeader('x-delegate-to');
      }

      await surveyResourcesLoaded;
      state.loading = false;
    };

    init();

    return {
      showResult,
      resultItems,
      result,
      state,
      isResubmission,
      isProxySubmission,
      abortEditSubmitted,
      addReadyToSubmit,
      onCloseResultDialog,
      submit,
      route,
      confirmLeaveDialogRef,
    };
  }
});
</script>
