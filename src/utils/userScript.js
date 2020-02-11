// Should go in iframeMessaging lib file
export function requestSetValue(value) {
  // let origin;

  // try {
  const [origin] = window.location.ancestorOrigins;
  // } catch (error) {
  //   // origin = 'https://app.our-sci.net';
  // }

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


// An example of a user's script
export const exampleScript = {
  run({ submission }) {
    const madlib = `${submission.data.text_1.value} likes ${submission.data.text_2.value}`;
    requestSetValue(madlib);
    return {
      madlib,
    };
  },
  render(state) {
    const node = document.querySelector('#root');
    node.innerText = state.madlib;
  },
};

// Build iframe contents for Question Script
export default function buildScriptQuestionIframeContents({ script, submissionJSON, valueJSON }) {
  return `<body>
      <div id="root"></div>
      <script type="module">
        import {
          requestFetchSubmissions,
          requestSetValue,
          onMessage,
        } from 'http://localhost:8081/iframeMessaging.js';

        function getInitialState() {
          return {
            submission: ${submissionJSON},
            value: ${valueJSON},
            scriptHasRun: ${!!valueJSON},
          }
        };

        let state = getInitialState();

        ${script.run}

        ${script.render}


        function handleLoaded() {
          render(run(state));
        }

        onMessage('RUN_SCRIPT', () => render(run(state)));
        // onMessage('RESET_SCRIPT', () => {})
        // onMessage('UPDATE_SCRIPT_SUBMISSION', () => {});

        document.addEventListener('DOMContentLoaded', handleLoaded);
      </script>
    </body>`;
}
