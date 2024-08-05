import { useQuery } from '@tanstack/vue-query';
import store from '../store';
import { getAllSubmissions } from '../store/db';

const useLocalDrafts = () => {
  const { isPending, isError, data } = useQuery({
    queryKey: ['localDrafts'],
    initialData: [],
    queryFn: async () => {
      const idbDrafts = await getAllSubmissions();
      return store.getters['auth/isLoggedIn'] ?
        idbDrafts.filter(draft => draft.meta.creator === store.getters['auth/user']._id) :
        idbDrafts.filter(draft => draft.meta.creator === null);
    },
    networkMode: 'always',
  });

  return { isPending, isError, data };
}

export {
  useLocalDrafts,
};
