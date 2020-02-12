export const types = {

};

export function requestFetchSubmissions() {
  let origin;

  try {
    [origin] = window.location.ancestorOrigins;
  } catch (error) {
    // origin = 'https://app.our-sci.net';
  }

  window.parent.postMessage({
    type: 'REQUEST_FETCH_SUBMISSION',
    payload: {
      // ids,
      // sharecodeIds,
    },
  }, origin);

  return new Promise((resolve, reject) => {
    window.addEventListener('message', (event) => {
      if (
        !event.data
        || !event.data.type
        || event.data.type !== 'RETURN_FETCH_SUBMISSION'
      ) {
        return;
      }
      if (
        event.data
        && event.data.type
        && event.data.type === 'RETURN_FETCH_SUBMISSION'
      ) {
        resolve(event.data.payload);
      }
    });
  });
}

export function requestSetValue(value) {
  let origin;

  try {
    [origin] = window.location.ancestorOrigins;
  } catch (error) {
    // origin = 'https://app.our-sci.net';
  }

  window.parent.postMessage({
    type: 'REQUEST_SET_QUESTION_VALUE',
    payload: {
      value,
    },
  }, origin);

  return new Promise((resolve, reject) => {
    window.addEventListener('message', (event) => {
      if (!event.data || !event.data.type || event.data.type !== 'RETURN_SET_QUESTION_VALUE') {
        return;
      }
      if (event.data && event.data.type && event.data.type === 'RETURN_SET_QUESTION_VALUE') {
        resolve(event.data.payload);
      }
    });
  });
}

export function listen() {
  window.addEventListener('message', (event) => {
    // if (event.data && event.data.type && event.data.type === 'RESET_SCRIPT') {

    // }

    // if (event.data && event.data.type && event.data.type === 'RUN_SCRIPT') {

    // }
  });
}


// TODO: validate origin, pass as arg
export function onMessage(type, callback) {
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type && event.data.type === type) {
      callback(event.data.payload);
    }
  });
}
