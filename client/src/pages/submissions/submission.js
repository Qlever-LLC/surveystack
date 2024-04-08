import { useStore } from 'vuex';

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

  return {
    setSurveyNames,
    getSurvey,
  };
}
