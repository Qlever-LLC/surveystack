import TreeModel from 'tree-model';

import * as utils from '@/utils/surveys';

// http://blog.nicohaemhouts.com/2015/08/03/accessing-nested-javascript-objects-with-string-key/
function getNested(theObject, path, separator = '.') {
  try {
    return path
      .replace('[', separator).replace(']', '')
      .split(separator)
      .reduce(
        (obj, property) => obj[property], theObject,
      );
  } catch (err) {
    return undefined;
  }
}

function setNested(theObject, path, value, separator = '.') {
  const parentPath = path
    .replace('[', separator).replace(']', '')
    .split(separator);
  const subKey = parentPath.pop();
  const parent = getNested(theObject, parentPath.join(separator), separator);
  parent[subKey] = value;
}

const createInitialState = () => ({
  survey: null,
  submission: null,
  tree: null,
  root: null,
  node: null,
});

const initialState = createInitialState();

const getters = {
  survey: state => state.survey,
  submission: state => state.submission,
  property: state => path => getNested(state.submission, path),
  control: state => state.node.model,
  path: (state) => {
    const p = state.node.getPath().map(n => n.model.name).join('.');
    console.log('path', p);
    return p;
  },
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  init({ commit }, { survey, submission }) {
    console.log('draft.store:action:init');

    commit('INIT', { survey, submission });
  },
  setProperty({ commit }, { path, value }) {
    commit('SET_PROPERTY', { path, value });
  },
  next({ commit }) {
    commit('NEXT');
  },
  prev({ commit }) {
    commit('PREV');
  },
  goto({ commit }, path) {
    commit('GOTO', path);
  },
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  INIT(state, { survey, submission }) {
    state.survey = survey;
    state.submission = submission;
    const { controls } = state.survey.revisions.find(revision => revision.version === submission.meta.survey.version);

    const tree = new TreeModel();
    const root = tree.parse({ name: 'data', children: controls });
    state.root = root;

    root.all(n => !!n.parent && n.parent.model.type === 'page').forEach((node) => {
      // node.drop();
    });

    state.tree = tree;
    state.node = root.first(n => !n.isRoot());
    console.log('first node', state.node);
  },
  SET_PROPERTY(state, { path, value }) {
    console.log(`path: ${path}`);
    console.log(`value: ${value}`);

    setNested(state.submission, path, value);
  },
  NEXT(state) {
    const nodes = [];
    state.root.walk((node) => {
      nodes.push(node);
    });
    const index = nodes.indexOf(state.node);
    nodes.splice(0, index + 1);
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].model.type !== 'group') {
        state.node = nodes[i];
        return;
      }
    }
  },
  PREV(state) {
    const nodes = [];
    state.root.walk((node) => {
      nodes.push(node);
    });
    const index = nodes.indexOf(state.node);
    nodes.splice(index);
    nodes.reverse();
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].model.type !== 'group') {
        state.node = nodes[i];
        return;
      }
    }
  },
  GOTO(state, path) {
    state.root.walk((node) => {
      const currentPath = node.getPath().map(n => n.model.name).join('.');
      if (currentPath === path) {
        state.node = node;
        return false;
      }
      return true;
    });
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
