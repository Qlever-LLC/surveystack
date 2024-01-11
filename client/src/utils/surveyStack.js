import TreeModel from 'tree-model';
import { get } from 'lodash';

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

export function getParentPath(path) {
  let parentPath = path;

  // remove leading data.
  let idx = parentPath.indexOf('data.');
  if (idx === 0) {
    parentPath = parentPath.replace('data.', '');
  }

  // remove trailing path element
  idx = parentPath.lastIndexOf('.');
  if (idx > 0) {
    parentPath = parentPath.substring(0, idx);
    parentPath = `data.${parentPath}`;
  } else {
    parentPath = 'data';
  }

  return parentPath;
}

export function getRelevance(submission, path, fallback = true) {
  // checks the relevance of the current path and its parents
  const splits = path.split('.');
  while (splits.length > 1) {
    const p = splits.join('.');
    const relevant = get(submission, `${p}.meta.relevant`, fallback);
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

export function isRequiredUnanswered(node, submission) {
  const { type } = node.model;
  const path = node
    .getPath()
    .map((n) => n.model.name)
    .join('.');
  const value = get(submission, `${path}.value`, null);

  if (type === 'matrix') {
    if (node.model.options.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return true;
    }

    const requiredCols = node.model.options.source.content.filter((h) => h.required && !h.hidden).map((h) => h.value);
    let answered = false;
    if (value) {
      for (const row of value) {
        for (const requiredCol of requiredCols) {
          if (
            row[requiredCol].value === null ||
            (row[requiredCol].value instanceof String && row[requiredCol].value.trim() === '')
          ) {
            answered = true;
          }
        }
      }
    }
    return answered;
  }

  if (!node.model.options.required) {
    return false;
  }

  if (type === 'file' || type === 'image') {
    return value === null || (Array.isArray(value) && value.length === 0);
  }

  if (type === 'page' || type === 'instructions' || type === 'instructionsImageSplit') {
    // we may want to have a "instructions read" checkbox or similar at one point
    // for now, just assume this is answered so users can progress further
    return false;
  }

  return value === null;
}

export function getValueOrNull(v) {
  if (typeof v === 'undefined') {
    return null;
  }

  if (Array.isArray(v) && v.length === 0) {
    return null;
  }

  if (typeof v === 'string') {
    const value = v.trim();
    return value || null;
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
  const { controls } = survey.revisions.find((r) => r.version === version);

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
      .map((n) => n.model.name)
      .join('.');

    items.push({ name: `${path}.value`, key: `${path}.value`, type: node.model.type });
  });

  items.push(...defaultBasicQueryList);

  return items;
};

export function isOnline() {
  return window.navigator.onLine;
}

export default {
  getAllNodes,
  queueAction,
  getValueOrNull,
  createBasicQueryList,
  isOnline,
};
