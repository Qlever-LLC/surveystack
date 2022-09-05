import boom from '@hapi/boom';
import { getMemberships } from '../services/membership.service';

export const handleDelegates = (fn) => async (req, res, next) => {
  if (res.locals.auth.delegateToUserId) {
    await checkDelegatePermission(res.locals.auth.user._id, res.locals.auth.delegateToUserId);

    //store actual calling user id
    res.locals.auth.delegateByUserId = res.locals.auth.user._id;
    //overwrite caller by the user id to delegate to
    res.locals.auth.user._id = res.locals.auth.delegateToUserId;
  }

  fn(req, res, next);
};

async function checkDelegatePermission(callerUserId, delegateToUserId) {
  const callerMemberships = await getMemberships(null, callerUserId, null, null, 'admin');
  const delegateUserMemberships = await getMemberships(null, delegateToUserId, null, null);
  const delegateUserIsPartOfACallerGroup = delegateUserMemberships.some((a) =>
    callerMemberships.some((b) => a.group.equals(b.group.toString()))
  );
  if (!delegateUserIsPartOfACallerGroup) {
    throw boom.unauthorized(
      `Delegation to user ${delegateToUserId} by user ${callerUserId} is not allowed as ${delegateToUserId} is not a member of a group ${callerUserId} is admin of`
    );
  }
}
