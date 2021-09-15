/* eslint-disable no-new-func */
/* eslint-disable func-names */

function has(target, key) {
  return true;
}

function get(target, key) {
  if (key === Symbol.unscopables) return undefined;
  return target[key];
}

function compileSandbox(src, fname) {
  const wrappedSource = `with (sandbox) { ${src}\n\nreturn ${fname}(arg1, arg2); }`;
  const code = new Function('sandbox', wrappedSource);

  return function (sandbox) {
    const sandboxProxy = new Proxy(sandbox, { has, get });
    return code(sandboxProxy);
  };
}


onmessage = (e) => {
  try {
    const sandbox = compileSandbox(e.data.code, e.data.fname);
    console.log('arg2', e.data.arg2);
    const res = sandbox({
      arg1: e.data.arg1,
      arg2: e.data.arg2,
      JSON, // for using JSON.stringify() and JSON.parse()
      Number,
      Date,
      log: (line) => {
        postMessage({ log: line });
      },
    });
    console.log('res', res);
    postMessage({ res });
  } catch (error) {
    console.log(error);
    if (error.message) {
      postMessage({ error: error.message });
    } else {
      postMessage({ error });
    }
  }
};
