import { useStore } from 'vuex';
import { computed } from 'vue';
import api from '@/services/api.service';

export function useSurvey() {
  const store = useStore();

  const isWhitelabel = computed(() => {
    return store.getters['whitelabel/isWhitelabel'];
  });
  const whitelabelPartner = computed(() => {
    return store.getters['whitelabel/partner'];
  });

  async function getSurveys(groupId, searchString, page, limit, user = null) {
    const queryParams = new URLSearchParams();
    if (user) {
      queryParams.append('creator', user);
    }
    if (searchString) {
      queryParams.append('q', searchString);
    }
    if (isWhitelabel.value) {
      queryParams.append('prefix', whitelabelPartner.value.path);
    }

    queryParams.append('groupId', groupId);
    queryParams.append('isLibrary', 'false');
    queryParams.append('skip', (page - 1) * limit);
    queryParams.append('limit', limit);
    queryParams.append('prioPinned', true);

    try {
      const { data } = await api.get(`/surveys/list-page?${queryParams}`);

      if (data.pinned) {
        data.pinned.forEach((s) => {
          s.pinnedSurveys = true;
          data.content.unshift(s);
        });
      }
      delete data.pinned;
      return data;
    } catch (e) {
      // TODO: use cached data?
      console.log('Error fetching surveys:', e);
    }
  }

  return {
    getSurveys,
  };
}
