import _, { isError } from 'lodash';

import { ObjectId } from 'mongodb';

import boom from '@hapi/boom';

import { db, mongoClient } from '../db';
import { withTransaction, withSession } from '../db/helpers';
import * as csvService from '../services/csv.service';
import headerService from '../services/header.service';
import handleApiCompose from './utils/handleApiCompose';
import rolesService from '../services/roles.service';
import mailService from '../services/mail/mail.service';
import pdfService from '../services/pdf.service';
import { queryParam } from '../helpers';
import { appendDatabaseOperationDurationToLoggingMessage } from '../middleware/logging';
import { getServerSelfOrigin } from '../services/auth.service';
const col = 'submissions';
const USERS_COLLECTION = 'users';
const DEFAULT_LIMIT = 100000;
const DEFAULT_SORT = { _id: -1 }; // reverse insert order

// NOTE: when adding fields to a submission
// you may need to adapt csv.service.js in both back-end and front-end
const sanitize = async (entity) => {
  if (entity._id) {
    entity._id = new ObjectId(entity._id);
  }

  entity.meta.dateCreated = new Date(entity.meta.dateCreated);
  entity.meta.dateModified = new Date(entity.meta.dateModified);
  entity.meta.dateSubmitted = new Date();
  entity.meta.survey.id = new ObjectId(entity.meta.survey.id);
  entity.meta.isDeletedDraft = false;

  // Delete temporal data that is used in client to render Proxy data
  delete entity.meta.submitAsUser;

  if (entity.meta.group) {
    if (entity.meta.group.id) {
      const _id = new ObjectId(entity.meta.group.id);
      entity.meta.group.id = _id;
      const group = await db.collection('groups').findOne({ _id });
      if (group) {
        entity.meta.group.path = group.path;
      }
    }
  }

  if (entity.meta.creator) {
    entity.meta.creator = new ObjectId(entity.meta.creator);
  }

  if (entity.meta.original) {
    entity.meta.original = new ObjectId(entity.meta.original);
  }

  // TODO: may want to save dateModified from nested data meta fields
  // as new Date(..) as well, currently it is just a string

  return entity;
};

const sanitizeMatch = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'object') {
      // check for {"$date": "2020-01-30"}
      // and transform it into new Date("2020-01-30")
      if (obj[key]['$date']) {
        const v = obj[key]['$date'];
        obj[key] = new Date(v);
        return;
      }

      if (obj[key]['$oid']) {
        const v = obj[key]['$oid'];
        obj[key] = new ObjectId(v);
        return;
      }

      // if (/^.*\.(creator|id)$/) {
      //   obj[key] = ObjectId(obj[key]);
      //   return;
      // }
      sanitizeMatch(obj[key]);
    }
  });
};

