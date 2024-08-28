import { useQuery } from '@tanstack/vue-query';
import api from '../services/api.service';
import store from '../store';
import { fetchSurvey } from '@/components/survey/survey';

async function fetchPinned() {
  if (!store.getters['auth/isLoggedIn']) {
    return [];
  }
  /*
    {
      pinned: [
        { pinned: [surveyId1, surveyId2] }
      ]
    }
  */
  const {
    data: { pinned },
  } = await api.get('/surveys/pinned');

  return pinned;
}

async function fetchPinnedSurveys(groupId) {
  const pinned = await fetchPinned();

  const pinnedSurveys = [];
  if (pinned.length === 0) {
    return pinnedSurveys;
  }
  const group = pinned.find((obj) => obj.group_id === groupId);

  for (const sid of group.pinned) {
    const s = await fetchSurvey({ id: sid });
    pinnedSurveys.push(s);
  }

  pinnedSurveys.sort((a, b) => a.name.localeCompare(b.name));
  return pinnedSurveys;
}

const usePinned = () => {
  const { isPending, isError, data } = useQuery({
    queryKey: ['pinnedSurveys'],
    initialData: [],
    queryFn: fetchPinned,
    networkMode: 'offlineFirst',
    staleTime: 1000 * 2,
    initialDataUpdatedAt: 0,
  });

  return { isPending, isError, data };
};

export const isSurveyPinned = (groupId, surveyId) => (data) => {
  if (data.length === 0) {
    return false;
  }
  const group = data.find((obj) => obj.group_id === groupId);
  return group.pinned.some((pid) => pid === surveyId);
};

const useIsSurveyPinned = (groupId, surveyId) => {
  const { isPending, isError, data } = useQuery({
    queryKey: ['pinnedSurveys'],
    initialData: [],
    queryFn: fetchPinned,
    networkMode: 'offlineFirst',
    staleTime: 1000 * 2,
    initialDataUpdatedAt: 0,
    select: isSurveyPinned(groupId, surveyId),
  });

  return { isPending, isError, data };
};

const useGetPinnedSurveysForGroup = (groupId) => {
  const { isPending, isError, data } = useQuery({
    queryKey: ['pinnedSurveysGroup', groupId],
    initialData: [],
    queryFn: ({ queryKey }) => fetchPinnedSurveys(queryKey[1]),
    networkMode: 'offlineFirst',
    staleTime: 1000 * 2,
    initialDataUpdatedAt: 0,
  });

  return { isPending, isError, data };
};

export { usePinned, useIsSurveyPinned, useGetPinnedSurveysForGroup };
