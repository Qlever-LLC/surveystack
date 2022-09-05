import boom from '@hapi/boom';

export const handleDelegates = (fn) => (req, res, next) => {
  if (res.locals.auth.delegateToUserId) {
    //do checks
    //is entity.meta.submitAsUserId member of a group where res.locals.auth.user._id is admin of;
    //query memberships by role===admin and userid===res.locals.auth.user._id (maybe use assertHasGroupAdminAccess
    //check if entity.meta.submitAsUserId is member of any of these groups in memberships
    //do switch
    res.locals.auth.delegateByUserId = res.locals.auth.user._id;
    res.locals.auth.user._id = res.locals.auth.delegateToUserId;
  }

  fn(req, res, next);
};
