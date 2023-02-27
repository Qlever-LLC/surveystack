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
  iframeMessagingSource,
  markedSource,
  iframeUISource,
  sandboxUtilsSource,
  iframeStyles,
}) {
  return `
  <head>
   <style type="text/css">${iframeStyles}</style>
  </head>
  <body>
      <div class="spinner-container">
        <div id="spinner" class="spinner hidden"></div>
      </div>
      <div id="root"></div>
      <script type="module">
        ${markedSource}
        ${iframeUISource}
        ${sandboxUtilsSource}
        ${iframeMessagingSource}

        async function loadLibs() {
            const libraries = await getLibraries();
            console.error('number of libraries injected to iframe: '+libraries.length);
            for await (const lib of libraries) {
              await import(/* webpackIgnore: true */'data:text/javascript;base64,'+lib);
            }
          }

          loadLibs();

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
    </body>`;
}
