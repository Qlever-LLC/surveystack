import * as db from '@/store/db';
import { resourceLocations, uploadFile, uploadFileResource } from '@/utils/resources';
import api from '@/services/api.service';
import axios from 'axios';
import ObjectId from 'bson-objectid';
import slugify from '@/utils/slugify';

const createInitialState = () => ({
  resources: [],
});

const initialState = createInitialState();

const getters = {
  getResource: (state) => (id) => {
    return state.resources.find((resource) => resource._id === id);
  },
  getResourceByKey: (state) => (key) => {
    return state.resources.find((resource) => resource.key === key);
  },
};

const actions = {
  reset({ commit }) {
    commit('RESET');
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
  /*
   TODO used by Resource.vue, refactor so it uses addLocalResource and then uploadFile
   */
  // eslint-disable-next-line no-unused-vars
  async addRemoteResource({ commit, dispatch }, file) {
    let resource = await dispatch('addLocalResource', file);
    let resourceId = await uploadFileResource(resource.key);
    await dispatch('fetchResource', resourceId, file);
    return resourceId;
  },
  async addLocalResource({ commit }, file) {
    //only add resource locally, do not upload resource or file data yet
    const resourceId = new ObjectId().toString();
    const resource = {
      _id: resourceId,
      state: 'local',
      label: file.name,
      name: slugify(file.name),
      key: 'resources/' + resourceId + '/' + file.name, // define s3 file key containing unique uuid to prevent filename collision, allowed characters see https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
      contentLength: file.size,
      contentType: file.type,
      fileData: file,
    };
    await db.persistResource(resource);
    commit('ADD_RESOURCE', resource);
    return resource;
  },
  async removeLocalResource({ commit, getters }, resourceKey) {
    let resource = getters['getResourceByKey'](resourceKey);
    if (resource) {
      try {
        await db.removeFromIndexedDB(db.stores.RESOURCES, resource._id);
      } catch (err) {
        console.warn('unable to remove resource from IDB');
      }
      commit('REMOVE_RESOURCE', resource._id);
    } else {
      console.error('resource not found, key: ' + resourceKey);
    }
  },

  async fetchResource({ commit, getters }, resourceId) {
    let resource = getters['getResource'](resourceId);
    if (!resource) {
      /*TODO store data in the resource object could lead to the data being stored in OUR db if a caller persists this resource object
      maybe store the data in a separate array?
     */
      // fetch resource
      ({ data: resource } = await api.get(`/resources/${resourceId}`));
      // get download url
      const { data: url } = await api.post(`/resources/download-url`, { key: resource.key });
      // download data
      const { data: binaryResult } = await axios.get(url, {
        responseType: 'arraybuffer',
        validateStatus: false,
      });
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
  REMOVE_RESOURCE(state, resourceId) {
    const itemToRemoveIndex = state.resources.findIndex(function (item) {
      return item._id === resourceId;
    });
    if (itemToRemoveIndex !== -1) {
      state.resources.splice(itemToRemoveIndex, 1);
    }
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
