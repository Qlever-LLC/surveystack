import { useQueryClient, useQuery, useMutation, useIsMutating } from '@tanstack/vue-query';
import { ref } from 'vue';
import api from '../services/api.service';
import * as db from '../store/db';
import store from '../store';

const hasSyncDraftsCompleted = ref(false);

const fetchRemoteDrafts = async () => {
  if (!store.getters['auth/isLoggedIn']) {
    return [];
  }
  const { data: { content } } = await api.get('/submissions/drafts/page');
  return content;
};

const prefetchRemoteDrafts = (queryClient) => {
  return queryClient.prefetchQuery({
    queryKey: ['remoteDrafts'],
    queryFn: fetchRemoteDrafts,
    networkMode: 'offlineFirst',
  });
}

const useRemoteDrafts = () => {
  const { isPending, isError, data } = useQuery({
    queryKey: ['remoteDrafts'],
    initialData: [],
    queryFn: fetchRemoteDrafts,
    networkMode: 'offlineFirst',
    enabled: hasSyncDraftsCompleted,
    staleTime: 1000 * 5,
    initialDataUpdatedAt: 0,
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
      const user = store.getters['auth/user'];
      const localDrafts = (await db.getAllSubmissions()).filter(draft => draft.meta.creator === user._id);
      if (localDrafts.length === 0) {
        return { draftsSynced: false };
      }
      const syncDraftRequests = await Promise.allSettled(
        localDrafts.map(createSyncDraftPromise)
      );
      const successfulSyncs = syncDraftRequests
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      await Promise.allSettled(
        successfulSyncs.map(({ id }) => db.deleteSubmission(id))
      )
      return { draftsSynced: true };
    },
    onSettled: ({ draftsSynced } = {}) => {
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
    },
    mutateAsync: () => {
      const isSyncDraftsPending = isMutating.value > 0;
      if (!isSyncDraftsPending) {
        return mutation.mutateAsync();
      }
      return Promise.resolve();
    }
  };
};

const useDeleteDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: async (draft) => {
      if (!store.getters['auth/isLoggedIn']) {
        // users without an account cannot persist their drafts to the server, so we know their draft must be in idb.
        db.deleteSubmission(draft._id);
        return;
      }
      draft.meta.status = [
        ...draft.meta.status,
        { type: 'READY_TO_DELETE', value: { at: new Date().toISOString() } }
      ];
      await db.persistSubmission(draft);
      await syncDraft(draft);
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
  prefetchRemoteDrafts,
};