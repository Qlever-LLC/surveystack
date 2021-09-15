// https://medium.com/@zitko/structuring-a-vue-project-authentication-87032e5bfe16
import axios from 'axios';
import { AuthService } from './storage.service';

const httpClient = axios.create();

const ApiService = {
  init(baseURL) {
    httpClient.defaults.baseURL = baseURL;
    const status = AuthService.getStatus();
    if (status === 'success') {
      const header = AuthService.getHeader();
      this.setHeader('Authorization', header);
    }
  },

  setHeader(name, value) {
    httpClient.defaults.headers.common[name] = value;
  },

  removeHeaders() {
    httpClient.defaults.headers.common = {};
  },

  removeHeader(name) {
    delete httpClient.defaults.headers.common[name];
  },

  get(resource) {
    return httpClient.get(resource);
  },

  post(resource, data) {
    return httpClient.post(resource, data);
  },

  put(resource, data) {
    return httpClient.put(resource, data);
  },

  delete(resource) {
    return httpClient.delete(resource);
  },

  /**
   * Perform a custom Axios request.
   * */
  customRequest(data) {
    return httpClient(data);
  },
};

export default ApiService;
