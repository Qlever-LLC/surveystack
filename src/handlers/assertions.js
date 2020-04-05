import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';

import canUser from '../helpers/canUser';
import { catchErrors } from '../handlers/errorHandlers';

import { db } from '../db';

export const assertAuthenticated = catchErrors(async (req, res, next) => {
  if (!res.locals.auth.isAuthenticated) {
    throw boom.unauthorized();
  }

  next();
});

export const assertEntityExists = ({ collection }) =>
  catchErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      throw boom.badRequest();
    }

    if (!collection) {
      throw boom.badImplementation();
    }

    const doc = await db.collection(collection).findOne({ _id: new ObjectId(id) });
    if (!doc) {
      throw boom.notFound(`assertEntityExists: No entity exists for id: ${id}`);
    }

    next();
  });

export const assertNameNotEmpty = catchErrors(async (req, res, next) => {
  if (!res.locals.auth.isAuthenticated) {
    throw boom.unauthorized();
  }
  const entity = req.body;
  if (!entity.name || entity.name.trim() === '') {
    throw boom.badRequest('assertNameNotEmpty: Name must not be empty');
  }

  next();
});

export const assertIdsMatch = (req, res, next) => {
  const entity = req.body;
  const id = entity._id;
  if (id != req.params.id) {
    throw boom.badRequest(`assertIdsMatch: Ids do not match: ${id}, ${req.params.id}`);
  }

  next();
};
