import { useQueryClient, useQuery, useMutation, useIsMutating } from '@tanstack/vue-query';
import { ref, toRaw } from 'vue';
import api from '../services/api.service';
import * as db from '../store/db';
import store from '../store';

const hasSyncDraftsCompleted = ref(false);

const fetchRemoteDrafts = async () => {
  const { data: { content } } = await api.get('/submissions/drafts/page');
  return content;
};

const useRemoteDrafts = () => {
  const { isPending, isError, data } = useQuery({
    queryKey: ['remoteDrafts'],
    initialData: [],
    queryFn: fetchRemoteDrafts,
    networkMode: 'offlineFirst',
    enabled: hasSyncDraftsCompleted,
  });

  return { isPending, isError, data };
};

const syncDraft = draft => api.post('/submissions/sync-draft', draft);

// eslint-disable-next-line no-async-promise-executor
const createSyncDraftPromise = draft => new Promise(async (resolve, reject) => {
  try {
    resolve({
      id: draft._id,
      requestResult: await syncDraft(draft),
    })
  } catch (error) {
    reject({
      id: draft._id,
      requestResult: error,
    });
  }
});

const useSyncDrafts = () => {
  const queryClient = useQueryClient();
  const isMutating = useIsMutating({ mutationKey: ['syncDrafts'] });
  const mutation = useMutation({
    mutationKey: ['syncDrafts'],
    mutationFn: async () => {
      if (!store.getters['auth/isLoggedIn']) {
        // users without an account cannot persist their drafts to the server.
        return { draftsSynced: false };
      }
      console.log('syncDraftsMutation mutationFn...');
      const user = store.getters['auth/user'];
      const localDrafts = (await db.getAllSubmissions()).filter(draft => draft.meta.creator === user._id);
      console.log({ localDraftsBefore: localDrafts })
      if (localDrafts.length === 0) {
        return { draftsSynced: false };
      }
      const syncDraftRequests = await Promise.allSettled(
        localDrafts.map(createSyncDraftPromise)
      );
      const successfulSyncs = syncDraftRequests
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      const failedSyncs = syncDraftRequests
        .filter(result => result.status === 'rejected')
        .map(result => result.reason);
      console.log({
        successfulSyncs,
        failedSyncs,
      });
      console.log('Removing successfully synced drafts from idb...');
      await Promise.allSettled(
        successfulSyncs.map(({ id }) => db.deleteSubmission(id))
      )
      const localDraftsAfter = (await db.getAllSubmissions()).filter(draft => draft.meta.creator === user._id);
      console.log({ localDraftsAfter });
      return { draftsSynced: true };
    },
    onSettled: ({ draftsSynced } = {}) => {
      console.log('syncDraftsMutation onSettled...');
      hasSyncDraftsCompleted.value = true;
      if (draftsSynced) {
        queryClient.invalidateQueries({ queryKey: ['localDrafts'] });
        queryClient.invalidateQueries({ queryKey: ['remoteDrafts'] });
      }
    },
  });

  return {
    ...mutation,
    mutate: () => {
      const isSyncDraftsPending = isMutating.value > 0;
      if (!isSyncDraftsPending) {
        mutation.mutate();
      }
    }
  };
};

const useDeleteDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: async (draft) => {
      const readyToDeleteDraft = toRaw(draft);
      readyToDeleteDraft.meta.status = [
        ...readyToDeleteDraft.meta.status,
        { type: 'READY_TO_DELETE', value: { at: new Date().toISOString() } }
      ];
      await db.persistSubmission(readyToDeleteDraft);
      await syncDraft(readyToDeleteDraft);
      await db.deleteSubmission(draft._id);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['localDrafts'] });
      queryClient.invalidateQueries({ queryKey: ['remoteDrafts'] });
    },
  });
};

export {
  useRemoteDrafts,
  useSyncDrafts,
  useDeleteDraft,
};