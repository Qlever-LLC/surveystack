import { fetchSurvey } from '@/components/survey/survey';

export function useSubmission() {
  async function setSurveyNames(submissions) {
    for (let submission of submissions) {
      if (!submission.meta.survey.name) {
        const survey = await fetchSurvey({ id: submission.meta.survey.id });
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
