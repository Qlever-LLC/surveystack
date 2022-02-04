import * as db from '@/store/db';
import { downloadResourceData, getResource, resourceLocations } from '@/utils/resources';

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
  async addLocalResource({ commit }, resourceId, file) {
    let resource = await getResource(resourceId);
    resource.fileData = file;
    await db.persistResource(resource);
    commit('ADD_RESOURCE', resource);
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
  async fetchRemoteResource({ commit }, resourceId) {
    let resource = await getResource(resourceId);
    /*TODO store data in the resource object could lead to the data being stored in OUR db if a caller persists this resource object
      maybe store the data in a separate array?
     */
    let binaryResult = await downloadResourceData(resourceId);
    resource.fileData = new Blob([binaryResult], { type: resource.contentType });
    //resource.fileData = btoa(unescape(encodeURIComponent(binaryResult)));
    await db.persistResource(resource);
    commit('ADD_RESOURCE', resource);
    return resource;
  },
  async fetchRemoteResources({ commit }, resources) {
    //TODO test if this is executed in parallel
    let promises = [];
    for (const r of resources) {
      if (r.location === resourceLocations.REMOTE) {
        promises.push(this.$store.dispatch('resources/fetchRemoteResource', r._id));
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
