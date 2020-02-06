function has(target, key) {
  return true;
}

function get(target, key) {
  if (key === Symbol.unscopables) return undefined;
  return target[key];
}

function compileSandbox(src, fname) {
  const wrappedSource = `with (sandbox) { ${src}\nreturn ${fname}(data); }`;
  const code = new Function('sandbox', wrappedSource);

  return function (sandbox) {
    const sandboxProxy = new Proxy(sandbox, { has, get });
    return code(sandboxProxy);
  };
}


onmessage = (e) => {
  try {
    const sandbox = compileSandbox(e.data.code, 'relevance');

    const res = sandbox({
      JSON,
      submission: e.data.surveyCode,
      log: (line) => {
        postMessage({ log: line });
      },
    });
    console.log('res', res);
    if (typeof res !== 'boolean') {
      throw Error('Function must return true or false');
    }
    postMessage({ res });
  } catch (error) {
    console.log(error);
    postMessage({ error });
  }
};
