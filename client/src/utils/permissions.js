import { useStore } from 'vuex';

import { checkAllowedToSubmit } from '@/utils/submissions';

export function getPermission() {
  const store = useStore();

  function rightToSubmitSurvey(survey) {
    const { allowed } = checkAllowedToSubmit(
      survey,
      store.getters['auth/isLoggedIn'],
      store.getters['memberships/groups']
    );
    return allowed;
  }

  return {
    rightToSubmitSurvey,
  };
}
