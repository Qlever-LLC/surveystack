import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';
import { isString, isArray } from 'lodash';

import { catchErrors } from '../handlers/errorHandlers';

import rolesService from '../services/roles.service';
import { db } from '../db';

async function getAllowedGroupIdsToSubmitTo(survey) {
  switch (survey.meta.submissions) {
    case 'groupAndDescendants': {
      const groupAndDescendants = await rolesService.getGroupAndDescendants(survey.meta.group);
      return groupAndDescendants.map((group) => group._id.toString());
    }
    case 'public':
    case 'group':
    default:
      return [survey.meta.group.id.toString()];
  }
}

async function hasRightToSubmitToSurvey(requestSubmission, res) {
  const [existingSubmission, survey] = await Promise.all([
    db.collection('submissions').findOne({ _id: new ObjectId(requestSubmission._id) }),
    db.collection('surveys').findOne({ _id: new ObjectId(requestSubmission.meta.survey.id) }),
  ]);
  const allowedGroupIdsToSubmitTo = await getAllowedGroupIdsToSubmitTo(survey);
  const groupIdToSubmitTo = requestSubmission.meta.group.id;

  if (existingSubmission?.meta?.isDraft) {
    if (!existingSubmission.meta.creator.equals(res.locals.auth.user._id)) {
      throw boom.unauthorized('You are not the creator of this submission.');
    }
  }

  if (
    allowedGroupIdsToSubmitTo.includes(groupIdToSubmitTo) ||
    existingSubmission?.meta?.group?.id?.toString() === groupIdToSubmitTo
  ) {
    if (survey.meta.submissions === 'public') {
      return true;
    } else if (!res.locals.auth.isAuthenticated) {
      throw boom.unauthorized(`You must be logged in to submit to this survey`);
    }

    const hasUserRole = await rolesService.hasUserRole(res.locals.auth.user._id, groupIdToSubmitTo);
    const hasAdminRole = await rolesService.hasAdminRole(
      res.locals.auth.user._id,
      groupIdToSubmitTo
    );
    if (hasUserRole || hasAdminRole || res.locals.auth.isSuperAdmin) {
      return true;
    }
  }

  return false;
}

export const assertHasRightToSubmitSurvey = catchErrors(async (req, res, next) => {
  const submissions = Array.isArray(req.body) ? req.body : [req.body];

  const hasRights = await Promise.all(
    submissions.map((submission) => hasRightToSubmitToSurvey(submission, res))
  );

  if (hasRights.every((hasRight) => hasRight === true)) {
    return next();
  }

  throw boom.unauthorized('You are not authorized to submit to this survey.');
});

async function hasRightToManageSubmission(existingSubmission, res) {
  const groupOfExistingSubmission = existingSubmission.meta.group.id;

  const hasAdminRoleToExistingGroup = await rolesService.hasAdminRole(
    res.locals.auth.user._id,
    groupOfExistingSubmission
  );
  const isCreator = existingSubmission.meta.creator.equals(res.locals.auth.user._id);
  if (hasAdminRoleToExistingGroup || isCreator || res.locals.auth.isSuperAdmin) {
    return true;
  }

  return false;
}

export const assertHasRightToManageSubmission = catchErrors(async (req, res, next) => {
  const existingSubmissions = Array.isArray(res.locals.existing)
    ? res.locals.existing
    : [res.locals.existing];
  if (existingSubmissions.length === 0) {
    throw boom.internal(
      'This assertion requires assertEntityExists or assertEntitiesExist to be run before it.'
    );
  }

  const hasRights = await Promise.all(
    existingSubmissions.map((submission) => hasRightToManageSubmission(submission, res))
  );

  if (hasRights.every((hasRight) => hasRight === true)) {
    return next();
  }

  throw boom.unauthorized('You are not authorized to manage this submission.');
});

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

