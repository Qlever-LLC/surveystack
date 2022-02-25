import ObjectId from 'bson-objectid';
import slugify from '@/utils/slugify';
import api from '@/services/api.service';
import axios from 'axios';
import store from '../store';

export const resourceTypes = {
  ONTOLOGY_LIST: 'ONTOLOGY_LIST',
  IMAGE: 'IMAGE',
  SURVEY_REFERENCE: 'SURVEY_REFERENCE',
};

export const resourceLocations = {
  REMOTE: 'REMOTE',
  EMBEDDED: 'EMBEDDED',
};

export function filterResourcesByTypes(resources, types = []) {
  if (types.length === 0) {
    return resources;
  }
  return resources.filter((resource) => types.some((type) => type === resource.type));
}

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

export async function openResourceInTab(resourceId) {
  let resource = await store.dispatch('resources/fetchResource', resourceId);
  let url = window.URL.createObjectURL(resource.fileData);
  window.open(url);
}

export async function uploadFile(file) {
  // TODO exception handling and rollback
  const body = {
    resourceName: file.name,
    contentLength: file.size,
    contentType: file.type,
  };
  let { data: uploadData } = await api.post('/resources/upload-url', body);
  // upload file to url
  let putResponse = await axios.create().put(uploadData.signedUrl, file);
  //set resource to committed
  let commitResponse = await api.put(`/resources/commit/${uploadData.resourceId}`, { dummy: '' });
  return uploadData.resourceId;
}

export async function uploadFileResources(submission) {
  //this does not cache to store, and that makes sense when submitting
  let submissionClone = submission; //cloneDeep(submission);

  let controls = Object.values(submissionClone.data);

  for (let control of controls) {
    if (control.meta.type === 'file') {
      const unresolvedPromises = control.value.map((file) => uploadFile(file));
      control.value = await Promise.all(unresolvedPromises);
    }
  }

  // TODO parallelize all uploads using promises, then await Promise.all - NOT WORKING, NOT WAITING
  /*await Promise.all(
    Object.values(submissionClone.data).map(async (control) => {
      if (control.meta.type === 'file') {
        return await control.value.map(async (file) => {
          return await uploadFile(file);
        });
      }
    })
  );*/

  return submissionClone;
}
