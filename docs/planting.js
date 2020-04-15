/* eslint-disable no-throw-literal */

function populatePlanting(fieldAnswer, dateAnswer, cropAnswer) {
  if (!fieldAnswer.value || !fieldAnswer.value.fieldId) {
    throw 'Please select a field';
  }

  if (!cropAnswer.value) {
    throw 'Please select crop';
  }

  if (!dateAnswer.value) {
    throw 'Please select a date';
  }

  const crop = cropAnswer.value;
  const farmUrl = fieldAnswer.value.url;
  const area = fieldAnswer.value.fieldId;
  const date = dateAnswer.value;

  return {
    type: 'farmos',
    farmosType: 'planting',
    url: farmUrl,
    body: {
      crop,
      area,
      date,
    },
  };
}

/**
 * ApiCompose
 *
 * @param {submission} submission
 */
function apiCompose(submission) {
  const request = populatePlanting(
    submission.data.planting.farmos_field,
    submission.data.planting.date,
    submission.data.planting.crop,
  );

  request.method = 'farm_transplanting';

  return request;
}
