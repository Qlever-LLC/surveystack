import TreeModel from 'tree-model';

import * as surveyUtils from '@/utils/surveys';
import { calculateRelevance } from '@/utils/codeEvaluator';

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
  atStart: true,
  atEnd: false,
  showOverview: false,
  groupPath: null,
  compounds: null,
});

const initialState = createInitialState();

const getters = {
  survey: state => state.survey,
  submission: state => state.submission,
  property: state => path => getNested(state.submission, path),
  control: state => state.node.model,
  path: (state) => {
    const p = state.node.getPath().map(n => n.model.name).join('.');
    return p;
  },
  atStart: state => state.atStart,
  atEnd: state => state.atEnd,
  showOverview: state => state.showOverview,
  groupPath: (state) => {
    if (state.submission.meta && state.submission.meta.group && state.submission.meta.group.path) {
      return state.submission.meta.group.path;
    }
    if (state.survey.meta && state.survey.meta.group && state.survey.meta.group.path) {
      return state.survey.meta.group.path;
    }

    return null;
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
  showOverview({ commit }, show) {
    commit('SHOW_OVERVIEW', show);
  },
  async calculate({ commit, state }, { fname }) {
    await calculateRelevance(state.compounds);
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

    const compounds = [];
    root.walk((node) => {
      if (node.isRoot()) {
        return true;
      }
      const path = node.getPath().map(n => n.model.name).join('.');
      const control = node.model;
      compounds.push({ path, control });
      return true;
    });
    state.compounds = compounds;
  },
  SET_PROPERTY(state, { path, value }) {
    console.log(`path: ${path}`);
    console.log(`value: ${value}`);

    setNested(state.submission, path, value);
  },
  NEXT(state) {
    if (state.atEnd) {
      state.showOverview = true;
      return;
    }

    const traversal = [];
    state.root.walk((node) => {
      if (node.isRoot() || node.model.type === 'group') {
        return true;
      }

      // getPath returns all parent nodes from root to node (including node itself)
      // with slice(1).slice(0,-1) the root and node itself is removed
      const insidePage = node.getPath().slice(1).slice(0, -1).find(parent => parent.model.type === 'page');
      if (insidePage) {
        return true;
      }

      traversal.push(node);
      return true;
    });

    const index = traversal.indexOf(state.node);
    if (traversal.length > index + 1) {
      state.node = traversal[index + 1];
    }

    // update atStart
    if (traversal.leng && state.node === traversal[0]) {
      state.atStart = true;
    } else {
      state.atStart = false;
    }

    if (traversal.length > 0) {
      if (state.node === traversal[0]) {
        state.atStart = true;
      } else {
        state.atEnd = true;
      }

      if (state.node === traversal[traversal.length - 1]) {
        state.atEnd = true;
      } else {
        state.atEnd = false;
      }
    }
  },
  PREV(state) {
    const traversal = [];
    state.root.walk((node) => {
      if (node.isRoot() || node.model.type === 'group') {
        return true;
      }

      // getPath returns all parent nodes from root to node (including node itself)
      // with slice(1).slice(0,-1) the root and node itself is removed
      const insidePage = node.getPath().slice(1).slice(0, -1).find(parent => parent.model.type === 'page');
      if (insidePage) {
        return true;
      }

      traversal.push(node);
      return true;
    });

    const index = traversal.indexOf(state.node);
    if (index > 0) {
      state.node = traversal[index - 1];
    }

    if (traversal.length > 0) {
      if (state.node === traversal[0]) {
        state.atStart = true;
      } else {
        state.atEnd = true;
      }

      if (state.node === traversal[traversal.length - 1]) {
        state.atEnd = true;
      } else {
        state.atEnd = false;
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
  SHOW_OVERVIEW(state, show) {
    console.log('SHOW_OVERVIEW', show);
    state.showOverview = show;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
