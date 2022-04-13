/* eslint-disable */
export const uuidv4 = () => {
  const rnd = new Uint8Array(32);
  crypto.getRandomValues(rnd);
  let count = 0;
  const u = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = rnd[count++] % 16;

    if (c === 'x') {
      return r.toString(16);
    }
    return ((r & 0x3) | 0x8).toString(16);
  });
  return `${u}.${new Date().getTime().toString(16)}`;
};

/**
 * ApiCompose
 *
 * @param {submission} submission
 */
function apiCompose(submission) {
  const request = populatePlanting(submission.data.crop, submission.data.field);

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

  /**
   * The server checks if the name already exists. If not,
   * the server creates the appropriate taxonomy first.
   */
  const terms = {
    Chioggia: {
      type: 'taxonomy_term--plant_type',
      name: 'Chioggia',
      id: uuidv4(),
    },
  };

  return {
    type: 'farmos',
    url: farmUrl,
    terms,
    body: {
      id,
      type: 'asset--plant',
      attributes: {
        name: 'Test plant Asset',
        status: 'active',
        geometry: '',
      },
      relationships: {
        plant_type: {
          data: [
            terms['Chioggia'], // server will go and check if exists
          ],
        },
      },
    },
  };
}
