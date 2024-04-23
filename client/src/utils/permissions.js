import { useStore } from 'vuex';

import { checkAllowedToSubmit } from '@/utils/submissions';
import { useGroup } from '@/components/groups/group';

export function getPermission() {
  const store = useStore();
  const { isGroupAdmin } = useGroup();

  /**
   * @param {*} survey
   * @returns {allowed: Boolean, message: String}
   */
  function rightToSubmitSurvey(survey) {
    return checkAllowedToSubmit(survey, store.getters['auth/isLoggedIn'], store.getters['memberships/groups']);
  }

  function rightToEdit() {
    return isGroupAdmin()
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "Sorry you can't edit this survey" };
  }

  function rightToViewAnonymizedResults() {
    const publicAccess = true;
    return publicAccess
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "Sorry you can't see this result" };
  }

  return {
    rightToSubmitSurvey,
    rightToEdit,
    rightToViewAnonymizedResults,
  };
}
