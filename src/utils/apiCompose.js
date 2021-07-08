const defaultApiCompose = `
/* eslint-disable */

/**
 * ApiCompose
 *
 * @param {submission} submission
 * @param {survey} survey
 * @param {parent} parent
 */
function apiCompose(submission, survey, parent) {
  const request = populatePlanting(
    submission.data.crop,
    submission.data.field,
  );

  return request;
}


/**
 * Helper function to populate the request
 * @param {*} cropAnswer answer for the planting crop question
 */

function populatePlanting(cropAnswer, field) {
  if (!cropAnswer.value) {
    throw 'Please select crop';
  }

  if (!field.value) {
    throw 'Please select field';
  }


  const crop = cropAnswer.value;
  const farmUrl = field.value.url;


  return {
    type: 'farmos',
    farmosType: 'asset',
    url: farmUrl,
    body: {
      name: crop
      type: 'planting',
      crop: [{ name: crop }], // crop name
    },
  };
}



/*
Simple example to demonstrate how to create a planting on farmos.

The survey needs one Question for the crop.

On Farmos a vocabulary entry for the crop will be created of not
already existing.

The ID of the planting will be stored in a submission wide variable
$PLANTING and will be accessible in logs within other apiCompose functions.


The structure to send to the surveystack-server looks like this:

{
  "type": "farmos",
  "farmosType": "planting",
  "url": "ourscitest.farmos.net",
  "body": {
    "crop": "potato",
}


The apiCompose function is the entry point to code in.
Other functions may be called within.

However, we are in a sandbox here, so no requests
outside are possible.

use log() to log to console below
*/
`;

export { defaultApiCompose };
