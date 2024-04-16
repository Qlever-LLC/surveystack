import { useStore } from 'vuex';

import { checkAllowedToSubmit } from '@/utils/submissions';
import { useGroup } from '@/components/groups/group';

export function getPermission() {
  const store = useStore();
  const { isGroupAdmin } = useGroup();

  function rightToSubmitSurvey(survey) {
    const { allowed } = checkAllowedToSubmit(
      survey,
      store.getters['auth/isLoggedIn'],
      store.getters['memberships/groups']
    );
    return allowed;
  }

  function rightToEditSurvey() {
    return isGroupAdmin();
  }

  function rightToViewAnonymizedResults() {
    return true;
  }

  return {
    rightToSubmitSurvey,
    rightToEditSurvey,
    rightToViewAnonymizedResults,
  };
}
