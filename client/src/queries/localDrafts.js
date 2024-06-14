import { ref } from 'vue';
import store from '../store';
import { getAllSubmissions } from '../store/db';

const localDraftsState = {
  isPending: ref(false),
  isError: ref(false),
  error: ref(null),
  data: ref([]),
};

const getLocalDrafts = async () => {
  if (localDraftsState.isPending.value) {
    return;
  }
  try {
    localDraftsState.isPending.value = true;
    const idbDrafts = await getAllSubmissions();
    localDraftsState.data.value = store.getters['auth/isLoggedIn'] ?
      idbDrafts.filter(draft => draft.meta.creator === store.getters['auth/user']._id) :
      idbDrafts.filter(draft => draft.meta.creator === null);
    localDraftsState.isError.value = false;
    localDraftsState.error.value = null;
  } catch (error) {
    localDraftsState.data.value = [];
    localDraftsState.isError.value = true;
    localDraftsState.error.value = error;
  } finally {
    localDraftsState.isPending.value = false;
  }
};

const useLocalDrafts = () => {
  getLocalDrafts();
  return {
    ...localDraftsState,
    getLocalDrafts,
  };
}

export {
  getLocalDrafts,
  useLocalDrafts,
};
