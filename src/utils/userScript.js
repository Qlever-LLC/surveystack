// TODO: validate origin, pass in as arg
// TODO: return value to allow removeEventListener
export function onMessage(type, callback) {
  function handler(event) {
    if (event.data && event.data.type && event.data.type === type) {
      // callback(event);
      // console.log('message', event);
      callback(event.data.payload);
    }
  }
  window.addEventListener('message', handler);
  return handler;
}

// Build iframe contents for Question Script
export default function buildScriptQuestionIframeContents({
  scriptSource,
  submissionJSON,
  valueJSON,
  contextJSON,
  controlJSON,
  paramsJSON,
}) {
  return `<body>
      <div id="root"></div>
      <script type="module">
        import {
          requestFetchSubmissions,
          requestSetStatus,
          requestSetValue,
          requestSetContext,
          requestLogMessage,
          onMessage,
          handleLoaded,
          statusTypes,
          renderScript,
          runScript,
          resetDOM,
        } from 'http://localhost:8081/iframeMessaging.js';

        window.log = requestLogMessage;

        function getInitialState() {
          return {
            value: ${valueJSON},
            context: ${contextJSON},
          }
        };

        const state = getInitialState();
        const props = {
          submission: ${submissionJSON},
          control: ${controlJSON},
          params: ${paramsJSON},
        };

        ${scriptSource}

        onMessage('REQUEST_RUN_SCRIPT', () => runScript(props, state, process, render));
        onMessage('REQUEST_RENDER_SCRIPT', () => renderScript(props, state, process, render));
        onMessage('REQUEST_RESET_SCRIPT', resetDOM);

        document.addEventListener('DOMContentLoaded', handleLoaded);
      </script>
    </body>`;
}
