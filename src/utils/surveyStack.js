import Vue from 'vue';
// TODO: try to get rid of Vue import
// But we kind of need Vue.set for setting new properties without losing reactivity

// http://blog.nicohaemhouts.com/2015/08/03/accessing-nested-javascript-objects-with-string-key/
export function getNested(obj, path, separator = '.') {
  try {
    return path
      .replace('[', separator).replace(']', '')
      .split(separator)
      .reduce(
        (item, property) => item[property], obj,
      );
  } catch (err) {
    return undefined;
  }
}

export function setNested(obj, path, value, separator = '.') {
  const parentPath = path
    .replace('[', separator).replace(']', '')
    .split(separator);
  const subKey = parentPath.pop();
  const parent = getNested(obj, parentPath.join(separator), separator);
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

export default {
  getNested,
  setNested,
  getAllNodes,
};
