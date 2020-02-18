
// import {
//   requestFetchSubmissions,
//   requestSetValue,
//   onMessage,
// } from '../../public/iframeMessaging';


// Should go in iframeMessaging lib file
function requestSetValue(value) {
  const [origin] = window.location.ancestorOrigins;

  window.parent.postMessage({
    type: 'REQUEST_SET_QUESTION_VALUE',
    payload: {
      value: JSON.stringify(value),
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

// should only be in iframeMessaging
function requestSetStatus({
  type,
  message = '',
}) {
  const [origin] = window.location.ancestorOrigins;
  window.parent.postMessage({
    type: 'REQUEST_SET_QUESTION_STATUS',
    payload: {
      type,
      message,
    },
  }, origin);
}


// Should go in iframeMessaging lib file
// TODO: validated origin, pass in as arg
export function onMessage(type, callback) {
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type && event.data.type === type) {
      // callback(event);
      callback(event.data.payload);
    }
  });
}


function h(tag, attributes, ...children) {
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


// An example of a user's script
export const exampleScript = {
  process({ submission }) {
    const madlib = `${submission.data.text_1.value} likes ${submission.data.text_2.value}`;
    requestSetValue({ madlib });
    requestSetStatus({ type: 'SUCCESS', message: `it worked! ${Date.now()}` });
    return {
      madlib,
    };
  },
  render(result) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = result.madlib;
    return wrapper;
    // return h('ul', {}, h('li', {}, result.madlib));
  },
};

// Build iframe contents for Question Script
export default function buildScriptQuestionIframeContents({ script, submissionJSON, valueJSON }) {
  return `<body>
      <div id="root"></div>
      <script type="module">
        import {
          requestFetchSubmissions,
          requestSetStatus,
          requestSetValue,
          requestLogMessage,
          onMessage,
        } from 'http://localhost:8081/iframeMessaging.js';


        function getInitialState() {
          return {
            submission: ${submissionJSON},
            value: ${valueJSON},
            scriptHasRun: ${!!valueJSON},
          }
        };

        function h(tag, attributes, ...children) {
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

        let state = getInitialState();
        let result;

        ${script}


        function handleLoaded() {
          // render(run(state));
          window.parent.postMessage({
            type: 'SCRIPT_HAS_LOADED',
            payload: {},
          // }, window.location.ancestorOrigins[0]);
          }, '*');
        }

        function resetDOM() {

        }


        onMessage('REQUEST_RUN_SCRIPT', () => {
          const root = document.querySelector('#root');
          result = process(state);
          root.innerHTML = render(result).innerHTML;
        });

        onMessage('REQUEST_RENDER_SCRIPT', (payload) => {
          const root = document.querySelector('#root');
          root.innerHTML = render(payload.value).innerHTML;
        });

        onMessage('REQUEST_RESET_SCRIPT', () => {

        })
        // onMessage('UPDATE_SCRIPT_SUBMISSION', () => {});

        document.addEventListener('DOMContentLoaded', handleLoaded);
      </script>
    </body>`;
}
