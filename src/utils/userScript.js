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


// // An example of a user's script
// export function process({ submission }) {
//   const madlib = `${submission.data.text_1.value} likes ${submission.data.text_2.value}`;
//   requestSetValue({ madlib });
//   requestSetStatus({ type: 'SUCCESS', message: `it worked! ${Date.now()}` });
//   return {
//     madlib,
//   };
// };
// export function render(result) {
//   const wrapper = document.createElement('div');
//   wrapper.innerHTML = result.madlib;
//   return wrapper;
//   // return h('ul', {}, h('li', {}, result.madlib));
// };

// Build iframe contents for Question Script
export default function buildScriptQuestionIframeContents({
  scriptSource,
  submissionJSON,
  valueJSON,
  contextJSON,
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
        } from 'http://localhost:8081/iframeMessaging.js';

        window.log = requestLogMessage;

        function getInitialState() {
          return {
            submission: ${submissionJSON},
            value: ${valueJSON},
            context: ${contextJSON},
            // scriptHasRun: ${!!valueJSON},
          }
        };

        let state = getInitialState();

        ${scriptSource}

        function resetDOM() {
          const root = document.querySelector('#root');
          root.innerHTML = '';
        }

        function setState({ context = {}, value = null }) {
          state.context = context;
          state.value = value;
          // Trigger render(process(state))
          log('running setState');
          runScript();
        }

        onMessage('REQUEST_RUN_SCRIPT', runScript);

        function runScript() {
          log('runScript');
          log('setState', JSON.stringify(typeof setState));
          const {
            context,
            value,
            status,
          } = process(state);
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
          renderScript(state);
        }

        function renderScript(state) {
          const root = document.querySelector('#root');
          root.innerHTML = '';
          root.appendChild(render({
            context: state.context,
            value: state.value,
            submission: state.submission,
            setState,
          }));
        }

        onMessage('REQUEST_RENDER_SCRIPT', () => renderScript(state));

        onMessage('REQUEST_RESET_SCRIPT', () => {
          state = getInitialState();
          resetDOM();
        });

        document.addEventListener('DOMContentLoaded', handleLoaded);
        // const button = document.createElement('button');
        // button.innerText = 'click here';
        // button.onclick = (ev) => requestLogMessage('clicky from body!');
        // document.body.appendChild(button);
      </script>
    </body>`;
}