const createRedactStage = (user, roles) => {
  return {
    $redact: {
      $switch: {
        branches: [
          // check if user is creator
          {
            case: { $eq: [user ? new ObjectId(user) : 'NO_AUTH_USER', '$$ROOT.meta.creator'] },
            then: '$$KEEP',
          },
          // check for owner rights
          {
            case: {
              $in: [
                user ? new ObjectId(user) : 'NO_AUTH_USER',
                { $ifNull: ['$$ROOT.meta.owners', []] },
              ],
            },
            then: '$$KEEP',
          },
          // check if meta.permissions does not exist or is empty
          {
            case: { $eq: [{ $size: { $ifNull: ['$meta.permissions', []] } }, 0] },
            then: '$$DESCEND',
          },
          // check if user has specific role
          // e.g. "meta.permissions": ['admin'], "$$ROOT.meta.group.path": "/oursci/lab/"
          // => User needs 'admin@/oursci/lab/' to view
          {
            case: {
              $gt: [
                {
                  $size: {
                    $setIntersection: [
                      {
                        $concatArrays: [
                          {
                            $map: {
                              input: '$meta.permissions',
                              as: 'role',
                              in: { $concat: ['$$role', '@', '$$ROOT.meta.group.path'] },
                            },
                          },
                        ],
                      },
                      roles,
                    ],
                  },
                },
                0,
              ],
            },
            then: '$$DESCEND',
          },
          // Assume "meta.permissions": ['admin'] and "$$ROOT.meta.group.path": "/oursci/lab/testing/"
          // => submission_role = "admin@/oursci/lab/testing/"
          // A user role of "admin@/oursci/" can view, since
          // "admin@/oursci/lab/testing" is a regexMatch of "^admin@/oursci/"
          // TODO: with this case branch, we probably don't even need the one from before
          {
            case: {
              $anyElementTrue: {
                $map: {
                  input: {
                    $map: {
                      input: '$meta.permissions',
                      as: 'role',
                      in: { $concat: ['$$role', '@', '$$ROOT.meta.group.path'] },
                    },
                  },
                  as: 'submission_role',
                  in: {
                    $anyElementTrue: {
                      $map: {
                        input: roles,
                        as: 'user_role',
                        in: {
                          $regexMatch: {
                            input: '$$submission_role',
                            regex: { $concat: ['^', '$$user_role'] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            then: '$$DESCEND',
          },
        ],
        default: '$$PRUNE', // default do not proceed
      },
    },
  };
};

const createRelevanceStage = () => {
  return {
    $redact: {
      $cond: {
        if: { $eq: ['$meta.relevant', false] },
        then: '$$PRUNE',
        else: '$$DESCEND',
      },
    },
  };
};

const buildPipeline = async (req, res) => {
  const pipeline = [];

  let match = {};
  let project = {};
  let sort = DEFAULT_SORT;
  let user = null;
  let roles = [];

  // initial match stage to filter surveys
  if (req.query.survey) {
    pipeline.push({
      $match: { 'meta.survey.id': new ObjectId(req.query.survey) },
    });
  }

  pipeline.push({
    $match: { 'meta.isDraft': false },
  });

  // archived
  const archivedMatch = { 'meta.archived': { $ne: true } };
  if (queryParam(req.query.showArchived)) {
    archivedMatch['meta.archived'] = true;
  }
  pipeline.push({ $match: archivedMatch });

  if (req.query.creator) {
    pipeline.push({
      $match: {
        'meta.creator': new ObjectId(req.query.creator),
      },
    });
  }

  if (req.query.group) {
    pipeline.push({
      $match: {
        'meta.group.id': new ObjectId(req.query.group),
      },
    });
  }

  // Authenticated either Authorization header or Cookie
  if (res.locals.auth.isAuthenticated) {
    // Authorization header
    user = res.locals.auth.user._id.toString();
    roles.push(...res.locals.auth.roles);
  } else if (req.cookies.user && req.cookies.token) {
    // Cookie
    user = req.cookies.user;
    const userRoles = await rolesService.getRoles(user);
    roles.push(...userRoles);
    if (res.locals.auth.user) {
      res.locals.auth.user._id = user;
    } else {
      res.locals.auth.user = { _id: user };
    }
    res.locals.auth.isSuperAdmin = await rolesService.hasSuperAdminRole(user);
  }

  // Add creator details if request has admin rights on survey.
  // However, don't add creator details if pure=1 is set (e.g. for re-submissions)
  if (user && req.query.survey && !queryParam(req.query.pure)) {
    const survey = await db.collection('surveys').findOne({ _id: new ObjectId(req.query.survey) });
    const groupId = survey.meta.group.id;
    const hasAdminRights = await rolesService.hasAdminRoleForRequest(res, groupId);

    if (hasAdminRights) {
      addUserDetailsStage(pipeline, req.query.userIdCorrespondingToSearch);
    }
  }

  // Hide fields with meta.relevant = false (and below) by default
  // However, don't hide if query showIrrelevant=1 or pure=1
  if (!queryParam(req.query.showIrrelevant) && !queryParam(req.query.pure)) {
    const relevanceStage = createRelevanceStage();
    pipeline.push(relevanceStage);
  }

  // For development purposes
  if (process.env.NODE_ENV === 'development' && req.query.roles) {
    try {
      const splits = req.query.roles.split(',');
      splits.forEach((role) => {
        roles.push(role.trim());
      });
    } catch (error) {
      console.log(error);
    }
  }

  const redactStage = createRedactStage(user, roles);
  pipeline.push(redactStage);

  // user defined match stage
  if (req.query.match) {
    try {
      const m = JSON.parse(req.query.match);
      match = { ...match, ...m };
      sanitizeMatch(match);
    } catch (error) {
      throw boom.badRequest('invalid match query');
    }
    pipeline.push({ $match: match });
  }

  // project stage
  if (req.query.project) {
    try {
      const p = JSON.parse(req.query.project);
      project = { ...project, ...p };
    } catch (error) {
      throw boom.badRequest('invalid project query');
    }

    if (!_.isEmpty(project)) {
      if (_.some(project, (v) => v === 0) && _.some(project, (v) => v === 1)) {
        throw boom.badRequest(`One can not mix and match inclusion and exclusion in project stage`);
      }

      pipeline.push({ $project: project });
    }
  }

  // sort stage
  if (req.query.sort) {
    try {
      const s = JSON.parse(req.query.sort);
      if (!_.isEmpty(s)) {
        sort = s;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query parameter sort: ${sort}`);
    }

    _.forOwn(sort, (v) => {
      if (v !== -1 && v !== 1) {
        throw boom.badRequest(`Bad query parameter sort, value must be either 1 or -1`);
      }
    });
  }

  if (!queryParam(req.query.unsorted)) {
    pipeline.push({
      $sort: sort,
    });
  }
  return pipeline;
};

const addCreatorDetailStage = (pipeline, user) => {
  pipeline.push(
    {
      $lookup: {
        from: 'users',
        let: { creatorId: '$meta.creator' },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$_id', '$$creatorId'] } },
                { $expr: { $ne: ['$$creatorId', new ObjectId(user)] } },
              ],
            },
          },
          { $project: { name: 1, email: 1, _id: 1 } },
        ],
        as: 'meta.submitAsUser',
      },
    },
    {
      $unwind: { path: '$meta.submitAsUser', preserveNullAndEmptyArrays: true },
    }
  );
};

const addUserDetailsStage = (pipeline, userIdCorrespondingToSearch) => {
  pipeline.push({
    $lookup: {
      from: 'users',
      let: { creatorId: '$meta.creator' },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$creatorId'] } } },
        { $project: { name: 1, email: 1, _id: 0 } },
      ],
      as: 'meta.creatorDetail',
    },
  });
  pipeline.push({
    $unwind: { path: '$meta.creatorDetail', preserveNullAndEmptyArrays: true },
  });

  pipeline.push({
    $lookup: {
      from: 'users',
      let: { proxyUserId: '$meta.proxyUserId' },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$proxyUserId'] } } },
        { $project: { name: 1, email: 1, _id: 0 } },
      ],
      as: 'meta.proxyUserDetail',
    },
  });
  pipeline.push({
    $unwind: { path: '$meta.proxyUserDetail', preserveNullAndEmptyArrays: true },
  });

  pipeline.push({
    $lookup: {
      from: 'users',
      let: { resubmitterUserId: '$meta.resubmitter' },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$resubmitterUserId'] } } },
        { $project: { name: 1, email: 1, _id: 0 } },
      ],
      as: 'meta.resubmitterUserDetail',
    },
  });
  pipeline.push({
    $unwind: { path: '$meta.resubmitterUserDetail', preserveNullAndEmptyArrays: true },
  });

  if (userIdCorrespondingToSearch) {
    const userIds = userIdCorrespondingToSearch.map((id) => ObjectId(id));
    pipeline.push({
      $match: {
        'meta.creator': { $in: userIds },
      },
    });
  }
};

const getSubmissionsPage = async (req, res) => {
  const pipeline = await buildPipeline(req, res);
  const skip = getSkip(req);
  const limit = getLimit(req);

  if (req.query.search) {
    const pipelineSearchName = [
      {
        $match: {
          name: {
            $regex: req.query.search,
            $options: 'i',
          },
        },
      },
    ];
    const users = await db.collection(USERS_COLLECTION).aggregate(pipelineSearchName).toArray();
    req.query.userIdCorrespondingToSearch = users.map((user) => new ObjectId(user._id));
  }

  // pagination stage
  const paginationStages = [
    {
      $facet: {
        content: [{ $skip: skip }, { $limit: limit }],
        pagination: [{ $count: 'total' }, { $addFields: { skip, limit } }],
      },
    },
    { $unwind: '$pagination' },
  ];

  pipeline.push(...paginationStages);

  const [entities] = await db.collection(col).aggregate(pipeline, { allowDiskUse: true }).toArray();

  if (!entities) {
    return res.send({
      content: [],
      headers: [],
      pagination: { total: 0, skip: 0, limit: DEFAULT_LIMIT },
    });
  }

  try {
    const headers = await headerService.getHeaders(req.query.survey, entities.content, {
      excludeDataMeta: !queryParam(req.query.showCsvDataMeta),
    });
    entities.headers = headers;
  } catch (error) {
    console.error('error creating headers', error);
    entities.headers = [];
  }

  return res.send(entities);
};

const getSubmissions = async (req, res) => {
  const pipeline = await buildPipeline(req, res);
  addSkipToPipeline(pipeline, req);
  addLimitToPipeline(pipeline, req);

  const databaseOperationStartTime = new Date();
  const entities = await db.collection(col).aggregate(pipeline, { allowDiskUse: true }).toArray();
  appendDatabaseOperationDurationToLoggingMessage(
    res,
    Date.now() - databaseOperationStartTime.valueOf()
  );

  return res.send(entities);
};

const getSkip = (req) => {
  if (req.query.skip) {
    try {
      const skip = Number.parseInt(req.query.skip);
      return skip > 0 ? skip : 0;
    } catch (error) {
      throw boom.badRequest(`Bad query parameter skip: ${req.query.skip}`);
    }
  }
  return 0;
};

const getLimit = (req) => {
  if (req.query.limit) {
    try {
      const limit = Number.parseInt(req.query.limit);
      return limit > 0 ? limit : DEFAULT_LIMIT;
    } catch (error) {
      throw boom.badRequest(`Bad query parameter limit: ${req.query.limit}`);
    }
  }
  return DEFAULT_LIMIT;
};

const addSkipToPipeline = (pipeline, req) => {
  const skip = getSkip(req);
  if (req.query.skip && skip > 0) {
    pipeline.push({ $skip: skip });
  }
};

const addLimitToPipeline = (pipeline, req) => {
  const limit = getLimit(req);
  if (req.query.limit && limit > 0) {
    pipeline.push({ $limit: limit });
  }
};

const getSubmissionsCsv = async (req, res) => {
  const pipeline = await buildPipeline(req, res);
  addSkipToPipeline(pipeline, req);
  addLimitToPipeline(pipeline, req);

  const formatOptions = {
    expandAllMatrices: queryParam(req.query.expandAllMatrices),
    expandMatrix: _.isArray(req.query.expandMatrix)
      ? req.query.expandMatrix
      : _.isString(req.query.expandMatrix)
      ? [req.query.expandMatrix]
      : [],
  };

  const entities = await db.collection(col).aggregate(pipeline, { allowDiskUse: true }).toArray();
  const transformer = (entity) => {
    let data = csvService.transformSubmissionQuestionTypes(
      entity.data,
      {
        geoJSON: csvService.geojsonTransformer,
        file: csvService.fileTransformer,
        image: csvService.fileTransformer,
        matrix: csvService.matrixTransformer,
      },
      formatOptions
    );

    data = csvService.removeMetaFromQuestions(data);

    const result = {
      _id: entity._id,
      data,
    };

    if (queryParam(req.query.showCsvMeta)) {
      result.meta = entity.meta;
    }

    return result;
  };
  let transformedEntities = entities.map(transformer);

  const headers = await headerService.getHeaders(req.query.survey, transformedEntities, {
    excludeDataMeta: false,
    splitValueFieldFromQuestions: true,
  });

  const csv = csvService.createCsv(transformedEntities, headers);
  res.set('Content-Type', 'text/plain');
  return res.send(csv);
};

const getSubmission = async (req, res) => {
  const { id } = req.params;
  const pipeline = [];

  let user = null;
  let roles = [];

  // Authenticated either Authorization header or Cookie
  if (res.locals.auth.isAuthenticated) {
    // Authorization header
    user = res.locals.auth.user._id.toString();
    roles.push(...res.locals.auth.roles);
  } else if (req.cookies.user && req.cookies.token) {
    // Cookie
    user = req.cookies.user;
    const userRoles = await rolesService.getRoles(user);
    roles.push(...userRoles);
    if (res.locals.auth.user) {
      res.locals.auth.user._id = user;
    } else {
      res.locals.auth.user = { _id: user };
    }
    res.locals.auth.isSuperAdmin = await rolesService.hasSuperAdminRole(user);
  }

  if (user) {
    // Add creator details as `meta.submitAsUser` if pure=1 is set (re-submissions)
    // This will allow admin/proxy can resubmit with correct request header
    if (queryParam(req.query.pure)) {
      addCreatorDetailStage(pipeline, user);
    }

    // Add creator details if request has admin rights on survey.
    // However, don't add creator details if pure=1 is set (e.g. for re-submissions)
    else {
      const groupId = res.locals.existing.meta.group.id;
      const hasAdminRights = await rolesService.hasAdminRoleForRequest(res, groupId);

      if (hasAdminRights) {
        addUserDetailsStage(pipeline);
      }
    }
  }

  // Hide fields with meta.relevant = false (and below) by default
  // However, don't hide if query showIrrelevant=1 or pure=1
  if (!queryParam(req.query.showIrrelevant) && !queryParam(req.query.pure)) {
    const relevanceStage = createRelevanceStage();
    pipeline.push(relevanceStage);
  }

  // Fetch by id
  pipeline.push({ $match: { _id: new ObjectId(id) } });

  // Redact
  const redactStage = createRedactStage(user, roles);
  pipeline.push(redactStage);

  const [entity] = await db.collection(col).aggregate(pipeline).toArray();
  if (!entity) {
    throw boom.notFound(`No entity found for id: ${id}`);
  }

  return res.send(entity);
};

const prepareCreateSubmissionEntity = async (submission, res) => {
  const entity = await sanitize(submission);

  const isReadyToSubmit = submission.meta.status.some(
    (status) => status.type === 'READY_TO_SUBMIT'
  );
  if (submission.meta.isDraft && !isReadyToSubmit) {
    throw boom.badData('Draft must be ready to submit.');
  }

  /*
    Clear all existing statuses. At the time of this comment, none of the possible statuses
    make sense to be on submitted submissions, and this function is responsible for preparing
    submitted submission (not draft submissions). This could change in the future, at which point
    we should update this logic to only clear some statuses. The current statuses are:
    'READY_TO_SUBMIT', 'READY_TO_DELETE', 'UNAUTHORIZED_TO_SUBMIT' and 'FAILED_TO_SUBMIT'
  */
  entity.meta.status = [];
  entity.meta.isDraft = false;

  const survey = await db.collection('surveys').findOne({ _id: entity.meta.survey.id });
  if (!survey) {
    throw boom.notFound(`No survey found with id: ${entity.meta.survey.id}`);
  }

  if (res.locals.auth.isAuthenticated) {
    entity.meta.creator = res.locals.auth.user._id;
    if (res.locals.auth.proxyUserId) {
      entity.meta.proxyUserId = res.locals.auth.proxyUserId;
    }
  } else {
    entity.meta.creator = null;
    // set submission group to survey's group for now
    if (survey.meta.group) {
      entity.meta.group = survey.meta.group;
    }
  }

  return { entity, survey };
};

const createSubmission = async (req, res) => {
  const submissions = Array.isArray(req.body) ? req.body : [req.body];

  let submissionEntities = await Promise.all(
    submissions.map((submission) => prepareCreateSubmissionEntity(submission, res))
  );

  let apiComposeResults = {};
  try {
    const composeResults = await handleApiCompose(submissionEntities, res.locals.auth.user);
    apiComposeResults = composeResults.results;
    submissionEntities = composeResults.entities;
  } catch (errorObject) {
    return res.status(503).send(errorObject);
  }

  const results = await withSession(mongoClient, async (session) => {
    try {
      return await withTransaction(session, async () => {
        const submissionsToInsert = submissionEntities.map(({ entity }) => entity);

        const insertResult = await db.collection(col).insertMany(submissionsToInsert);

        if (submissionsToInsert.length !== Object.keys(insertResult.insertedIds).length) {
          await session.abortTransaction();
          return;
        }

        return insertResult;
      });
    } catch (error) {
      throw boom.boomify(error);
    }
  });

  if (!results) {
    throw boom.internal('The transaction was intentionally aborted.');
  }

  res.send(apiComposeResults);
};

const updateSubmission = async (req, res) => {
  const { id } = req.params;

  if (req.body.meta.isDraft === true) {
    throw boom.badData('Draft submissions cannot but updated with this endpoint.');
  }

  let newSubmission = await sanitize(req.body);
  const oldSubmission = res.locals.existing;

  // update with upped revision and resubmitter
  newSubmission.meta.revision = oldSubmission.meta.revision + 1;
  newSubmission.meta.resubmitter = new ObjectId(res.locals.auth.user._id);

  // re-insert old submission version with a new _id
  oldSubmission._id = new ObjectId();
  oldSubmission.meta.original = new ObjectId(id);
  oldSubmission.meta.archived = true;
  oldSubmission.meta.archivedReason = newSubmission.meta.archivedReason || 'RESUBMIT';
  await db.collection(col).insertOne(oldSubmission);

  const survey = await db.collection('surveys').findOne({ _id: newSubmission.meta.survey.id });
  if (!survey) {
    throw boom.notFound(`No survey found with id: ${newSubmission.meta.survey.id}`);
  }

  let apiComposeResults = {};
  const creator = await db.collection('users').findOne({ _id: newSubmission.meta.creator });
  try {
    const composeResults = await handleApiCompose(
      [{ entity: newSubmission, prevEntity: oldSubmission, survey }],
      creator
    );
    apiComposeResults = composeResults.results;
    newSubmission = composeResults.entities[0].entity;
  } catch (errorObject) {
    return res.status(503).send(errorObject);
  }

  const updateOperation = {
    data: newSubmission.data,
    'meta.group': newSubmission.meta.group,
    'meta.revision': newSubmission.meta.revision,
    'meta.resubmitter': newSubmission.meta.resubmitter,
    'meta.dateModified': newSubmission.meta.dateModified,
    'meta.dateSubmitted': newSubmission.meta.dateSubmitted,
    'meta.specVersion': newSubmission.meta.specVersion,
    'meta.status': [], // there are no statuses relevant to submitted (non draft) submissions, so we clear statuses if there happen to be any
  };

  const updated = await db.collection(col).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateOperation },
    {
      returnDocument: 'after',
    }
  );

  return res.send({ ...updated.value, ...apiComposeResults });
};

const bulkReassignSubmissions = async (req, res) => {
  const { group, creator, ids } = req.body;
  let submissions = res.locals.existing;

  const surveyIds = [
    ...new Set(submissions.map((submission) => submission.meta.survey.id.toString())),
  ];
  const surveys = await db
    .collection('surveys')
    .find({
      _id: { $in: surveyIds.map(ObjectId) },
    })
    .toArray();
  if (surveys.length !== surveyIds.length) {
    throw boom.notFound(`Survey referenced by submission not found.`);
  }

  let apiComposeResults = {};
  try {
    const submissionsWithSurveys = submissions.map((submission) => ({
      entity: submission,
      prevEntity: submission,
      survey: surveys.find(({ _id }) => submission.meta.survey.id.toString() === _id.toString()),
    }));
    const composeResults = await handleApiCompose(submissionsWithSurveys, res.locals.auth.user);
    apiComposeResults = composeResults.results;
    submissions = composeResults.entities.map((s) => s.entity);
  } catch (errorObject) {
    if (isError(errorObject)) {
      throw errorObject;
    }
    return res.status(503).send(errorObject);
  }

  // let farmOsResults;
  // try {
  //   const farmOsResponses = await Promise.all(
  //     submissions.map((submission) =>
  //       farmOsService.handle({
  //         submission,
  // survey: surveys.find(
  //   ({ _id }) => submission.meta.survey.id.toString() === _id.toString()
  // ),
  //         user: res.locals.auth.user,
  //       })
  //     )
  //   );
  //   farmOsResults = farmOsResponses.flat();
  // } catch (error) {
  //   console.log('error handling farmos', error);
  //   return res.status(503).send({
  //     message: `Error submitting to farmos ${error}`,
  //     farmos: error.messages,
  //   });
  // }

  const results = await withSession(mongoClient, async (session) => {
    try {
      return await withTransaction(session, async () => {
        const submissionsToArchive = submissions.map((submission) => ({
          ...submission,
          _id: new ObjectId(),
          meta: {
            ...submission.meta,
            original: new ObjectId(submission._id),
            archived: true,
            archivedReason: 'REASSIGN',
          },
        }));

        const insertResult = await db.collection(col).insertMany(submissionsToArchive);

        if (submissionsToArchive.length !== Object.keys(insertResult.insertedIds).length) {
          await session.abortTransaction();
          return;
        }

        const { _id: groupId, path: groupPath } = group
          ? await db.collection('groups').findOne({ _id: new ObjectId(group) })
          : {};

        const updateResult = await db.collection(col).updateMany(
          { _id: { $in: ids.map(ObjectId) } },
          {
            $set: {
              ...(group ? { 'meta.group.id': groupId, 'meta.group.path': groupPath } : {}),
              ...(creator ? { 'meta.creator': ObjectId(creator) } : {}),
            },
            $inc: { 'meta.revision': 1 },
          }
        );

        if (submissions.length !== updateResult.modifiedCount) {
          await session.abortTransaction();
          return;
        }

        return updateResult;
      });
    } catch (error) {
      throw boom.boomify(error);
    }
  });

  if (!results) {
    throw boom.internal('The transaction was intentionally aborted.');
  }

  res.send(apiComposeResults);
};

const reassignSubmission = async (req, res) => {
  const { id } = req.params;
  const { body } = req;

  let existing = res.locals.existing;
  const updatedRevision = existing.meta.revision + 1;

  const survey = await db.collection('surveys').findOne({ _id: existing.meta.survey.id });
  if (!survey) {
    throw boom.notFound(`No survey found with id: ${existing.meta.survey.id}`);
  }

  // re-insert existing submission with a new _id
  existing._id = new ObjectId();
  existing.meta.original = new ObjectId(id);
  existing.meta.archived = true;
  existing.meta.archivedReason = 'REASSIGN';
  await db.collection(col).insertOne(existing);

  let apiComposeResults = {};
  try {
    const composeResults = await handleApiCompose(
      [{ entity: existing, prevEntity: existing, survey }],
      res.locals.auth.user
    );
    apiComposeResults = composeResults.results;
    existing = composeResults.entities[0].entity;
  } catch (errorObject) {
    return res.status(503).send(errorObject);
  }

  // const farmosResults = [];
  // try {
  //   // TODO: should we use the currently logged in user or the submission's user?
  //   // probably the submission's user (for instance if submission is re-assigned with a different user)
  //   const results = await farmOsService.handle({
  //     submission: existing,
  //     survey,
  //     user: res.locals.auth.user,
  //   });
  //   farmosResults.push(...results);
  //   // could contain errors, need to pass these on to the user
  // } catch (error) {
  //   // TODO what should we do if something internal fails?
  //   // need to let the user somehow know
  //   console.log('error handling farmos', error);
  //   return res.status(503).send({
  //     message: `error submitting to farmos ${error}`,
  //     farmos: error.messages,
  //   });
  // }

  const updateOperation = { 'meta.revision': updatedRevision };
  if (body.group) {
    const group = await db.collection('groups').findOne({ _id: new ObjectId(body.group) });
    if (group) {
      updateOperation['meta.group.id'] = group._id;
      updateOperation['meta.group.path'] = group.path;
    }
  }
  if (body.creator) {
    updateOperation['meta.creator'] = ObjectId(body.creator);
  }

  const updated = await db
    .collection(col)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateOperation },
      { returnDocument: 'after' }
    );
  return res.send({ ...updated.value, ...apiComposeResults });
};

const archiveSubmissions = async (req, res) => {
  const { id } = req.params;
  let { ids } = req.body;
  if (!ids) {
    ids = [id];
  }

  const { reason } = req.query;
  let archived = true;

  if (req.query.set === 'false' || req.query.set === '0') {
    archived = false;
  }

  const update = { $set: { 'meta.archived': archived } };
  if (archived) {
    update['$set']['meta.archivedReason'] = reason;
  } else {
    update['$unset'] = { 'meta.archivedReason': '' };
  }

  const idSelector = { $in: ids.map(ObjectId) };
  await db.collection(col).updateMany({ _id: idSelector }, update);

  return res.send({ message: 'OK' });
};

const deleteSubmissions = async (req, res) => {
  const { id } = req.params;
  let { ids } = req.body;
  if (!ids) {
    ids = [id];
  }

  const idSelector = { $in: ids.map(ObjectId) };
  const submissionQuery = { _id: idSelector };
  // TODO use transactions instead of this pre-check
  let result = await db.collection(col).countDocuments(submissionQuery);
  if (ids.length !== result) {
    throw boom.internal('abort because of ambiguous match results', result);
  }

  await db.collection(col).deleteMany(submissionQuery);
  return res.send({ message: 'OK' });
};

const getSubmissionPdf = async (req, res) => {
  const [submission] = await db
    .collection(col)
    .aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$meta.creator' },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$userId'] } } }],
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'groups',
          let: { groupId: '$meta.group.id' },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$groupId'] } } }],
          as: 'group',
        },
      },
      { $unwind: { path: '$group', preserveNullAndEmptyArrays: true } },
      {
        $set: {
          'meta.group.name': '$group.name',
          'meta.creator': '$user',
        },
      },
      { $project: { user: 0, group: 0 } },
    ])
    .toArray();

  if (!submission) {
    throw boom.notFound(`No entity found for id: ${req.params.id}`);
  }

  const survey = await db.collection('surveys').findOne({ _id: submission.meta.survey.id });
  if (!survey) {
    throw boom.notFound(`No survey found with id: ${submission.meta.survey.id}`);
  }

  try {
    const fileName = pdfService.getPdfName(survey, submission);
    const data = await pdfService.getPdfBase64(survey, submission);
    res.attachment(fileName);
    if (queryParam(req.query.base64)) {
      res.send('data:application/pdf;base64,' + data);
    } else {
      res.send(Buffer.from(data, 'base64'));
    }
  } catch (e) {
    throw boom.internal(e);
  }
};

const postSubmissionPdf = async (req, res) => {
  const { survey, submission } = req.body;
  if (!survey) {
    throw boom.badRequest('No survey found in the request body');
  }
  if (!submission) {
    throw boom.badRequest('No submission found in the request body');
  }

  // Fetch group name
  const group = await db
    .collection('groups')
    .findOne({ _id: new ObjectId(submission.meta.group.id) });

  if (!group) {
    throw boom.notFound(`No group found with id: ${submission.meta.group.id}`);
  }

  submission.meta.group.name = group.name;

  // Fetch submitter by considering proxy
  const creator = await db
    .collection('users')
    .findOne({ _id: new ObjectId(submission.meta.creator) });

  submission.meta.creator = creator;

  // Generate PDF
  try {
    const fileName = pdfService.getPdfName(survey, submission);
    const data = await pdfService.getPdfBase64(survey, submission);
    res.attachment(fileName);
    if (queryParam(req.query.base64)) {
      res.send('data:application/pdf;base64,' + data);
    } else {
      res.send(Buffer.from(data, 'base64'));
    }
  } catch (e) {
    throw boom.internal(e);
  }
};

const sendPdfLink = async (req, res) => {
  const submission = await db.collection(col).findOne({ _id: new ObjectId(req.params.id) });
  if (!submission) {
    throw boom.notFound(`No entity found for id: ${req.params.id}`);
  }

  // Send to submitter
  await mailService.sendLink({
    from: 'noreply@surveystack.io',
    to: res.locals.auth.user.email,
    subject: `Survey report - ${submission.meta.survey.name}`,
    link: new URL(`/api/submissions/${req.params.id}/pdf`, getServerSelfOrigin(req)).toString(),
    actionDescriptionHtml:
      'Thank you for taking the time to complete our survey. You can download a copy of your submission by clicking the button below.',
    btnText: 'Download',
  });

  // /* TODO: - Do we need to send pdf link to creator now ?
  //  * Note that there's no email subscription options there in the app
  //  * Or just comment this out this block in this release?
  //  */

  // //  Fetch creator of the survey
  // const [survey] = await db
  //   .collection('surveys')
  //   .aggregate([
  //     {
  //       $lookup: {
  //         from: 'users',
  //         let: { creatorId: '$meta.creator' },
  //         pipeline: [
  //           { $match: { $expr: { $eq: ['$_id', '$$creatorId'] } } },
  //           { $project: { email: 1 } },
  //         ],
  //         as: 'creator',
  //       },
  //     },
  //     {
  //       $unwind: { path: '$creator', preserveNullAndEmptyArrays: true },
  //     },
  //     {
  //       $match: {
  //         _id: new ObjectId(submission.meta.survey.id),
  //         'meta.creator': { $ne: new ObjectId(res.locals.auth.user._id) },
  //       },
  //     },
  //     { $project: { creator: 1 } },
  //   ])
  //   .toArray();

  // // Send to creator of the survey
  // // No error thrown even the creator was not found
  // if (survey && survey.creator) {
  //   await mailService.sendLink({
  //     from: 'noreply@surveystack.io',
  //     to: survey.creator.email,
  //     subject: `Survey report - ${submission.meta.survey.name}`,
  //     link: new URL(`/api/submissions/${req.params.id}/pdf`, getServerSelfOrigin(req)).toString(),
  //     actionDescriptionHtml: `${res.locals.auth.user.name} has submitted new submission. You can download a copy by clicking the button below.`,
  //     btnText: 'Download',
  //   });
  // }

  return res.send({ success: true });
};

export { buildPipeline, sanitize, getSkip, getLimit, DEFAULT_LIMIT };

export default {
  getSubmissions,
  getSubmissionsPage,
  getSubmissionsCsv,
  getSubmission,
  createSubmission,
  updateSubmission,
  reassignSubmission,
  bulkReassignSubmissions,
  archiveSubmissions,
  deleteSubmissions,
  getSubmissionPdf,
  postSubmissionPdf,
  sendPdfLink,
};
