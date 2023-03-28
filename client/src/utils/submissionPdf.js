import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import dateFnsFormat from 'date-fns/format';

function formatDate(date, format = 'MMM d, yyyy h:mm a') {
  const parsedDate = parseISO(date);
  return isValid(parsedDate) && parsedDate.toISOString() === date ? dateFnsFormat(parsedDate, format) : date;
}

export default class SubmissionPDF {
  constructor(survey, submission) {
    this.survey = survey;
    this.submission = submission;
    this.disabled = !this.survey || !this.submission;
  }

  filename() {
    if (this.disabled) {
      return `${this.survey.name} - SurveyStack report`;
    }

    const { dateSubmitted, dateModified, dateCreated } = this.submission.meta;
    const date = dateSubmitted || dateModified || dateCreated || new Date().toISOString();

    return `${this.survey.name}-${this.submission._id.toString().slice(-6)}-${formatDate(date, 'yyyy-MM-dd')}`;
  }
}
