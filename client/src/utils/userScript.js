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
  parentJSON,
  valueJSON,
  contextJSON,
  controlJSON,
  paramsJSON,
}) {
  let baseURL;
  switch (process.env.NODE_ENV) {
    case 'production':
      baseURL = 'https://app.surveystack.io';
      break;
    case 'review':
      baseURL = 'https://dev.surveystack.io';
      break;
    default:
      baseURL = `http://localhost:${process.env.VUE_APP_DEV_SERVER_PORT || 8080}`;
      break;
  }

  return `
  <head>
    <link href="${baseURL}/iframeStyles.css" rel="stylesheet">
  </head>
  <body>
      <div class="spinner-container">
        <div id="spinner" class="spinner hidden"></div>
      </div>
      <div id="root"></div>
      <script type="module">
        import {
          requestFetchSubmissions,
          requestSetStatus,
          requestSetValue,
          requestSetContext,
          requestSetRenderQueue,
          requestLogMessage,
          requestRunSurveyStackKit,
          onMessage,
          handleLoaded,
          statusTypes,
          renderScript,
          runScript,
          resetDOM,
          // createUI,
        } from '${baseURL}/iframeMessaging.js';

        import { createUI } from '${baseURL}/iframeUI.js';
        import * as ui from '${baseURL}/iframeUI.js';
        import * as utils from '${baseURL}/sandboxUtils.js';

        window.log = requestLogMessage;
        window.runSurveyStackKit = requestRunSurveyStackKit;

        function getInitialState() {
          return {
            value: ${valueJSON},
            context: ${contextJSON},
          };
        };

        const state = getInitialState();
        const props = {
          submission: ${submissionJSON},
          parent: ${parentJSON},
          control: ${controlJSON},
          params: ${paramsJSON},
        };

        ${scriptSource}

        onMessage('REQUEST_RUN_SCRIPT', async (state) => await runScript(process, render, props)(state));
        onMessage('REQUEST_RENDER_SCRIPT', () => renderScript(process, render, props)(state));
        onMessage('REQUEST_RESET_SCRIPT', resetDOM);

        document.addEventListener('DOMContentLoaded', handleLoaded);
      </script>
      <script async src="https://cdn.plot.ly/plotly-1.58.5.min.js"></script>
    </body>`;
}
