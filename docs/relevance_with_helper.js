/**
 *
 * @param {submission} submission
*/
function relevance(submission) {
  if (includesAndAnswered(submission.data.sample_source, 'farm')) {
    return true;
  }
  return false;
}

function isAnsweredAndEquals(answer, value) {
  if (answer.value === null) {
    return false;
  }
  if (answer.value.includes(value)) {
    return true;
  }
  return false;
}

function includesAndAnswered(answer, value) {
  if (answer.value === null) {
    return false;
  }
  if (answer.value.includes(value)) {
    return true;
  }
  return false;
}
