import Vue from 'vue';
import Vuex from 'vuex';

import modules from './modules';

Vue.use(Vuex);

export default new Vuex.Store({
  modules,
  state: {},
  actions: {
    reset({ commit }) {
      // resets state of all the modules
      Object.keys(modules).forEach(moduleName => commit(`${moduleName}/RESET`));
    },
  },
  mutations: {},
});
