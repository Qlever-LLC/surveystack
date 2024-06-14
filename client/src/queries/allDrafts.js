import { computed } from 'vue';
import { useRemoteDrafts } from './remoteDrafts';
import { useLocalDrafts } from './localDrafts';

function sortDateModifiedDescending(a, b) {
  return -a.meta.dateModified.localeCompare(b.meta.dateModified);
}

const useAllDrafts = () => {
  const { isPending: remoteIsPending, isError: remoteIsError, data: remoteDrafts } = useRemoteDrafts();
  const { isPending: localIsPending, isError: localIsError, data: localDrafts } = useLocalDrafts();
  return {
    isPending: computed(() => remoteIsPending.value || localIsPending.value),
    isError: computed(() => remoteIsError.value || localIsError.value),
    data: computed(() => {
      if (localDrafts.value.length === 0) {
        return [...remoteDrafts.value].sort(sortDateModifiedDescending);
      }
      const allDrafts = [...remoteDrafts.value, ...localDrafts.value];
      const uniqueDraftIds = Array.from(new Set(allDrafts.map(({ _id }) => _id)));
      const uniqueDrafts = uniqueDraftIds.map(id => {
        const local = localDrafts.value.find(draft => draft._id === id);
        const remote = remoteDrafts.value.find(draft => draft._id === id);
        if (local && remote) {
          // choose the more recently modified copy
          return local.meta.dateModified.localeCompare(remote.meta.dateModified) === 1 ? local : remote;
        } else {
          return local ?? remote;
        }
      });
      return uniqueDrafts.sort(sortDateModifiedDescending);
    }),
  };
};

export {
  useAllDrafts,
};
