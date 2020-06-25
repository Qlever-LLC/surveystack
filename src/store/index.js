import Vue from 'vue';
import Vuex from 'vuex';

import createMutationSharer from 'vuex-shared-mutations';

import modules from './modules';

Vue.use(Vuex);

export default new Vuex.Store({
  modules,
  state: {},
  actions: {
    reset({ commit }) {
      // resets state of all the modules
      console.log('!!! resetting state of all modules !!!');
      Object.keys(modules).forEach(moduleName => commit(`${moduleName}/RESET`));
    },
  },
  mutations: {},
  plugins: [
    createMutationSharer({
      predicate: mutation => mutation.type.startsWith('auth/'),
    }),
  ],
});
