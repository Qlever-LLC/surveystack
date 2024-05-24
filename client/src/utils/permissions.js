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
  function rightToCallForSubmissions(survey) {
    console.log(survey);
    return rightToEdit().allowed && survey.latestVersion > 1
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "Sorry you can't call for submissions on a draft" };
  }

  function rightToView() {
    const publicAccess = true;
    return publicAccess
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "Sorry you can't edit this survey" };
  }

  function rightToViewAnonymizedResults() {
    const publicAccess = true;
    return publicAccess
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "Sorry you can't see this result" };
  }

  function rightToManageResponses() {
    return isGroupAdmin()
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "Sorry you can't manage this response" };
  }

  return {
    rightToSubmitSurvey,
    rightToEdit,
    rightToCallForSubmissions,
    rightToViewAnonymizedResults,
    rightToView,
    rightToManageResponses,
  };
}
