import Vue from 'vue';
import Vuex from 'vuex';

import modules from './modules';

Vue.use(Vuex);

export default new Vuex.Store({
<<<<<<< HEAD
  state: {},
  mutations: {},
  actions: {

  },
  modules: {},
=======
  modules,
  state: {},
  actions: {
    reset({ commit }) {
      // resets state of all the modules
      Object.keys(modules).forEach(moduleName => commit(`${moduleName}/RESET`));
    },
  },
  mutations: {},
>>>>>>> b8de28def58b10c96597c2cd65ac58c8cb35df09
});
