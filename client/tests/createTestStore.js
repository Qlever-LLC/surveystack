import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { createStoreObject } from '../src/store';

function createTestStore() {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store(createStoreObject());
  return store;
}

export default createTestStore;
