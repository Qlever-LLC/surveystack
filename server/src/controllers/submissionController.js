import _, { cloneDeep, isError } from 'lodash';

import { ObjectId } from 'mongodb';

import boom from '@hapi/boom';

import { db, mongoClient } from '../db';
import { withTransaction, withSession } from '../db/helpers';
import * as csvService from '../services/csv.service';
import headerService from '../services/header.service';
import * as farmOsService from '../services/farmos.service';
import * as hyloService from '../services/hylo.service';
import rolesService from '../services/roles.service';
import mailService from '../services/mail/mail.service';
import pdfService from '../services/pdf.service';
import { queryParam } from '../helpers';
import { appendDatabaseOperationDurationToLoggingMessage } from '../middleware/logging';
import { getServerSelfOrigin } from '../services/auth.service';
const col = 'submissions';
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

  // Delete temporal data that is used in the client
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

export const createRedactStage = (user, roles) => {
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

export const createRelevanceStage = () => {
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

export const buildPipeline = async (req, res) => {
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
      addUserDetailsStage(pipeline);
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
      const autoProjections = {};
      if (_.some(project, (v) => v === 0) && _.some(project, (v) => v === 1)) {
        throw boom.badRequest(`One can not mix and match inclusion and exclusion in project stage`);
      }

      project = { ...project, ...autoProjections };
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

export const addUserDetailsStage = (pipeline) => {
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
};

const getSubmissionsPage = async (req, res) => {
  let skip = 0;
  let limit = DEFAULT_LIMIT;

  const pipeline = await buildPipeline(req, res);

  // skip
  if (req.query.skip) {
    try {
      const querySkip = Number.parseInt(req.query.skip);
      if (querySkip > 0) {
        skip = querySkip;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query parameter skip: ${skip}`);
    }
  }

  // limit
  if (req.query.limit) {
    try {
      const queryLimit = Number.parseInt(req.query.limit);
      if (queryLimit > 0) {
        limit = queryLimit;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query parameter limit: ${limit}`);
    }
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
  let skip = 0;
  let limit = DEFAULT_LIMIT;

  const pipeline = await buildPipeline(req, res);

  // skip
  if (req.query.skip) {
    try {
      const querySkip = Number.parseInt(req.query.skip);
      if (querySkip > 0) {
        skip = querySkip;
        pipeline.push({ $skip: skip });
      }
    } catch (error) {
      throw boom.badRequest(`Bad query parameter skip: ${skip}`);
    }
  }

  // limit
  if (req.query.limit) {
    try {
      const queryLimit = Number.parseInt(req.query.limit);
      if (queryLimit > 0) {
        limit = queryLimit;
        pipeline.push({ $limit: limit });
      }
    } catch (error) {
      throw boom.badRequest(`Bad query parameter limit: ${limit}`);
    }
  }

  const databaseOperationStartTime = new Date();
  const entities = await db.collection(col).aggregate(pipeline, { allowDiskUse: true }).toArray();
  appendDatabaseOperationDurationToLoggingMessage(
    res,
    Date.now() - databaseOperationStartTime.valueOf()
  );

  return res.send(entities);
};

const addSkipToPipeline = (pipeline, reqSkip) => {
  let skip = 0;
  if (reqSkip) {
    try {
      const querySkip = Number.parseInt(reqSkip);
      if (querySkip > 0) {
        skip = querySkip;
        pipeline.push({ $skip: skip });
      }
    } catch (error) {
      throw boom.badRequest(`Bad query parameter skip: ${skip}`);
    }
  }
};

const addLimitToPipeline = (pipeline, reqLimit) => {
  let limit = DEFAULT_LIMIT;
  if (reqLimit) {
    try {
      const queryLimit = Number.parseInt(reqLimit);
      if (queryLimit > 0) {
        limit = queryLimit;
        pipeline.push({ $limit: limit });
      }
    } catch (error) {
      throw boom.badRequest(`Bad query parameter limit: ${limit}`);
    }
  }
};

const getSubmissionsCsv = async (req, res) => {
  const pipeline = await buildPipeline(req, res);
  addSkipToPipeline(pipeline, req.query.skip);
  addLimitToPipeline(pipeline, req.query.limit);

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

/**
 * Fetch all my submissions (creator, proxyUserId, resubmitter)
 *
 * @param {
 *   archived:           boolean,         // include archived submissions
 *   surveyIds:          array,           // Filter by surveys
 *   skip:               number,          // Pagination
 *   limit:              number,          // Pagination
 * } req
 * @param {*} res
 * @returns {
 *   content:            array,           // Array of submission
 *   pagination:         object,          // Pagination
 * }
 */
const getMySubmissions = async (req, res) => {
  const skip = req.query.skip ? Number(req.query.skip) : 0;
  if (isNaN(skip) || skip < 0) {
    throw boom.badRequest(`Bad query parameter skip: ${skip}`);
  }

  const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_LIMIT;
  if (isNaN(limit) || limit === 0) {
    throw boom.badRequest(`Bad query parameter limit: ${limit}`);
  }

  let match = {};

  // Hide all which were NOT resubmitted,proxied,archived
  if (!queryParam(req.query.submitted)) {
    match = {
      ...match,
      $or: [
        { 'meta.resubmitter': { $ne: null } },
        { 'meta.proxyUserId': { $ne: null } },
        { 'meta.archived': { $eq: true } },
      ],
    };
  }
  // Hide resubmitted
  if (!queryParam(req.query.resubmitted)) {
    match = {
      ...match,
      'meta.resubmitter': null,
    };
  }
  // Hide proxied
  if (!queryParam(req.query.proxied)) {
    match = {
      ...match,
      'meta.proxyUserId': null,
    };
  }
  // Hide archived
  if (!queryParam(req.query.archived)) {
    match = {
      ...match,
      'meta.archived': { $ne: true },
    };
  }
  // Filter by survey
  if (Array.isArray(req.query.surveyIds) && req.query.surveyIds.length > 0) {
    match = {
      ...match,
      'meta.survey.id': { $in: req.query.surveyIds.map((id) => new ObjectId(id)) },
    };
  }

  const user = res.locals.auth.user._id;

  const pipeline = [
    {
      $sort: { 'meta.dateModified': -1 },
    },
    {
      $match: {
        $or: [{ 'meta.resubmitter': user }, { 'meta.proxyUserId': user }, { 'meta.creator': user }],
        ...match,
      },
    },
    // Pagination
    {
      $facet: {
        content: [{ $skip: skip }, { $limit: limit }],
        pagination: [{ $count: 'total' }, { $addFields: { skip, limit } }],
      },
    },
    { $unwind: '$pagination' },
  ];

  const [entities] = await db.collection(col).aggregate(pipeline, { allowDiskUse: true }).toArray();

  if (!entities) {
    return res.send({
      content: [],
      pagination: { total: 0, skip: 0, limit: DEFAULT_LIMIT },
    });
  }

  return res.send(entities);
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

const handleApiCompose = async (submissionEntities, user) => {
  submissionEntities = cloneDeep(submissionEntities);

  // HOTFIX: do hylo first because farmos handler remove all apiCompose outputs from the submission
  // TODO: solve this in a cleaner way. Create utility functions for apiCompose handlers
  let hyloResults;
  try {
    hyloResults = await Promise.all(
      submissionEntities.map(async ({ entity, prevEntity, survey }) => {
        const results = await hyloService.handle({
          submission: entity,
          prevSubmission: prevEntity,
          survey,
          user,
        });
        // Save the results of the Hylo handler in the submission
        const permanentResults = results.map((r) => r.permanent).filter(Boolean);
        entity.meta.permanentResults = [
          ...(Array.isArray(entity.meta.permanentResults) ? entity.meta.permanentResults : []),
          ...permanentResults,
        ];
        return results;
      })
    );
  } catch (error) {
    console.log('error handling hylo', error);
    throw {
      message: `error submitting to hylo ${error}`,
      hylo: error,
      logs: error.logs || [],
    };
  }

  let farmOsResults;
  try {
    farmOsResults = await Promise.all(
      submissionEntities.map(({ entity, survey }) =>
        farmOsService.handle({
          submission: entity,
          survey,
          user, //todo
        })
      )
    );
  } catch (error) {
    // TODO what should we do if something internal fails?
    // need to let the user somehow know
    console.log('error handling farmos', error);
    throw {
      message: `error submitting to farmos ${error}`,
      farmos: error.messages,
      logs: error.logs || [],
    };
  }

  return {
    results: {
      farmos: farmOsResults.flat(),
      hylo: hyloResults.flat(),
    },
    entities: submissionEntities,
  };
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

  const mapSubmissionToQSL = ({ entity, survey }) => {
    const controls = survey.revisions.find(
      (revision) => revision.version === entity.meta.survey.version
    ).controls;

    return prepareSubmissionsToQSLs(controls, entity);
  };
  const submissionsToQSLs = (await Promise.all(submissionEntities.map(mapSubmissionToQSL))).flat();

  const results = await withSession(mongoClient, async (session) => {
    try {
      return await withTransaction(session, async () => {
        const submissionsToInsert = [
          ...submissionEntities.map(({ entity }) => entity),
          ...submissionsToQSLs,
        ];

        const result = await db.collection(col).insertMany(submissionsToInsert);

        if (submissionsToInsert.length !== result.insertedCount) {
          await session.abortTransaction();
          return;
        }

        return result;
      });
    } catch (error) {
      throw boom.boomify(error);
    }
  });

  if (!results) {
    throw boom.internal('The transaction was intentionally aborted.');
  }

  res.send({
    ...results,
    ...apiComposeResults,
  });
};

// if submission contains question set library questions, return a submission subset for each question set library
const prepareSubmissionsToQSLs = async (controls, submission) => {
  const submissionsToQSLSurveys = [];

  async function createSubmissionsFromControl(control, submissionCopy) {
    // for each library root control which is not deleted
    if (control.isLibraryRoot && !control.options.redacted) {
      // create a copy of submission
      submissionCopy = JSON.parse(JSON.stringify(submissionCopy));
      // remember submission source id in original
      submissionCopy.meta.original = new ObjectId(submission._id);
      // set new id
      submissionCopy._id = new ObjectId();
      // remember source survey id in origin_id and set survey id to the qsl survey
      submissionCopy.meta.survey.origin = new ObjectId(submission.meta.survey.id);
      submissionCopy.meta.survey.id = new ObjectId(control.libraryId);
      submissionCopy.meta.survey.version = control.libraryVersion; // must be version of the library survey, not the consuming survey
      // remove libraryRoot container including meta child
      submissionCopy.data = findVal(submissionCopy.data, control.name);
      delete submissionCopy.data['meta'];

      // do not return copy if no data is left
      if (Object.keys(submissionCopy.data).length === 0) {
        return;
      }

      // TODO if qsl survey is not found, we are probably on an on-premise-system, so try to find the survey on the central surveystack system

      //sanitize copy (e.g. convert string id's to object id
      submissionCopy = await sanitize(submissionCopy);
      submissionsToQSLSurveys.push(submissionCopy);
    }

    // recursively go through the children
    if (control.children) {
      await Promise.all(
        control.children.map(async (child) => {
          await createSubmissionsFromControl(child, submissionCopy);
        })
      );
    }
  }

  // for each component in survey.revisions[meta.survey.version], create submission in parallel
  await Promise.all(
    controls.map(async (control) => {
      await createSubmissionsFromControl(control, submission);
    })
  );

  return submissionsToQSLSurveys;
};

const findVal = (obj, keyToFind) => {
  if (!obj) {
    return false;
  }
  if (obj[keyToFind]) return obj[keyToFind];

  for (let key in obj) {
    if (typeof obj[key] === 'object') {
      const value = findVal(obj[key], keyToFind);
      if (value) return value;
    }
  }
  return false;
};

const updateSubmission = async (req, res) => {
  const { id } = req.params;
  let newSubmission = await sanitize(req.body);
  const oldSubmission = res.locals.existing;

  // update with upped revision and resubmitter
  newSubmission.meta.revision = oldSubmission.meta.revision + 1;
  newSubmission.meta.resubmitter = new ObjectId(res.locals.auth.user._id);

  const updateOperation = {
    data: newSubmission.data,
    'meta.group': newSubmission.meta.group,
    'meta.revision': newSubmission.meta.revision,
    'meta.resubmitter': newSubmission.meta.resubmitter,
    'meta.dateModified': newSubmission.meta.dateModified,
    'meta.dateSubmitted': newSubmission.meta.dateSubmitted,
    'meta.specVersion': newSubmission.meta.specVersion,
    // TODO: does meta.status need to be stored in the database?
    'meta.status': newSubmission.meta.status,
  };

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

  // const farmosResults = [];
  // try {
  //   // re-run with original creator user
  //   const creator = await db.collection('users').findOne({ _id: newSubmission.meta.creator });
  //   const results = await farmOsService.handle({
  //     submission: newSubmission,
  //     survey,
  //     user: creator,
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

  const updated = await db.collection(col).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateOperation },
    {
      returnOriginal: false,
    }
  );

  await updateSubmissionToLibrarySurveys(survey, newSubmission);

  return res.send({ ...updated.value, ...apiComposeResults });
};

const updateSubmissionToLibrarySurveys = async (survey, submission) => {
  // find library submissions to be updated
  const librarySubmissions = await db
    .collection('submissions')
    .find({ 'meta.original': submission._id })
    .toArray();

  // archive current library submissions
  await librarySubmissions.forEach(function (librarySubmission) {
    // re-insert existing submissions as archived
    // in contrast to the general archiving function, here we don't move the old id to the new submission and we don't
    // change the origin as this is occupied by the root submission origin, otherwise, the find above would not find
    // this for a further resubmit
    librarySubmission.meta.archived = true;
    librarySubmission.meta.archivedReason = submission.meta.archivedReason || 'RESUBMIT';
    db.collection(col).replaceOne({ _id: librarySubmission._id }, librarySubmission);
  });
  // create new library submissions with a new id
  let controls = survey.revisions.find(
    (revision) => revision.version === submission.meta.survey.version
  ).controls;

  const QSLSubmissions = await prepareSubmissionsToQSLs(controls, submission);
  if (QSLSubmissions.length !== 0) {
    await db.collection(col).insertMany(QSLSubmissions);
  }
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

        if (submissionsToArchive.length !== insertResult.insertedCount) {
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

  res.send({
    result: results.result,
    ...apiComposeResults,
  });
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
      { returnOriginal: false }
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

  // archive / unarchive library submissions as well
  await db.collection(col).updateMany({ 'meta.original': idSelector }, update);

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

  // delete library submissions as well

  await db.collection(col).deleteMany({ 'meta.original': idSelector });

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

export default {
  getSubmissions,
  getSubmissionsPage,
  getSubmissionsCsv,
  getMySubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  reassignSubmission,
  bulkReassignSubmissions,
  archiveSubmissions,
  deleteSubmissions,
  prepareSubmissionsToQSLs,
  getSubmissionPdf,
  postSubmissionPdf,
  sendPdfLink,
};
