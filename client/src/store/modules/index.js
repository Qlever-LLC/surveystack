// from https://medium.com/locale-ai/architecting-vuex-store-for-large-scale-vue-js-applications-24c36137e251

/**
 * Automatically imports all the modules and exports as a single module object
 */
/*
const requireModule = require.context('.', false, /\.store\.js$/);
const modules = {};

requireModule.keys().forEach((filename) => {
  // create the module name from fileName
  // remove the store.js extension and capitalize
  const moduleName = filename.replace(/(\.\/|\.store\.js)/g, '');
  // .replace(/^\w/, c => c.toUpperCase());

  modules[moduleName] = requireModule(filename).default || requireModule(filename);
});

export default modules;*/

import appui from './appui.store.js';
import auth from './auth.store.js';
import draft from './draft.store.js';
import feedback from './feedback.store.js';
import invitation from './invitation.store.js';
import memberships from './memberships.store.js';
import readyToSubmit from './readyToSubmit.store.js';
import submissions from './submissions.store.js';
import surveys from './surveys.store.js';
import whitelabel from './whitelabel.store.js';

export default {
  appui,
  auth,
  draft,
  feedback,
  invitation,
  memberships,
  readyToSubmit,
  submissions,
  surveys,
  whitelabel,
};
