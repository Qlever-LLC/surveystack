import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';
import { isString, isArray } from 'lodash';

import { catchErrors } from '../handlers/errorHandlers';

import rolesService from '../services/roles.service';
import { db } from '../db';

export const assertAuthenticated = catchErrors(async (req, res, next) => {
  if (!res.locals.auth.isAuthenticated) {
    throw boom.unauthorized('You are not logged in.');
  }

  next();
});

export const assertIsSuperAdmin = (req, res, next) => {
  if (!res.locals.auth.isSuperAdmin) {
    throw boom.unauthorized();
  }

  next();
};

const getEntity = async (id, collection) => {
  return await db.collection(collection).findOne({ _id: new ObjectId(id) });
};

const getEntities = async (ids, collection) => {
  const query = { _id: { $in: ids.map(ObjectId) } };
  const cursor = await db.collection(collection).find(query);
  return cursor.toArray();
};

export const assertEntitiesExist = ({ collection }) =>
  catchErrors(async (req, res, next) => {
    const { ids } = req.body;

    const entities = await getEntities(ids, collection);

    if (entities.length !== ids.length) {
      throw boom.notFound(
        `assertEntitiesExist: One or more entities not found in ${collection} collection.`
      );
    }

    res.locals.existing = entities;

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

    const entity = await getEntity(id, collection);
    if (!entity) {
      throw boom.notFound(
        `assertEntityExists: No entity exists for collection/id: ${collection}/${id}`
      );
    }

    res.locals.existing = entity;

    next();
  });

const hasEntityRights = async ({ entity, auth }) => {
  if (auth.isSuperAdmin) {
    return true;
  }

  if (entity.meta.creator?.equals(auth.user._id)) {
    return true;
  }

  if (!entity.meta.group?.id && !entity.meta.creator) {
    return true;
  }

  const hasAdminRole = await rolesService.hasAdminRole(auth.user._id, entity.meta.group?.id);
  if (hasAdminRole) {
    return true;
  }

  return false;
};

export const assertEntitiesRights = catchErrors(async (req, res, next) => {
  const entities = res.locals.existing;

  const rights = await Promise.all(
    entities.map((entity) => hasEntityRights({ entity, auth: res.locals.auth }))
  );

  if (rights.every(Boolean)) {
    return next();
  }

  throw boom.unauthorized(`Missing entity rights.`);
});

export const assertEntityRights = catchErrors(async (req, res, next) => {
  const entity = res.locals.existing;

  if (await hasEntityRights({ entity, auth: res.locals.auth })) {
    return next();
  }

  throw boom.unauthorized(`No entity rights on: ${entity.id}`);
});

const hasSubmissionRights = async (submission, res) => {
  const survey = await db
    .collection('surveys')
    .findOne({ _id: new ObjectId(submission.meta.survey.id) });
  if (!survey) {
    // survey not found, boom!
    throw boom.notFound(`No survey found: ${submission.meta.survey.id}`);
  }

  const { submissions } = survey.meta;
  if (!submissions) {
    // no meta.submissions param set, assume everyone can submit
    return true;
  }

  if (submissions === 'public') {
    // everyone can submit
    return true;
  }

  if (!res.locals.auth.isAuthenticated) {
    // must be logged in at least, otherwise boom!
    throw boom.unauthorized(`You must be logged in to submit to this survey`);
  }

  if (submissions === 'user') {
    // all logged in users can submit
    return true;
  }

  const userId = res.locals.auth.user._id;
  const groupId = survey.meta.group.id;
  if (!groupId) {
    // survey has no group associated, assume users can submit
    return true;
  }

  const hasUserRole = await rolesService.hasUserRole(userId, groupId);
  const hasAdminRole = await rolesService.hasAdminRole(userId, groupId);

  if (submissions === 'group' && (hasUserRole || hasAdminRole)) {
    // group members can submit
    return true;
  }

  throw boom.unauthorized(`Only group members can submit to this survey`);
};

export const assertSubmissionRights = catchErrors(async (req, res, next) => {
  const submissions = Array.isArray(req.body) ? req.body : [req.body];

  const hasRights = await Promise.all(
    submissions.map((submission) => hasSubmissionRights(submission, res))
  );

  if (hasRights.every((hasRight) => hasRight === true)) {
    return next();
  }

  throw boom.unauthorized('You are not authorized to submit to this survey.');
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

export const assertHasSurveyParam = catchErrors(async (req, res, next) => {
  if (!req.query.survey) {
    throw boom.badRequest('Query param not set: survey');
  }

  if (!ObjectId.isValid(req.query.survey)) {
    throw boom.badRequest(`Invalid survey id: ${req.query.survey}`);
  }

  next();
});

export const assertHasIds = (req, res, next) => {
  if (!isArray(req.body.ids) || req.body.ids.length === 0) {
    throw boom.badRequest('You must specify ids.');
  }

  if (!req.body.ids.every(isString)) {
    throw boom.badRequest('Each ID must be a string');
  }

  next();
};

export const validateBulkReassignRequestBody = (req, res, next) => {
  if (!req.body.ids || req.body.ids.length === 0) {
    throw boom.badRequest('You must specify ids.');
  }

  if (!(req.body.group || req.body.creator)) {
    throw boom.badRequest('You must specify a group, a creator, or both.');
  }

  next();
};
