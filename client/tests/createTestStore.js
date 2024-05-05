import { createStore } from 'vuex';
import { createStoreObject } from '../src/store';

function createTestStore() {
  return createStore(createStoreObject());
}

export default createTestStore;
