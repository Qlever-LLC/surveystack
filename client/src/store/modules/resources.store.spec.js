import { getMockFile } from '@/components/survey/question_types/File.spec';
import { uploadFileResource } from '@/utils/resources';
import resourcesStore from './resources.store';

jest.mock('@/utils/resources');

const { actions, mutations } = resourcesStore;

describe('resources store', () => {
  describe('actions', () => {
    describe('initFromIndexedDB', () => {
      it('does not throw', async () => {
        const call = jest.fn();
        const dispatch = call.bind(null, 'dispatch');
        const commit = call.bind(null, 'commit');
        await expect(actions.initFromIndexedDB({ dispatch, commit })).resolves.not.toThrowError();
      });
    });
    describe('addRemoteResource', () => {
      const mockFile = getMockFile('test-file-name.txt');

      it('calls addLocalResource', async () => {
        const dispatch = jest.fn().mockReturnValue({ _id: 'mocked-id', key: 'mocked-key' });
        const commit = jest.fn();
        await actions.addRemoteResource({ dispatch, commit }, mockFile);
        expect(dispatch).toHaveBeenCalledWith('addLocalResource', mockFile);
      });
      it('calls uploadFileResource', async () => {
        const dispatch = jest.fn().mockReturnValue({ _id: 'mocked-id', key: 'mocked-key' });
        const commit = jest.fn();
        await actions.addRemoteResource({ dispatch, commit }, mockFile);
        expect(uploadFileResource).toHaveBeenCalled();
      });
      it.todo('loads the newly created remote resource into cache');
    });
    describe('addLocalResource', () => {
      it.todo('stores the resource to the store state');
      it.todo('persists the resource to indexeddb');
    });
    describe('updateResourceLabel', () => {
      it.todo('returns resource with changed label and name');
      it.todo('persists the changed resource to indexeddb');
      it.todo('updates the resource in the store state');
    });
    describe('updateResourceState', () => {
      it.todo('persists the changed resource to indexeddb');
      it.todo('updates the resource in the store state');
    });
    describe('removeLocalResource', () => {
      it.todo('removes the resource from indexedb');
      it.todo('removes the resource from the store state');
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
