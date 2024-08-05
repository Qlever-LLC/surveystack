import { useStore } from 'vuex';

export function useSubmission() {
  const store = useStore();

  async function getSurvey(submission) {
    let survey = store.getters['surveys/getSurvey'](submission.meta.survey.id);
    if (!survey) {
      //not found in the local store, fetch the survey from backend
      console.warn('fetching survey name of survey id ' + submission.meta.survey.id);
      survey = await store.dispatch('surveys/fetchSurveyFromBackendAndStore', { id: submission.meta.survey.id });
    }

    return survey;
  }

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

  return {
    setSurveyNames,
  };
}
