import canUser from '../helpers/canUser';
import { catchErrors } from '../handlers/errorHandlers';
import boom from '@hapi/boom';

import { db } from '../models';

module.exports = ({ permissions, lastCheck = true, owns = null, getUserPermissions = null }) =>
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
