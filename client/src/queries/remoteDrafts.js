import { useQueryClient, useQuery, useMutation } from '@tanstack/vue-query';
import { ref } from 'vue';
import { useStore } from 'vuex';
import api from '../services/api.service';
import * as db from '../store/db';

const hasSyncDraftsCompleted = ref(false);

const useRemoteDrafts = () => {
  const { isPending, isError, data } = useQuery({
    queryKey: ['remoteDrafts'],
    initialData: [],
    queryFn: async () => {
      const { data: { content } } = await api.get('/submissions/drafts/page');
      return content;
    },
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
  const store = useStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!store.getters['auth/isLoggedIn']) {
        // users without an account cannot persist their drafts to the server.
        return;
      }
      console.log('syncDraftsMutation mutationFn...');
      const user = store.getters['auth/user'];
      const localDrafts = (await db.getAllSubmissions()).filter(draft => draft.meta.creator === user._id);
      console.log({ localDraftsBefore: localDrafts })
      if (localDrafts.length === 0) {
        return;
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
    },
    onSettled: () => {
      hasSyncDraftsCompleted.value = true;
      console.log('syncDraftsMutation onSettled...');
      db.getLocalDrafts();
      queryClient.invalidateQueries({ queryKey: ['remoteDrafts'] })
    },
  })
}

export {
  useRemoteDrafts,
  useSyncDrafts,
};