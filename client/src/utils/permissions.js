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

  function rightToManageSubmission(s) {
    const user = store.getters['auth/user'];
    const memberships = store.getters['memberships/memberships'];
    const isAdminOfCurrentGroup = isGroupAdmin();
    const isAdminOfSubmissionGroup = memberships.some(
      (membership) => membership.group._id === s.meta.group.id && membership.role === 'admin'
    );
    const isCreatorOfSubmission = s.meta.creator === user?._id;

    return isAdminOfCurrentGroup || isAdminOfSubmissionGroup || isCreatorOfSubmission
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "Sorry you can't manage this response" };
  }

  function rightToTogglePin() {
    return store.getters['auth/isLoggedIn'] && rightToEdit().allowed
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "Sorry you can't pin and unpin this survey" };
  }

  return {
    rightToSubmitSurvey,
    rightToEdit,
    rightToCallForSubmissions,
    rightToViewAnonymizedResults,
    rightToView,
    rightToManageSubmission,
    rightToTogglePin,
  };
}
