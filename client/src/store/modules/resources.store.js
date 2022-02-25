import * as db from '@/store/db';
import { resourceLocations, uploadFile } from '@/utils/resources';
import api from '@/services/api.service';
import axios from 'axios';

const createInitialState = () => ({
  resources: [],
});

const initialState = createInitialState();

const getters = {
  getResource: (state) => (id) => {
    return state.resources.find((resource) => resource._id === id);
  },
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  // eslint-disable-next-line no-unused-vars
  async addResource({ commit, dispatch }, file) {
    let resourceId = await uploadFile(file);
    await dispatch('fetchResource', resourceId, file);
    return resourceId;
  },
  async initFromIndexedDB({ commit }) {
    // TODO reject if timeout here
    const response = await new Promise((resolve) => {
      db.openDb(() => {
        db.getAllResources((results) => resolve(results));
      });
    });
    commit('SET_RESOURCES', response);
    return response;
  },
  async fetchResource({ commit, getters }, resourceId) {
    let resource = getters['getResource'](resourceId);
    console.log('1' + resource);
    if (!resource) {
      /*TODO store data in the resource object could lead to the data being stored in OUR db if a caller persists this resource object
      maybe store the data in a separate array?
     */
      // fetch resource
      ({ data: resource } = await api.get(`/resources/${resourceId}`));
      console.log('2' + resource);
      // get download url
      const { data: url } = await api.post(`/resources/download-url`, { key: resource.key });
      // download data
      const { data: binaryResult } = await axios.get(url, { responseType: 'arraybuffer', validateStatus: false });
      resource.fileData = new Blob([binaryResult], { type: resource.contentType });
      await db.persistResource(resource);
      commit('ADD_RESOURCE', resource);
    }
    return resource;
  },
  async fetchResources({ commit }, resources) {
    //TODO test if this is executed in parallel
    let promises = [];
    for (const r of resources) {
      if (r.location === resourceLocations.REMOTE) {
        promises.push(this.$store.dispatch('resources/fetchResource', r._id));
      }
    }
    await Promise.all(promises);
  },
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  ADD_RESOURCE(state, resource) {
    state.resources.push(resource);
  },
  SET_RESOURCES(state, resources) {
    state.resources = resources;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
