import ObjectId from 'bson-objectid';
import slugify from '@/utils/slugify';

export const resourceTypes = {
  ONTOLOGY_LIST: 'ONTOLOGY_LIST',
  IMAGE: 'IMAGE',
};

export const resourceLocations = {
  REMOTE: 'REMOTE',
  EMBEDDED: 'EMBEDDED',
};

export function filterResourcesByTypes(resources, types = []) {
  if (types.length === 0) {
    return resources;
  }
  return resources.filter(
    resource => types.some(
      type => type === resource.type,
    ),
  );
}

export function removeResource(resources, id) {
  const index = resources.findIndex(r => r.id === id);
  return [
    ...resources.slice(0, index),
    ...resources.slice(index + 1),
  ];
}

export function setResource(resources, resource) {
  const index = resources.findIndex(r => r.id === resource.id);
  return [
    ...resources.slice(0, index),
    resource,
    ...resources.slice(index + 1),
  ];
}

export function appendResource(resources, resource) {
  return [
    ...resources,
    resource,
  ];
}

export function createResource(resources, type, location, options = {
  labelPrefix: 'Resource',
  defaultContent: '',
}) {
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
  return val => (resourceNames.some(({
    name,
    id,
  }) => val === name && this.resource.id !== id)
    ? 'Name must be unique'
    : true);
}

export function nameHasValidCharacters(val) {
  const namePattern = /^[\w]*$/;
  return namePattern.test(val) ? true : 'Data name must only contain valid charcters';
}

export function nameHasValidLength(val) {
  const namePattern = /^.{4,}$/; // one character should be ok, especially within groups
  return namePattern.test(val) ? true : 'Data name must be at least 4 character in length';
}
