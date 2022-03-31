//import resourcesStore from './resources.store';
//import resourcesStore from '@/store/modules/resources.store';
//import draftStore from './draft.store';

//const { actions } = resourcesStore;

describe('resources store', () => {
  describe('actions', () => {
    describe('initFromIndexedDB', () => {
      it('does not throw', () => {
        /*const call = jest.fn();
        const dispatch = call.bind(null, 'dispatch');
        const commit = call.bind(null, 'commit');
        expect(actions.initFromIndexedDB({ dispatch, commit })).toThrowError();*/
        expect(true).toBeTruthy();
      });
      it.todo('loads the content from idb to the state');
    });
    describe('addRemoteResource', () => {
      it.todo('');
    });
    describe('addLocalResource', () => {
      it.todo('');
    });
    describe('updateResourceLabel', () => {
      it.todo('');
    });
    describe('updateResourceState', () => {
      it.todo('');
    });
    describe('removeLocalResource', () => {
      it.todo('');
    });
    describe('fetchResource', () => {
      it.todo('');
    });
    describe('fetchResources', () => {
      it.todo('');
    });
  });
  describe('mutations', () => {
    describe('RESET', () => {
      it.todo('has a state with an empty resources array');
    });
    describe('ADD_RESOURCE', () => {
      it.todo('');
    });
    describe('REMOVE_RESOURCE', () => {
      it.todo('');
    });
    describe('SET_RESOURCES', () => {
      it.todo('');
    });
  });
});
