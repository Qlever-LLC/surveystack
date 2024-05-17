import { useStore } from 'vuex';
import { computed } from 'vue';
import { uploadFileResources } from '@/utils/resources';
import api from '@/services/api.service';

export function useSubmission() {
  const store = useStore();

  async function setSurveyNames(submissions) {
    for (let submission of submissions) {
      if (!submission.meta.survey.name) {
        const survey = await getSurvey(submission);
        if (survey) {
          submission.meta.survey.name = survey.name;
        }
      }
    }
    return submissions;
  }

  async function getSurvey(submission) {
    let survey = store.getters['surveys/getSurvey'](submission.meta.survey.id);
    if (!survey) {
      //not found in the local store, fetch the survey from backend
      console.warn('fetching survey name of survey id ' + submission.meta.survey.id);
      survey = await store.dispatch('surveys/fetchSurvey', { id: submission.meta.survey.id });
    }

    return survey;
  }

  async function getDrafts(groupId, limit = undefined) {
    let rawDrafts = await store.dispatch('submissions/fetchLocalSubmissions');
    rawDrafts = rawDrafts.filter((d) => d.meta.group?.id === groupId);
    rawDrafts = sortSubmissions(rawDrafts);
    if (limit) {
      rawDrafts = rawDrafts.slice(0, limit);
    }
    rawDrafts = await setSurveyNames(rawDrafts);
    return rawDrafts;
  }

  function sortSubmissions(submissions) {
    return [...submissions].sort(
      (a, b) => new Date(b.meta.dateModified).valueOf() - new Date(a.meta.dateModified).valueOf()
    );
  }

  function isDraftReadyToSubmit(id) {
    return getDraftsReadyToSubmit().indexOf(id) > -1;
  }

  function getDraftsReadyToSubmit() {
    return store.getters['submissions/readyToSubmit'];
  }

  async function uploadSubmission(submission) {
    const survey = await getSurvey(submission);
    await uploadFileResources(store, survey, submission, true);
    const response = submission.meta.dateSubmitted
      ? await api.put(`/submissions/${submission._id}`, submission)
      : await api.post('/submissions', submission);
    await store.dispatch('submissions/remove', submission._id);
    return response;
  }

  return {
    setSurveyNames,
    getSurvey,
    getDrafts,
    isDraftReadyToSubmit,
    getDraftsReadyToSubmit,
    uploadSubmission,
  };
}
