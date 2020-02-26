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
          update,
        } from 'http://localhost:8081/iframeMessaging.js';

        window.log = requestLogMessage;

        function getInitialState() {
          return {
            value: ${valueJSON},
            context: ${contextJSON},
            // scriptHasRun: ${!!valueJSON},
          }
        };

        let state = getInitialState();
        const props = {
          submission: ${submissionJSON},
          control: ${controlJSON},
          params: ${paramsJSON},
        }

        ${scriptSource}

        function resetDOM() {
          const root = document.querySelector('#root');
          root.innerHTML = '';
        }


        window.log('buildiframe typeof process', typeof process);
        onMessage('REQUEST_RUN_SCRIPT', () => runScript(props, state, process, render));

        // const setState = update(props);





        onMessage('REQUEST_RENDER_SCRIPT', () => renderScript(props, state, process, render));

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
