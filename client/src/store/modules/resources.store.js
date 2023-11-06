import * as db from '@/store/db';
import {
  deleteFileResource,
  getPublicDownloadUrl,
  replaceLabelInKey,
  resourceLocations,
  resourceTypes,
  uploadFileResource,
} from '@/utils/resources';
import api from '@/services/api.service';
import axios from 'axios';
import ObjectId from 'bson-objectid';
import slugify from '@/utils/slugify';
import { cloneDeep } from 'lodash';
import { isOnline } from '@/utils/surveyStack';

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
    //TODO maybe better initFromIndexedDB by the store itself on first access
    const response = await new Promise((resolve) => {
      db.openDb(() => {
        db.getAllResources((results) => resolve(results));
      });
    });
    commit('SET_RESOURCES', response);
  },
  // eslint-disable-next-line no-unused-vars
  async addRemoteResource({ commit, dispatch }, file) {
    try {
      let resource = await dispatch('addLocalResource', file);
      await uploadFileResource(this, resource.key, false);
      await dispatch('fetchResource', resource._id);
      return resource._id;
    } catch (error) {
      dispatch('feedback/add', error, { root: true });
      throw error;
    }
  },
  async addLocalResource({ commit, dispatch }, file) {
    try {
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
      db.persistResource(resource);
      commit('ADD_RESOURCE', resource);
      return resource;
    } catch (error) {
      dispatch('feedback/add', error, { root: true });
      throw error;
    }
  },
  async updateResourceLabel({ commit, getters, dispatch }, { resourceKey, labelNew }) {
    try {
      let resource = getters['getResourceByKey'](resourceKey);
      if (resource) {
        resource.key = replaceLabelInKey(resource.key, labelNew);
        resource.label = labelNew;
        resource.name = slugify(labelNew);
        db.persistResource(resource);
        commit('REMOVE_RESOURCE', resource._id);
        commit('ADD_RESOURCE', resource);
      } else {
        throw Error(`Resource with key ${resourceKey}not found`);
      }
      return resource;
    } catch (error) {
      dispatch('feedback/add', error, { root: true });
      throw error;
    }
  },
  async updateResourceState({ commit, getters, dispatch }, { resourceKey, stateNew }) {
    try {
      let resource = getters['getResourceByKey'](resourceKey);
      if (resource) {
        resource.state = stateNew;
        db.persistResource(resource);
        commit('REMOVE_RESOURCE', resource._id);
        commit('ADD_RESOURCE', resource);
      }
    } catch (error) {
      dispatch('feedback/add', error, { root: true });
      throw error;
    }
  },
  async removeLocalResource({ commit, getters, dispatch }, resourceKey) {
    let resource = getters['getResourceByKey'](resourceKey);
    if (resource) {
      try {
        await db.removeFromIndexedDB(db.stores.RESOURCES, resource._id);
      } catch (error) {
        dispatch('feedback/add', error, { root: true });
        throw error;
      }
      commit('REMOVE_RESOURCE', resource._id);
    }
  },
  async removeRemoteResource({ commit, getters, dispatch }, resourceKey) {
    let resource = getters['getResourceByKey'](resourceKey);
    if (resource) {
      try {
        await dispatch('removeLocalResource', resourceKey);
        await deleteFileResource(resource._id);
      } catch (error) {
        dispatch('feedback/add', error, { root: true });
        throw error;
      }
    } else {
      const errorMessage = 'resource not found, key: ' + resourceKey;
      dispatch('feedback/add', errorMessage, { root: true });
      throw Error(errorMessage);
    }
  },
  async fetchResource({ commit, getters, dispatch }, resourceId) {
    let resource = getters['getResource'](resourceId);
    if (resource) {
      return resource;
    }

    try {
      // fetch resource
      ({ data: resource } = await api.get(`/resources/${resourceId}`));
    } catch (error) {
      dispatch('feedback/add', `Could not fetch resource ${resourceId}. This problem is reported automatically.`, {
        root: true,
      });
      console.error(error);
      throw error;
    }

    // Some remote URL doesn't work since CORS error, so ignore download file error
    // We can still use download url without raw file data and actually it works on browser.
    try {
      // get download url
      const url = getPublicDownloadUrl(resource.key);
      // download data
      const { data: binaryResult } = await axios.get(url, {
        responseType: 'arraybuffer',
        validateStatus: false,
      });
      resource.fileData = new Blob([binaryResult], { type: resource.contentType });
    } catch (error) {
      console.error('Could not fetch the remote file data', error);
    }

    db.persistResource(resource);
    commit('ADD_RESOURCE', resource);

    return resource;
  },
  async fetchScriptResource({ commit, getters, dispatch }, resource) {
    try {
      let resourceStored = getters['getResource'](resource.id);
      if (isOnline()) {
        //always load latest script version if online
        const { data: scriptCode } = await api.get(`/scripts/${resource.content}`);
        resourceStored = cloneDeep(resource);
        resourceStored._id = resourceStored.id; //_id is required to be stored in idb
        resourceStored.fileData = scriptCode;
        db.persistResource(resourceStored);
        commit('REMOVE_RESOURCE', resource._id);
        commit('ADD_RESOURCE', resourceStored);
      }
      return resourceStored;
    } catch (error) {
      dispatch('feedback/add', `Could not fetch resource ${resource.id}. This problem is reported automatically.`, {
        root: true,
      });
      console.error(error);
      throw error;
    }
  },
  async fetchResources({ commit, dispatch }, surveyResource) {
    try {
      let promises = [];
      for (const r of surveyResource) {
        if (r.location === resourceLocations.REMOTE && r.type === resourceTypes.FILE) {
          //Hint: survey resources's primary key is called id, not _id
          promises.push(dispatch('fetchResource', r.id));
        } else if (r.location === resourceLocations.REMOTE && r.type === resourceTypes.SCRIPT_REFERENCE) {
          promises.push(dispatch('fetchScriptResource', r));
        }
      }
      await Promise.all(promises);
    } catch (error) {
      dispatch('feedback/add', `Fetching of some resources failed. This problem is reported automatically.`, {
        root: true,
      });
      console.error(error);
      throw error;
    }
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
