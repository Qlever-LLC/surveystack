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

export function requestSetRenderQueue(queue) {
  const [origin] = window.location.ancestorOrigins;
  window.parent.postMessage({
    type: 'REQUEST_SET_QUESTION_RENDER_QUEUE',
    payload: {
      queue,
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

export function resetDOM() {
  const root = document.querySelector('#root');
  root.innerHTML = '';
}


export function runScript(props, state, process, render) {
  const nextState = process(props, state);
  if (nextState.context) {
    requestSetContext(nextState.context);
  }
  if (nextState.value) {
    requestSetValue(nextState.value);
  }
  if (nextState.status) {
    requestSetStatus(nextState.status);
  }
  if (nextState.ui && nextState.ui.renderQueue) {
    window.log('renderQueue', nextState.ui.renderQueue.map(f => String(f)));
    requestSetRenderQueue(nextState.ui.renderQueue.map(f => String(f)));
    // TODO: add listener on parent for requestSetRenderQueue
    // TODO: pass createUI(renderQueue) into render function
    // TODO: how to store and rehydrate renderQueue? could store as string and eval()? or maybe function constructor
  }
  renderScript(props, nextState, process, render);
}

// lets us define `const setState = update(props, process, render)` which allows user to call
// `setState` in their scripts
export const update = (props, process, render) => (state) => {
  runScript(props, state, process, render);
};

/**
 *
 */
export function renderScript(props, state, process, render) {
  const root = document.querySelector('#root');
  root.innerHTML = '';
  root.appendChild(
    render(props, state, update(props, process, render)),
  );
}


export function createUI(queue = []) {
  return {
    renderQueue: queue,
    enqueue(...items) {
      this.renderQueue = [...this.renderQueue, ...items];
      return this.renderQueue;
    },
    dequeue() {
      const [item, ...rest] = this.renderQueue;
      this.renderQueue = rest;
      return item;
    },
    executeRenderQueue() {
      return this.renderQueue.map(item => item());
    },
    plot(x, y) {
      const node = document.createElement('div');
      node.className = 'plot';
      node.style.border = '1px solid red';
      node.style.borderLeftColor = 'black';
      node.style.borderBottomColor = 'black';
      node.innerHTML = 'plot <br/> x <br/> o';
      return node;
    },
    info(message) {
      const node = document.createElement('div');
      node.className = 'info';
      node.style.border = '1px solid blue';
      node.innerHTML = message;
      return node;
    },
    addPlot(x, y) {
      return this.enqueue(() => this.plot(x, y));
    },
    addInfo(message) {
      // TODO: figure out how to make this store actual values passed in, instead of variable name when stringified
      return this.enqueue(() => this.info(message));
    },
  };
}
