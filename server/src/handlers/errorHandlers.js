import boom from '@hapi/boom';

export const catchErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.log(err);
    if (!err.isBoom) {
      return next(boom.badImplementation(err));
    }
    next(err);
  });
};

export const handleDelegates = (fn) => (req, res, next) => {
  if (res.locals.auth.delegateToUserId) {
    //do checks
    //is entity.meta.submitAsUserId member of a group where res.locals.auth.user._id is admin of;
    //query memberships by role===admin and userid===res.locals.auth.user._id (maybe use assertHasGroupAdminAccess
    //check if entity.meta.submitAsUserId is member of any of these groups in memberships
    //do switch
    res.locals.auth.delegatorUserId = res.locals.auth.user._id;
    res.locals.auth.user._id = res.locals.auth.delegateToUserId;
  }

  fn(req, res, next);
};

export const notFound = (req, res, next) => {
  next(boom.notFound());
};

export const developmentErrors = (err, req, res, next) => {
  console.log('Calling development Errors');
  res.status((err.output && err.output.statusCode) || 500).json({ message: err.message });
};

export const productionErrors = (err, req, res, next) => {
  res
    .status((err.output && err.output.statusCode) || 500)
    .json((err && err.output && err.output.payload) || err);
};

export default {
  catchErrors,
  notFound,
  developmentErrors,
  productionErrors,
};
