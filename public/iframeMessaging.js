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

export function requestSetStatus({ type, message = '' }) {
  const [origin] = window.location.ancestorOrigins;
  window.parent.postMessage({
    type: 'REQUEST_SET_QUESTION_STATUS',
    payload: {
      type,
      message,
    },
  }, origin);
}

export function requestSetContext(context) {
  const [origin] = window.location.ancestorOrigins;
  window.parent.postMessage({
    type: 'REQUEST_SET_QUESTION_CONTEXT',
    payload: {
      context,
    },
  }, origin);
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

  // return new Promise((resolve, reject) => {
  //   window.addEventListener('message', (event) => {
  //     if (!event.data || !event.data.type || event.data.type !== 'RETURN_SET_QUESTION_VALUE') {
  //       return;
  //     }
  //     if (event.data && event.data.type && event.data.type === 'RETURN_SET_QUESTION_VALUE') {
  //       resolve(event.data.payload);
  //     }
  //   });
  // });
}

export function requestLogMessage(...messages) {
  const [origin] = window.location.ancestorOrigins;
  window.parent.postMessage({
    type: 'REQUEST_LOG_MESSAGE',
    payload: {
      messages,
    },
  }, origin);
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

export function handleLoaded() {
  window.parent.postMessage({
    type: 'SCRIPT_HAS_LOADED',
    payload: {},
  }, window.location.ancestorOrigins[0]);
}

export const statusTypes = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  WARNING: 'WARNING',
};

export function h(tag, attributes, ...children) {
  const el = document.createElement(tag);
  Object.entries(attributes).forEach(([k, v]) => {
    if (k === 'class') {
      el.className = v;
    } else {
      el.setAttribute(k, v);
    }
  });
  children.forEach((child) => {
    el.append(child);
  });
  return el;
}


// export function setState(state) {

// }

// export function setState({
//   context = {},
//   value = null,
// }) {
//   // state.context = context;
//   // state.value = value;
//   const nextState = {
//     ...state,
//     context,
//     value,
//   };
//   // Trigger render(process(state))
//   // log('running setState');
//   runScript(props, nextState);
// }


export function runScript(props, state, process, render) {
  // log('runScript');
  // log('setState', JSON.stringify(typeof setState));
  const {
    context,
    value,
    status,
  } = process(props, state);
  if (context) {
    requestSetContext(context);
    state.context = context;
  }
  if (value) {
    requestSetValue(value);
    state.value = value;
  }
  if (status) {
    requestSetStatus(status);
  }
  renderScript(props, state, process, render);
}


// in iframe we can define `const setState = reprocess(props)`
export const update = (props, process, render) => (state) => {
  const nextState = { ...state };
  runScript(props, nextState, process, render);
};

export function renderScript(props, state, process, render) {
  const root = document.querySelector('#root');
  root.innerHTML = '';
  window.log('typeof setstate', typeof update(props));
  root.appendChild(render(props, {
    context: state.context,
    value: state.value,
    submission: state.submission,
    setState: update(props, process, render),
  }));
}
