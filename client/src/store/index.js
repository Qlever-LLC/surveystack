import { createStore } from 'vuex';
import createMutationSharer from 'vuex-shared-mutations';

import modules from './modules';

function createStoreObject() {
  return {
    modules: modules,
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

export default createStore(createStoreObject());

export { createStoreObject };
