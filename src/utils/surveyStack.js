/* eslint no-restricted-syntax: 0 */
import Vue from 'vue';
// TODO: try to get rid of Vue import
// But we kind of need Vue.set for setting new properties without losing reactivity

import TreeModel from 'tree-model';

const SEPARATOR = '.';

// http://blog.nicohaemhouts.com/2015/08/03/accessing-nested-javascript-objects-with-string-key/
export function getNested(obj, path, fallback = undefined) {
  try {
    return path
      .replace('[', SEPARATOR).replace(']', '')
      .split(SEPARATOR)
      .reduce(
        (item, property) => (item[property] === undefined ? fallback : item[property]), obj,
      );
  } catch (err) {
    return fallback;
  }
}

export function setNested(obj, path, value) {
  const parentPath = path
    .replace('[', SEPARATOR).replace(']', '')
    .split(SEPARATOR);
  const subKey = parentPath.pop();
  const parent = getNested(obj, parentPath.join(SEPARATOR), SEPARATOR);
  // parent[subKey] = value; // not reactive if setting properties which do not exist yet
  Vue.set(parent, subKey, value);
}

export const getAllNodes = (root) => {
  const nodes = [];
  root.walk((node) => {
    if (node.isRoot()) {
      return true;
    }
    nodes.push(node);
    return true;
  });
  return nodes;
};

export function getRelevance(submission, path, fallback = true) {
  // checks the relevance of the current path and its parents
  const splits = path.split('.');
  while (splits.length > 1) {
    const p = splits.join('.');
    const relevant = getNested(submission, `${p}.meta.relevant`, fallback);
    if (!relevant) {
      return false;
    }
    splits.splice(-1);
  }

  return fallback;
}

export function queueAction(store, action, payload = null) {
  const hasCustomOntologies = document.querySelector('.custom-ontology');
  if (hasCustomOntologies) {
    // super ugly but kind of needed hack to allow custom ontology selection to lose focus and update their values
    setTimeout(() => {
      store.dispatch(action, payload);
    }, 100);
    return;
  }

  store.dispatch(action, payload);
}

export function isAnswered(node, submission) {
  const { type } = node.model;
  const path = node.getPath().map(n => n.model.name).join('.');
  const value = getNested(submission, `${path}.value`, null);

  if (type === 'matrix') {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return false;
    }
    const requiredCols = node.model.options.source.content.filter(h => h.required).map(h => h.value);
    let answered = true;
    for (const row of value) {
      for (const requiredCol of requiredCols) {
        console.log(`row[${requiredCol}].value`, row[requiredCol].value);
        if (row[requiredCol].value === null) {
          answered = false;
        }
      }
    }

    return answered;
  }

  if (type === 'page' || type === 'instructions' || type === 'instructionsImageSplit') {
    // we may want to have a "instructions read" checkbox or similar at one point
    // for now, just assume this is answered so users can progress further
    return true;
  }

  return value != null;
}

export function getValueOrNull(v) {
  if (Array.isArray(v) && v.length === 0) {
    return null;
  }

  if (v === '' || v === undefined) {
    return null;
  }

  // should we also check for empty object and return null instead?

  return v;
}

const defaultBasicQueryList = [
  { name: 'meta.dateCreated', key: 'meta.dateCreated', type: '$date' },
  { name: 'meta.dateModified', key: 'meta.dateModified', type: '$date' },
  { name: 'meta.dateSubmitted', key: 'meta.dateSubmitted', type: '$date' },
  { name: 'meta.creator', key: 'meta.creator', type: '$oid' },
  { name: 'meta.creatorDetail.email', key: 'meta.creatorDetail.email', type: 'string' },
  { name: 'meta.creatorDetail.name', key: 'meta.creatorDetail.name', type: 'string' },
  { name: 'meta.group.id', key: 'meta.group.id', type: '$oid' },
  { name: 'meta.group.path', key: 'meta.group.path', type: 'string' },
  { name: 'meta.survey.id', key: 'meta.survey.id', type: '$oid' },
  { name: 'meta.survey.version', key: 'meta.survey.version', type: 'number' },
  { name: 'meta.revision', key: 'meta.revision', type: 'number' },
  { name: '_id', key: '_id', type: '$oid' },

];

export const createBasicQueryList = (survey, version = 1) => {
  const { controls } = survey.revisions.find(r => r.version === version);

  const tree = new TreeModel();
  const root = tree.parse({ name: 'data', children: controls });

  const items = [];

  root.walk((node) => {
    if (node.hasChildren()) {
      return;
    }

    if (node.model.type === 'group' || node.model.type === 'page') {
      return;
    }

    const path = node
      .getPath()
      .map(n => n.model.name)
      .join('.');

    items.push({ name: `${path}.value`, key: `${path}.value`, type: node.model.type });
  });

  items.push(...defaultBasicQueryList);

  return items;
};

export default {
  getNested,
  setNested,
  getAllNodes,
  queueAction,
  isAnswered,
  getValueOrNull,
  createBasicQueryList,
};
