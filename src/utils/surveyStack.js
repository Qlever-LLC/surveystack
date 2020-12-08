import Vue from 'vue';
// TODO: try to get rid of Vue import
// But we kind of need Vue.set for setting new properties without losing reactivity

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

export default {
  getNested,
  setNested,
  getAllNodes,
};
