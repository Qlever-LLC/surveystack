import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';
import { db } from '../db';
import assert from 'assert';
import { queryParam } from '../helpers';
import {
  addUserDetailsStage,
  createRedactStage,
  createRelevanceStage,
} from './submissionController';
import rolesService from '../services/roles.service';
import headerService from '../services/header.service';
import { forOwn, isEmpty } from 'lodash';

const col = 'drafts';
const DEFAULT_LIMIT = 100000;
const DEFAULT_SORT = { 'meta.dateModified': -1 };

const sanitize = (entity) => {
  if (entity._id) {
    entity._id = new ObjectId(entity._id);
  }

  entity.meta.dateCreated = new Date(entity.meta.dateCreated);
  entity.meta.dateModified = new Date(entity.meta.dateModified);
  entity.meta.survey.id = new ObjectId(entity.meta.survey.id);

  if (entity.meta.submitAsUser && entity.meta.submitAsUser._id) {
    entity.meta.submitAsUser._id = new ObjectId(entity.meta.submitAsUser._id);
  }

  if (entity.meta.group) {
    entity.meta.group.id = new ObjectId(entity.meta.group.id);
  }

  if (entity.meta.creator) {
    entity.meta.creator = new ObjectId(entity.meta.creator);
  }

  if (entity.meta.proxyUserId) {
    entity.meta.proxyUserId = new ObjectId(entity.meta.proxyUserId);
  }

  return entity;
};

export const buildPipeline = async (req, res) => {
  const pipeline = [];

  let user = null;
  let roles = [];
  let sort = DEFAULT_SORT;

  // initial match stage to filter surveys
  if (req.query.survey) {
    pipeline.push({
      $match: { 'meta.survey.id': new ObjectId(req.query.survey) },
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
  }

  // Add creator details if request has admin rights on survey.
  // However, don't add creator details if pure=1 is set (e.g. for re-submissions)
  if (user && req.query.survey && !queryParam(req.query.pure)) {
    const survey = await db.collection('surveys').findOne({ _id: new ObjectId(req.query.survey) });
    const groupId = survey.meta.group.id;
    const hasAdminRights = await rolesService.hasAdminRole(user, groupId);

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

  const redactStage = createRedactStage(user, roles);
  pipeline.push(redactStage);

  // sort stage

  // sort stage
  if (req.query.sort) {
    try {
      const s = JSON.parse(req.query.sort);
      if (!isEmpty(s)) {
        sort = s;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query parameter sort: ${sort}`);
    }

    forOwn(sort, (v) => {
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

const getDraftsPage = async (req, res) => {
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

const getMyDrafts = async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_LIMIT;
  if (isNaN(limit) || limit === 0) {
    throw boom.badRequest(`Bad query parameter limit: ${limit}`);
  }

  const user = res.locals.auth.user._id;
  const match = {
    $or: [{ 'meta.resubmitter': user }, { 'meta.proxyUserId': user }, { 'meta.creator': user }],
  };
  if (Array.isArray(req.query.surveyIds)) {
    match['meta.survey.id'] = {
      $in: req.query.surveyIds.map((id) => new ObjectId(id)),
    };
  }
  const entities = await db.collection(col).find(match).toArray();

  return res.send(entities);
};

const createDrafts = async (req, res) => {
  const drafts = Array.isArray(req.body) ? req.body : [req.body];

  let draftsEntities = await Promise.all(drafts.map(sanitize));

  var bulk = db.collection(col).initializeUnorderedBulkOp();
  for (const draft of draftsEntities) {
    bulk.find({ _id: draft._id }).upsert().replaceOne(draft);
  }
  const result = await bulk.execute();

  if (!result.ok) {
    throw boom.internal('The transaction was intentionally aborted.');
  }

  res.send(result);
};

const deleteDrafts = async (req, res) => {
  const { id } = req.params;
  let { ids } = req.body;
  if (!ids) {
    ids = [id];
  }

  try {
    const result = await db.collection(col).deleteMany({ _id: { $in: ids.map(ObjectId) } });
    assert.equal(ids.length, result.deletedCount);
  } catch (e) {
    throw boom.internal('Unknown internal error', e);
  }

  return res.send({ message: 'OK' });
};

export default {
  getMyDrafts,
  getDraftsPage,
  createDrafts,
  deleteDrafts,
};
