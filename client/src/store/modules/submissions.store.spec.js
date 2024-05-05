import createTestStore from '../../../tests/createTestStore';
import { createMockSubmission } from '../../../tests/mockGenerators';
import { createInitialState, types } from './submissions.store';
import { getSubmission, persistSubmission, getAllSubmissions } from '../db';
import api from '../../services/api.service';

jest.mock('../../services/api.service');

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

        expect(store.state.submissions.submissions).toContainEqual(mockSubmission);
      });

      it('replaces the existing submission if a submission with the same id is present', async () => {
        const store = createTestStore();
        const mockSubmission1 = createMockSubmission({ dateModified: new Date('2024-01-01')});
        const mockSubmission2 = createMockSubmission({ _id: mockSubmission1._id, dateModified: new Date('2024-01-02') });
        store.state.submissions.submissions = [mockSubmission1];

        await store.dispatch(`submissions/${types.actions.add}`, mockSubmission2);

        expect(store.state.submissions.submissions).not.toContainEqual(mockSubmission1);
        expect(store.state.submissions.submissions).toContainEqual(mockSubmission2);
      });
    });

    describe(types.actions.remove, () => {
      it('removes the submission with the specified id from state and idb', async () => {
        const store = createTestStore();
        const mockSubmission = createMockSubmission();
        await persistSubmission(mockSubmission);
        store.state.submissions.submissions = [mockSubmission];

        await store.dispatch(`submissions/${types.actions.remove}`, mockSubmission._id);

        const submissionFromIDB = await getSubmission(mockSubmission._id);
        expect(submissionFromIDB).toBeUndefined();
        expect(store.state.submissions.submissions).not.toContainEqual(mockSubmission);
      });
    });

    describe(types.actions.fetchLocalSubmissions, () => {
      it('gets submissions from idb and puts them in state', async () => {
        const store = createTestStore();
        const mockSubmission = createMockSubmission();
        await persistSubmission(mockSubmission);

        await store.dispatch(`submissions/${types.actions.fetchLocalSubmissions}`);

        expect(store.state.submissions.submissions).toContainEqual(mockSubmission);
      });
    });

    describe(types.actions.update, () => {
      it('updates the submission in state and idb', async () => {
        const store = createTestStore();
        const mockSubmission1 = createMockSubmission({ dateModified: new Date('2024-01-01')});
        const mockSubmission2 = createMockSubmission({ _id: mockSubmission1._id, dateModified: new Date('2024-01-02') });
        store.state.submissions.submissions = [mockSubmission1];
        await persistSubmission(mockSubmission1);

        await store.dispatch(`submissions/${types.actions.update}`, mockSubmission2);

        expect(store.state.submissions.submissions).not.toContainEqual(mockSubmission1);
        expect(store.state.submissions.submissions).toContainEqual(mockSubmission2);
        const idbSubmissions = await getAllSubmissions();
        expect(idbSubmissions).toHaveLength(1);
        expect(idbSubmissions).toContainEqual(mockSubmission2);
      });
    });

    describe(types.actions.fetchRemoteSubmission, () => {
      it('fetches the submission with the given id from the server and puts it in state', async () => {
        const store = createTestStore();
        const mockSubmission = createMockSubmission();
        api.get.mockResolvedValueOnce({ data: mockSubmission });

        await store.dispatch(`submissions/${types.actions.fetchRemoteSubmission}`, 'mock-id');

        expect(store.state.submissions.submissions).toContainEqual(mockSubmission);
      });
    });
  });
});
