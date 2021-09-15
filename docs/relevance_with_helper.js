/**
 *
 * @param {submission} submission
*/
function relevance(submission) {
  if (isAnsweredAndEquals(submission.data.sample_source, 'farm')) {
    return true;
  }
  return false;
}

function isAnsweredAndEquals(answer, value) {
  if (answer.value === null) {
    return false;
  }
  if (answer.value === value) {
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
