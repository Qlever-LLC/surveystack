export const types = {

};

export function requestFetchSubmissions() {
  // let origin;

  // try {
  //   [origin] = window.location.ancestorOrigins;
  // } catch (error) {
  //   // origin = 'https://app.our-sci.net';
  // }

  window.parent.postMessage({
    type: 'REQUEST_FETCH_SUBMISSION',
    payload: {
      // ids,
      // sharecodeIds,
    },
  }, '*');

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
  // const [origin] = window.location.ancestorOrigins;
  window.parent.postMessage({
    type: 'REQUEST_SET_QUESTION_STATUS',
    payload: {
      type,
      message,
    },
  }, '*');
}

export function requestSetContext(context) {
  // const [origin] = window.location.ancestorOrigins;
  window.parent.postMessage({
    type: 'REQUEST_SET_QUESTION_CONTEXT',
    payload: {
      context,
    },
  }, '*');
}

export function requestSetRenderQueue(queue) {
  // const [origin] = window.location.ancestorOrigins;
  window.parent.postMessage({
    type: 'REQUEST_SET_QUESTION_RENDER_QUEUE',
    payload: {
      queue,
    },
  }, '*');
}

export function requestSetValue(value) {
  // let origin;

  // try {
  //   [origin] = window.location.ancestorOrigins;
  // } catch (error) {
  //   // origin = 'https://app.our-sci.net';
  // }

  window.parent.postMessage({
    type: 'REQUEST_SET_QUESTION_VALUE',
    payload: {
      value,
    },
  }, '*');

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
  // const [origin] = window.location.ancestorOrigins;
  window.parent.postMessage({
    type: 'REQUEST_LOG_MESSAGE',
    payload: {
      messages,
    },
  }, '*');
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
  }, '*');
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


export function updateParentState(state) {
  if (state.context) {
    requestSetContext(state.context);
  }
  if (state.value) {
    requestSetValue(state.value);
  }
  if (state.status) {
    requestSetStatus(state.status);
  }
  if (state.ui && state.ui.renderQueue) {
    window.log('renderQueue', state.ui.renderQueue.map(f => String(f)));
    requestSetRenderQueue(state.ui.renderQueue.map(f => String(f)));
    // TODO: add listener on parent for requestSetRenderQueue
    // TODO: pass createUI(renderQueue) into render function
    // TODO: how to store and rehydrate renderQueue? could store as string and eval()? or maybe function constructor
  }
}

function updateDOM(node) {
  const root = document.querySelector('#root');
  root.innerHTML = '';
  root.appendChild(node);
  // const s = new XMLSerializer();

  // if (root.children[0]) {
  //   // log('old', s.serializeToString(root.children[0]));
  //   root.children[0].replaceWith(node);
  // } else {
  //   root.appendChild(node);
  // }
  // log('new', s.serializeToString(node));
}

function setIsLoading(isLoading) {
  const spinner = document.querySelector('#spinner');
  if (isLoading) {
    spinner.classList.remove('hidden');
  } else {
    spinner.classList.add('hidden');
  }
}

export const renderScript = (process, render, props) => (state) => {
  console.log('renderScript', state);
  updateDOM(
    render(props, state, runScript(process, render, props)),
  );
};

export const runScript = (process, render, props) => async (state) => {
  setIsLoading(true);
  let nextState;
  try {
    nextState = await process(props, state);
  } catch (err) {
    setIsLoading(false);
    throw err;
  }
  setIsLoading(false);
  updateParentState(nextState);
  renderScript(process, render, props)(nextState);
};


// const runScriptFromState = runScript3(process, render, props);
// const renderScriptFromState = renderScript2(process, render, props);
// const runScript3 = (process, renderScriptFromState, props) => (state) => {
//   const nextState = process(props, state);
//   updateParentState(nextState);
//   renderScriptFromState(nextState);
// };

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