export const assertHasGroupAdminAccess = catchErrors(async (req, res, next) => {
  if (res.locals.auth.isSuperAdmin) {
    return next();
  }

  if (!res.locals || !res.locals.auth || !res.locals.auth.user || !res.locals.auth.user._id) {
    throw boom.unauthorized();
  }

  const groupId = req.params.groupId || req.body.groupId;

  const hasAdminRoleForRequest = await rolesService.hasAdminRoleForRequest(res, groupId);
  if (!hasAdminRoleForRequest) {
    throw boom.unauthorized();
  }

  next();
});

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

const hasEntityRights = async ({ entity, res }) => {
  if (res.locals.auth.isSuperAdmin) {
    return true;
  }

  if (entity.meta.creator?.equals(res.locals.auth.user._id)) {
    return true;
  }

  if (!entity.meta.group?.id && !entity.meta.creator) {
    return true;
  }

  const hasAdminRoleForRequest = await rolesService.hasAdminRoleForRequest(
    res,
    entity.meta.group?.id
  );
  if (hasAdminRoleForRequest) {
    return true;
  }

  return false;
};

export const assertEntitiesRights = catchErrors(async (req, res, next) => {
  const entities = res.locals.existing;

  const rights = await Promise.all(entities.map((entity) => hasEntityRights({ entity, res })));

  if (rights.every(Boolean)) {
    return next();
  }

  throw boom.unauthorized(`Missing entity rights.`);
});

export const assertEntityRights = catchErrors(async (req, res, next) => {
  const entity = res.locals.existing;

  if (await hasEntityRights({ entity, res })) {
    return next();
  }

  throw boom.unauthorized(`No entity rights on: ${entity._id}`);
});

export const hasSubmissionRights = async (submission, res) => {
  const [existingSubmission, survey] = await Promise.all([
    db.collection('submissions').findOne({ _id: new ObjectId(submission._id) }),
    db.collection('surveys').findOne({ _id: new ObjectId(submission.meta.survey.id) }),
  ]);

  if (!survey) {
    // survey not found, boom!
    throw boom.notFound(`No survey found: ${submission.meta.survey.id}`);
  }

  if (existingSubmission?.meta?.isDraft) {
    if (!existingSubmission.meta.creator.equals(res.locals.auth.user._id)) {
      throw boom.unauthorized('You are not the creator of this submission.');
    }
  }

  if (survey.meta.submissions === 'public') {
    // everyone can submit
    return true;
  }

  if (!res.locals.auth.isAuthenticated) {
    // must be logged in at least, otherwise boom!
    throw boom.unauthorized(`You must be logged in to submit to this survey`);
  }

  const userId = res.locals.auth.user._id;
  const groupId = survey.meta.group.id;
  if (!groupId) {
    // survey has no group associated, assume users can submit
    return true;
  }

  const hasUserRole = await rolesService.hasUserRole(userId, groupId);
  const hasAdminRoleForRequest = await rolesService.hasAdminRoleForRequest(res, groupId);

  if (survey.meta.submissions === 'group' && (hasUserRole || hasAdminRoleForRequest)) {
    // group members can submit
    return true;
  }

  throw boom.unauthorized(`Only group members can submit to this survey`);
};

export const assertNameNotEmpty = catchErrors(async (req, res, next) => {
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

export const checkFeatureToggledOn = (toggleName) => async (req, res, next) => {
  if (await res.locals.isToggleOn(toggleName)) {
    next();
  } else {
    next(boom.notImplemented('this feature is turned off'));
  }
};

export const assertIsAtLeastOnceOwner = async (req, res, next) => {
  const userId = res.locals.auth.user._id;
  const ownership = await db.collection('farmos-instances').findOne({
    userId: new ObjectId(userId),
    owner: true,
  });
  if (!ownership) {
    throw boom.unauthorized();
  }

  next();
};

export const assertIsOwnerOfInstance = async (req, res, next) => {
  const userId = res.locals.auth.user._id;
  const { instanceName } = req.body;
  if (!instanceName) {
    throw boom.badRequest('instance name missing');
  }
  const ownership = await db.collection('farmos-instances').findOne({
    userId: new ObjectId(userId),
    instanceName: instanceName,
    owner: true,
  });
  if (!ownership) {
    throw boom.unauthorized();
  }

  next();
};
