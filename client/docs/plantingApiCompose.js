/* eslint-disable no-throw-literal */
/**
 * ApiCompose
 *
 * @param {submission} submission
 */
function apiCompose(submission) {
  if (!submission.data.planting_group.field.value) {
    throw 'Please select a field';
  }

  const crop = submission.data.planting_group.crop.value;
  const farmUrl = submission.data.planting_group.field.value.url;
  const area = submission.data.planting_group.field.value.id;
  const date = submission.data.planting_group.planting_date.value;

  const farmosRequest = {
    type: 'farmos',
    farmosType: 'planting',
  };

  farmosRequest.url = farmUrl;

  farmosRequest.body = {
    crop,
    area,
    date,
  };

  return farmosRequest;
}
