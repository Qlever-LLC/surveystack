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
  return `
  <head>
    <!-- <link href="https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css" rel="stylesheet"> -->
    <link href="http://localhost:8081/iframeStyles.css" rel="stylesheet">
  </head>
  <body>
      <div id="root"></div>
      <script type="module">
        import {
          requestFetchSubmissions,
          requestSetStatus,
          requestSetValue,
          requestSetContext,
          requestSetRenderQueue,
          requestLogMessage,
          onMessage,
          handleLoaded,
          statusTypes,
          renderScript,
          runScript,
          resetDOM,
          // createUI,
        } from 'http://localhost:8081/iframeMessaging.js';

        import { createUI } from 'http://localhost:8081/iframeUI.js';
        import * as ui from 'http://localhost:8081/iframeUI.js';

        window.log = requestLogMessage;

        function getInitialState() {
          return {
            value: ${valueJSON},
            context: ${contextJSON},
          };
        };

        const state = getInitialState();
        const props = {
          submission: ${submissionJSON},
          control: ${controlJSON},
          params: ${paramsJSON},
        };

        ${scriptSource}

        onMessage('REQUEST_RUN_SCRIPT', () => runScript(process, render, props)(state));
        onMessage('REQUEST_RENDER_SCRIPT', () => renderScript(process, render, props)(state));
        onMessage('REQUEST_RESET_SCRIPT', resetDOM);

        document.addEventListener('DOMContentLoaded', handleLoaded);
      </script>
      <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    </body>`;
}
