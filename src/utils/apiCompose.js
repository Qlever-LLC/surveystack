const defaultApiCompose = `
/**
 * ApiCompose
 *
 * @param {submission} submission
 */
function apiCompose(submission) {

  const crop = submission.data.planting_group.crop.value;
  const farmUrl = submission.data.planting_group.field.value.url;
  const area = submission.data.planting_group.field.value.fieldId;
  const date = submission.data.planting_group.planting_date.value;
  const method = "seeding";

  const farmosRequest = {
    type: 'farmos',
  }

  farmosRequest.body = {
    type: 'planting',
    farmUrl,
    crop,
    area,
    date,
    method
  }
  
  return farmosRequest;
}
`;

export {
  defaultApiCompose,
};
