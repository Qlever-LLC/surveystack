

/**
 *
 * @param {submission} submission
*/
function relevance(submission) {
  if (includesAndAnswered(submission.data.land_prep_method, 'tillage')) {
    return true;
  }

  if (includesAndAnswered(submission.data.covercrop.termination_method, 'tillage')) {
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
