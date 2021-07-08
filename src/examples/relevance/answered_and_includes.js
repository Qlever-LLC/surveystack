/**
 * Example showing to check if question is answered
 * an item is included in a dropdown question
 *
 * Note: assume crops is a dropdown question
 */

/**
 * Relevance
 *
 * Return true if corn is selected
 *
 * planting_group > crop > corn
 *
 * @param {submission} submission
 */
function relevance(submission) {
  return (
    submission.data.planting_group.crop.value !== null && submission.data.planting_group.crop.value.includes('corn')
  );
  // ALTERNATIVE with helper function
  // return answeredAndIncludes(submission.data.planting_group.crop);
}

/**
 * Helper function to call instead
 */
function answeredAndIncludes(question) {
  return question.value !== null && question.value.includes('corn');
}
