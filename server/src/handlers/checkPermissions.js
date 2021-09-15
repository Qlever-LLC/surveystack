import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';

import canUser from '../helpers/canUser';
import { catchErrors } from '../handlers/errorHandlers';

import { db } from '../db';

export const checkPermissions = ({
  permissions,
  lastCheck = true,
  owns = null,
  getUserPermissions = null,
}) =>
  catchErrors(async (req, res, next) => {
    if (req.authorized) {
      return next();
    }

    let userPermissions = getUserPermissions
      ? await getUserPermissions(req.user, req)
      : req.user.permissions.root;
    userPermissions = !userPermissions ? [] : userPermissions;
    if (canUser(userPermissions, permissions)) {
      if (!owns) {
        req.authorized = true;
      } else {
        const doc = await db
          .collection(owns.collection)
          .findOne({ [owns.modelKey]: req.params[owns.routeParam] });
        const isOwner = doc && doc.owners.contains(res.locals.auth.user._id);
        req.authorized = isOwner;
      }
    }
    if (!req.authorized && lastCheck) {
      throw boom.unauthorized();
    }
    next();
  });

export const authenticated = catchErrors(async (req, res, next) => {
  console.log('inside authenticated');
  if (res.locals.auth.isAuthenticated) return next();

  console.log('boom.unauthorized!');
  throw boom.unauthorized();
});
