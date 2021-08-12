import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';

import canUser from '../helpers/canUser';
import { catchErrors } from '../handlers/errorHandlers';

import rolesService from '../services/roles.service';
import { db } from '../db';

export const assertAuthenticated = catchErrors(async (req, res, next) => {
  if (!res.locals.auth.isAuthenticated) {
    throw boom.unauthorized('You are not logged in.');
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

    const existing = await db.collection(collection).findOne({ _id: new ObjectId(id) });
    if (!existing) {
      throw boom.notFound(
        `assertEntityExists: No entity exists for collection/id: ${collection}/${id}`
      );
    }

    res.locals.existing = existing;

    next();
  });

export const assertEntityRights = catchErrors(async (req, res, next) => {
  const { existing } = res.locals;
  const user = res.locals.auth.user._id;

  if (!res.locals.auth.isSuperAdmin) {
    return next(); // allow super admins to reassign
  }

  if ((!existing.meta.group || !existing.meta.group.id) && !existing.meta.creator) {
    return next(); // no user and no group => free for all! may want to change this behaviour
  }

  if (existing.meta.creator && existing.meta.creator.equals(user)) {
    return next(); // user may delete their own submissions
  }

  const hasAdminRole = await rolesService.hasAdminRole(user, existing.meta.group.id);
  if (hasAdminRole) {
    return next(); // group admins may delete submissions
  }

  throw boom.unauthorized(`No entity rights on: ${existing._id}`);
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
}

export const assertSubmissionRights = catchErrors(async (req, res, next) => {
  const submissions = Array.isArray(req.body) ? req.body : [req.body];

  const hasRights = await Promise.all(submissions.map(submission => hasSubmissionRights(submission, res)));

  if (hasRights.every(hasRight => hasRight === true)) {
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
