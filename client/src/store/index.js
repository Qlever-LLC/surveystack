import Vue from 'vue';
import Vuex from 'vuex';

import createMutationSharer from 'vuex-shared-mutations';

import modules from './modules';

Vue.use(Vuex);

function createStoreObject() {
  return {
    modules,
    state: {},
    actions: {
      reset({ dispatch }) {
        // resets state of all the modules
        console.log('!!! resetting state of all modules !!!');
        Object.keys(modules).forEach((moduleName) => dispatch(`${moduleName}/reset`));
      },
    },
    mutations: {},
    plugins: [
      createMutationSharer({
        predicate: (mutation) => mutation.type.startsWith('auth/'),
      }),
    ],
  };
}

function createStore() {
  return new Vuex.Store(createStoreObject());
}

export default createStore();

export { createStoreObject };
