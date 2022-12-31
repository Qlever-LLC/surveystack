import boom from '@hapi/boom';
import { getMemberships } from '../services/membership.service';

export const handleDelegates = (fn) => async (req, res, next) => {
  if (res.locals.auth.delegateToUserId) {
    await checkProxyPermission(res.locals.auth.user._id, res.locals.auth.delegateToUserId);

    //store actual calling user id
    res.locals.auth.proxyUserId = res.locals.auth.user._id;
    //overwrite caller by the user id to delegate to
    res.locals.auth.user._id = res.locals.auth.delegateToUserId;
  }

  await fn(req, res, next);
};

async function checkProxyPermission(proxyUserId, delegateToUserId) {
  const proxyUserMemberships = await getMemberships({ user: proxyUserId, role: 'admin' });
  const delegateUserMemberships = await getMemberships({ user: delegateToUserId });
  const delegateUserIsPartOfACallerGroup = delegateUserMemberships.some((a) =>
    proxyUserMemberships.some((b) => a.group.equals(b.group.toString()))
  );
  if (!delegateUserIsPartOfACallerGroup) {
    throw boom.unauthorized(
      `Delegation to user ${delegateToUserId} by user ${proxyUserId} is not allowed as ${delegateToUserId} is not a member of a group ${proxyUserId} is admin of`
    );
  }
}
