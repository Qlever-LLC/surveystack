import TreeModel from 'tree-model';
import { get } from 'lodash';
import api from '@/services/api.service';
import emitter from '@/utils/eventBus';

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

export function getValueOrNull(v, StringTrimed = true) {
  if (typeof v === 'undefined') {
    return null;
  }

  if (Array.isArray(v) && v.length === 0) {
    return null;
  }

  if (typeof v === 'string') {
    if (StringTrimed) {
      const value = v.trim();
      return value || null;
    } else {
      return v || null;
    }
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

export async function prefetchPinned(store) {
  if (!store.getters['auth/isLoggedIn']) {
    return;
  }
  emitter.emit('prefetchPinned', true);

  const { _id: userId } = store.getters['auth/user'];
  //TODO check if this still is required as part of the data prefetch
  await store.dispatch('memberships/getUserMemberships', userId, { root: true });

  const { data } = await api.get(`/surveys/pinned`);
  const { status } = data;
  console.log('pinned', data);

  const surveys = [];

  if (status !== 'success' || !Array.isArray(data.pinned)) {
    return;
  }

  for (const group of data.pinned) {
    if (!Array.isArray(group.pinned)) {
      continue;
    }

    for (const sid of group.pinned) {
      const alreadyFetched = surveys.find((f) => f._id == sid);
      if (!alreadyFetched) {
        try {
          const s = await fetchSurveyWithResources(store, sid);
          surveys.push(s);
        } catch (error) {
          console.error('error:' + error);
          continue;
        }
      }
    }
  }
  emitter.emit('prefetchPinned', false);
}

export async function fetchSurveyWithResources(store, sid) {
  const s = await fetchSurvey({ id: sid });
  if (s.resources) {
    await store.dispatch('resources/fetchResources', s.resources, { root: true });
  }
  return s;
}

export async function fetchSurvey({ id, version = 'latest' }) {
  const { data: survey } = await api.get(`/surveys/${id}?version=${version}`);

  return survey;
}

export async function getPinnedSurveysForGroup(groupId) {
  const { data } = await api.get(`/surveys/pinned`);
  const group = data.pinned.find((obj) => obj.group_id === groupId);

  const pinnedSurveys = [];
  for (const sid of group.pinned) {
    const s = await fetchSurvey({ id: sid });
    pinnedSurveys.push(s);
  }

  pinnedSurveys.sort((a, b) => a.name.localeCompare(b.name));

  return pinnedSurveys;
}

export async function isSurveyPinned(groupId, surveyId) {
  const { data } = await api.get(`/surveys/pinned`);
  const group = data.pinned.find((obj) => obj.group_id === groupId);
  const isPinned = group.pinned.find((pid) => pid === surveyId);
  return !!isPinned;
}

export default {
  getAllNodes,
  queueAction,
  getValueOrNull,
  createBasicQueryList,
  isOnline,
  prefetchPinned,
  fetchSurvey,
  getPinnedSurveysForGroup,
  isSurveyPinned,
};
