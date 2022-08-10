import ObjectId from 'bson-objectid';
import slugify from '@/utils/slugify';
import api from '@/services/api.service';
import axios from 'axios';
import { linearControls } from '@/utils/submissions';

export const resourceTypes = {
  ONTOLOGY_LIST: 'ONTOLOGY_LIST',
  IMAGE: 'IMAGE',
  SURVEY_REFERENCE: 'SURVEY_REFERENCE',
  FILE: 'FILE',
};

export const resourceLocations = {
  REMOTE: 'REMOTE',
  EMBEDDED: 'EMBEDDED',
};

export function removeResource(resources, id) {
  const index = resources.findIndex((r) => r.id === id);
  return [...resources.slice(0, index), ...resources.slice(index + 1)];
}

export function setResource(resources, resource) {
  const index = resources.findIndex((r) => r.id === resource.id);
  return [...resources.slice(0, index), resource, ...resources.slice(index + 1)];
}

export function appendResource(resources, resource) {
  return [...resources, resource];
}

export function createResource(
  resources,
  type,
  location,
  options = {
    labelPrefix: 'Resource',
    defaultContent: '',
  }
) {
  const id = new ObjectId().toString();
  return {
    label: `${options.labelPrefix} ${resources.length + 1}`,
    name: `${slugify(options.labelPrefix)}_${resources.length + 1}`,
    id,
    type,
    location,
    content: options.defaultContent,
  };
}

export function nameIsUnique(resourceNames) {
  return (val) =>
    resourceNames.some(({ name, id }) => val === name && this.resource.id !== id) ? 'Name must be unique' : true;
}

export function nameHasValidCharacters(val) {
  const namePattern = /^[\w]*$/;
  return namePattern.test(val) ? true : 'Data name must only contain valid charcters';
}

export function nameHasValidLength(val) {
  const namePattern = /^.{4,}$/; // one character should be ok, especially within groups
  return namePattern.test(val) ? true : 'Data name must be at least 4 character in length';
}

export function replaceLabelInKey(resourceKey, labelNew) {
  return resourceKey.substring(0, resourceKey.lastIndexOf('/') + 1) + labelNew;
}

export function getLabelFromKey(resourceKey) {
  return resourceKey.substring(resourceKey.lastIndexOf('/') + 1);
}

export async function openResourceInTab(store, resourceId) {
  let resource = await store.dispatch('resources/fetchResource', resourceId);
  let url = window.URL.createObjectURL(resource.fileData);
  const element = document.createElement('a');
  element.setAttribute('href', url);
  element.setAttribute('download', `${resource.label}`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export async function getSignedDownloadUrl(resourceKey) {
  const { data: url } = await api.post(`/resources/download-url`, { key: resourceKey });
  return url;
}

export function getPublicDownloadUrl(resourceKey) {
  const s3BaseUrl =
    window.location.origin.indexOf('app.surveystack.io') > -1
      ? 'https://surveystack.s3.amazonaws.com/'
      : 'https://surveystack-test.s3.amazonaws.com/';
  return s3BaseUrl + resourceKey;
}

export async function uploadFileResource(store, resourceKey, clearCacheAfterUpload) {
  // load resource from local store
  const resource = store.getters['resources/getResourceByKey'](resourceKey);
  if (!resource || resource.state === 'committed') {
    // case of resource being already committed (e.g. resubmit)
    return;
  }
  // create clone of resource object, without file data
  let resourceClone = Object.assign({}, resource);
  delete resourceClone.fileData;
  // send resource to server, get upload-url
  let uploadResponse = await api.post('/resources/upload-url', resourceClone);

  try {
    // upload file to url
    await axios.create().put(uploadResponse.data.signedUrl, resource.fileData);
    //set resource to committed
    await api.put(`/resources/commit/${resource._id}`, { dummy: '' });
    if (clearCacheAfterUpload) {
      await store.dispatch('resources/removeLocalResource', resource.key);
    } else {
      await store.dispatch('resources/updateResourceState', {
        resourceKey: resource.key,
        stateNew: 'committed',
      });
    }
  } catch (error) {
    //delete file resource
    await deleteFileResource(resource._id);
    throw error;
  }
}

export async function uploadFileResources(store, survey, submission, clearCacheAfterUpload) {
  try {
    let controls = linearControls(survey, submission);
    for (let control of controls) {
      if (control.value && (control.meta.type === 'file' || control.meta.type === 'image')) {
        const unresolvedPromises = control.value.map((resourceKey) =>
          uploadFileResource(store, resourceKey, clearCacheAfterUpload)
        );
        await Promise.all(unresolvedPromises);
      }
    }
  } catch (error) {
    await store.dispatch('feedback/add', error, { root: true });
    throw error;
  }
}

export async function deleteFileResource(resourceId) {
  await api.delete(`/resources/${resourceId}`);
}
