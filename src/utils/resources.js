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
  defaultContent: {},
}) {
  const id = new ObjectId().toString();
  // return [
  //   ...resources,
  //   {
  //     label: `Dropdown Items ${resources.length + 1}`,
  //     name: `dropdown_items_${resources.length + 1}`,
  //     id,
  //     type,
  //     location,
  //     content: [],
  //   },
  // ];
  return {
    label: `${options.labelPrefix} ${resources.length + 1}`,
    name: `${slugify(options.labelPrefix)}_${resources.length + 1}`,
    id,
    type,
    location,
    content: options.defaultContent,
  };
}
