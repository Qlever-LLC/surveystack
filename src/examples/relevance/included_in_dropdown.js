/**
 * Example showing to check if an item is included
 * in a dropdown question
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
  return submission.data.planting_group.crop.value.includes('corn');
}
