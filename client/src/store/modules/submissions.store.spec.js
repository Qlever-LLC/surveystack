import createTestStore from '../../../tests/createTestStore';
import { createMockSubmission } from '../../../tests/mockGenerators';
import { createInitialState, types } from './submissions.store';
import { removeFromIndexedDB, stores as dbStores } from '../db';

jest.mock('../db');

describe('submissions store', () => {
  describe('actions', () => {
    describe(types.actions.reset, () => {
      it('resets to initial state', async () => {
        const store = createTestStore();
        // change part of state so we can confirm reset works
        store.state.submissions.submissions = [{}];

        await store.dispatch(`submissions/${types.actions.reset}`);

        expect(store.state.submissions).toEqual(createInitialState());
      });
    });

    describe(types.actions.add, () => {
      it('adds the submission to the submissions array in state', async () => {
        const store = createTestStore();
        const mockSubmission = createMockSubmission();

        await store.dispatch(`submissions/${types.actions.add}`, mockSubmission);

        expect(store.state.submissions.submissions).toContain(mockSubmission);
      });

      it('replaces the existing submission if a submission with the same id is present', async () => {
        const store = createTestStore();
        const mockSubmission1 = createMockSubmission();
        const mockSubmission2 = createMockSubmission({ _id: mockSubmission1._id });
        store.state.submissions.submissions = [mockSubmission1];

        await store.dispatch(`submissions/${types.actions.add}`, mockSubmission2);

        expect(store.state.submissions.submissions).not.toContain(mockSubmission1);
        expect(store.state.submissions.submissions).toContain(mockSubmission2);
      });
    });

    describe(types.actions.remove, () => {
      it('removes the submission with the specified id from state and idb', async () => {
        const store = createTestStore();
        const mockSubmission = createMockSubmission();
        store.state.submissions.submissions = [mockSubmission];

        await store.dispatch(`submissions/${types.actions.remove}`, mockSubmission._id);

        expect(removeFromIndexedDB).toHaveBeenCalledWith(dbStores.SUBMISSIONS, mockSubmission._id);
        expect(store.state.submissions.submissions).not.toContain(mockSubmission);
      });
    });

    describe(types.actions.fetchLocalSubmissions, () => {
      it('gets submissions from idb and puts them in state', async () => {
        // the code we use to get submissions from idb is not amenable to mocking
        // it's also not amenable to being used with fake-indexeddb to make assertions on the actual db
        // because the idb code in stores/db.js isn't set up to wait for async things
        // so, maybe it's time to bite the bullet and rewrite the idb helpers...
        // Take an hour or two to look at what it would take to use https://github.com/jakearchibald/idb
        // Maybe the existing idb code can keep the same interface, but start using that lib
        // That way, I wouldn't have to consider all the call sites for idb code.
      });
    });

    describe(types.actions.get, () => {});

    describe(types.actions.update, () => {});

    describe(types.actions.fetchRemoteSubmission, () => {});
  });
});
