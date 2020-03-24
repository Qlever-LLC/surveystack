/* eslint-disable no-new-func */
function has(target, key) {
  return true;
}

function get(target, key) {
  if (key === Symbol.unscopables) return undefined;
  return target[key];
}

function compileSandbox(src, fname) {
  const wrappedSource = `with (sandbox) { ${src}\n\nreturn ${fname}(args); }`;
  const code = new Function('sandbox', wrappedSource);

  return function (sandbox) {
    const sandboxProxy = new Proxy(sandbox, { has, get });
    return code(sandboxProxy);
  };
}


onmessage = (e) => {
  try {
    const sandbox = compileSandbox(e.data.code, e.data.functionName);

    const res = sandbox({
      args: e.data.args,
      JSON, // for using JSON.stringify() and JSON.parse()
      log: (line) => {
        postMessage({ log: line });
      },
    });
    console.log('res', res);
    postMessage({ res });
  } catch (error) {
    console.log(error);
    postMessage({ error });
  }
};
