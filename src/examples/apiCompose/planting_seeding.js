/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable no-throw-literal */


/*
Simple example to demonstrate how to create a planting on farmos.

The survey needs at least
    1. One Question to pick a FarmOS field
    2. One Question for the planting date
    3. One Question for the crop

On Farmos a vocabulary entry for the crop will be created of not
already existing.

Also either a 'transplanting' or 'seeding' log will be created for
the planting.

The ID of the planting will be stored in a submission wide variable
$PLANTING and will be accessible in logs within other apiCompose functions.


The structure to send to the surveystack-server looks like this:

{
  "type": "farmos",
  "farmosType": "planting",
  "url": "ourscitest.farmos.net",
  "body": {
    "crop": "potato",
    "area": "8",
    "date": "2020-04-02T00:00:00.000+02:00"
  },
  "method": "farm_transplanting"
}


The apiCompose function is the entry point to code in.
Other functions may be called within.

However, we are in a sandbox here, so no requests
outside are possible.

*/

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

  request.body.method = 'farm_transplanting';

  return request;
}


/**
   * Helper function to populate the request
   * @param {*} fieldAnswer answer for the farmos field Question
   * @param {*} dateAnswer answer for the planting date question
   * @param {*} cropAnswer answer for the planting crop question
   */

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
      method: 'seeding',
    },
  };
}
