import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';

import canUser from '../helpers/canUser';
import { catchErrors } from '../handlers/errorHandlers';

import { db } from '../models';

export const assertAuthenticated = catchErrors(async (req, res, next) => {
  console.log('ENTERING: assertAuthenticated');
  if (!res.locals.auth.isAuthenticated) {
    throw boom.unauthorized();
  }

  console.log('LEAVING: assertAuthenticated');
  next();
});

export const assertEntityExists = ({ collection }) =>
  catchErrors(async (req, res, next) => {
    console.log('ENTERING: assertEntityExists');
    const { id } = req.params;

    if (!id) {
      throw boom.badRequest();
    }

    if (!collection) {
      throw boom.badImplementation();
    }

    const doc = await db.collection(collection).findOne({ _id: new ObjectId(id) });
    if (!doc) {
      throw boom.notFound(`No entity exists for id: ${id}`);
    }

    console.log('LEAVING: assertEntityExists');
    next();
  });

export const assertIdsMatch = (req, res, next) => {
  console.log('ENTERING: assertIdsMatch');

  const entity = req.body;
  const id = entity._id;
  if (id != req.params.id) {
    throw boom.badRequest(`Ids do not match: ${id}, ${req.params.id}`);
  }

  console.log('LEAVING: assertIdsMatch');
  next();
};
