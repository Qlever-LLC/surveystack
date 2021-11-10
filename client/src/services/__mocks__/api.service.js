import { cloneDeep } from 'lodash';

function createMockableCommand() {
  let presets = [];

  // epmty the presets after each test
  /* eslint-disable-next-line */
  afterEach(() => (presets = []));

  const fn = (reqUrl) => {
    for (const { url, response } of presets) {
      if (reqUrl === url) {
        return Promise.resolve(cloneDeep(response));
      }
    }
    let help = '';
    if (presets.length) {
      help = '\ncurrently set presets:\n' + presets.map((p) => ` - ${p[0]}`).join('\n');
    }
    throw Error(`Don't have a mocked response for "${reqUrl}"${help}`);
  };
  // set the response for a request
  // example: `api.get.setResponse('/foo/bar?baz=4', {fux: 5})
  fn.setResponse = (url, response) => {
    presets.push({ url, response });
  };
  return fn;
}

export default {
  init(baseURL) {
    // httpClient.defaults.baseURL = baseURL;
    // const status = AuthService.getStatus();
    // if (status === 'success') {
    //   const header = AuthService.getHeader();
    //   this.setHeader('Authorization', header);
    // }
  },

  setHeader(name, value) {
    console.log(`httpClient.defaults.headers.common[name] = value`);
  },

  removeHeaders() {
    console.log(`httpClient.defaults.headers.common = {}`);
  },

  removeHeader(name) {
    console.log(`delete httpClient.defaults.headers.common[name]`);
  },

  get: createMockableCommand(),

  post(resource, data) {
    console.log(`return httpClient.post(resource, data)`);
  },

  put(resource, data) {
    console.log(`return httpClient.put(resource, data)`);
  },

  delete(resource) {
    console.log(`return httpClient.delete(resource)`);
  },

  /**
   * Perform a custom Axios request.
   * */
  customRequest(data) {
    console.log(`return httpClient(data)`);
  },
};
