import { useStore } from 'vuex';

import { checkAllowedToSubmit } from '@/utils/submissions';
import { useGroup } from '@/components/groups/group';
import { isPublished } from '../utils/surveys';

export function getPermission() {
  const store = useStore();
  const { isGroupAdmin, getActiveGroupId } = useGroup();

  /**
   * @param {*} survey
   * @returns {allowed: Boolean, message: String}
   */
  function rightToSubmitSurvey(survey) {
    return checkAllowedToSubmit(
      survey, 
      store.getters['auth/isLoggedIn'], 
      store.getters['memberships/groups'], 
      getActiveGroupId(),
    );
  }

  function rightToManageSurvey(survey) {
    return isGroupAdmin(survey.meta.group.id)
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "You can't manage this survey" };
  }

  function rightToCreateSurvey(groupId) {
    return isGroupAdmin(groupId)
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "You can't create a survey in this group." };
  }

  function rightToCallForSubmissions(survey) {
    if (!isGroupAdmin()) {
      return { allowed: false, message: "You can't call for submissions on this survey." };
    }
    if (!isPublished(survey)) {
      return { allowed: false, message: 'You must publish the survey in order to call for submissions.' };
    }
    return { allowed: true, message: 'success' };
  }

  function rightToEditScript(script) {
    return isGroupAdmin(script.meta.group.id) ?
      { allowed: true, message: 'success' } :
      { allowed: false, message: "You can't edit this script." };
  }

  // TODO: This function is currently being used for multiple resources (surveys, scripts, etc.)
  // We should create separate functions for each resource
  function rightToView() {
    const publicAccess = true;
    return publicAccess
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "You can't edit this survey." };
  }

  function rightToViewAnonymizedResults() {
    const publicAccess = true;
    return publicAccess
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "You can't see this result." };
  }

  function rightToManageSubmission(submission) {
    const user = store.getters['auth/user'];
    const memberships = store.getters['memberships/memberships'];
    const isAdminOfSubmissionGroup = memberships.some(
      (membership) => membership.group._id === submission.meta.group.id && membership.role === 'admin'
    );
    const isCreatorOfSubmission = submission.meta.creator === user?._id;

    return isAdminOfSubmissionGroup || isCreatorOfSubmission
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "You can't manage this response." };
  }

  function rightToTogglePin() {
    return store.getters['auth/isLoggedIn'] && isGroupAdmin()
      ? { allowed: true, message: 'success' }
      : { allowed: false, message: "You can't pin and unpin this survey." };
  }

  return {
    rightToSubmitSurvey,
    rightToManageSurvey,
    rightToCreateSurvey,
    rightToCallForSubmissions,
    rightToViewAnonymizedResults,
    rightToEditScript,
    rightToView,
    rightToManageSubmission,
    rightToTogglePin,
  };
}
