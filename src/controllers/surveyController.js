import assert from 'assert';
import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';

import { db } from '../db';

import { checkSurvey } from '../helpers/surveys';
import rolesService from '../services/roles.service';

const col = 'surveys';
const DEFAULT_LIMIT = 20;

const sanitize = async (entity) => {
  entity._id = new ObjectId(entity._id);

  entity.revisions.forEach((version) => {
    version.dateCreated = new Date(entity.dateCreated);
  });

  if (entity.meta) {
    entity.meta.dateCreated = new Date(entity.meta.dateCreated);
    entity.meta.dateModified = new Date(entity.meta.dateModified);

    if (entity.meta.creator) {
      entity.meta.creator = new ObjectId(entity.meta.creator);
    }

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
  }

  checkSurvey(entity, entity.latestVersion);

  return entity;
};

const getSurveys = async (req, res) => {
  const filter = {};
  const project = {};

  const { q, projections } = req.query;

  if (q) {
    if (ObjectId.isValid(q)) {
      filter._id = new ObjectId(q);
    } else {
      filter.name = { $regex: q, $options: 'i' };
    }
  }

  if (projections) {
    projections.forEach((projection) => {
      project[projection] = 1;
    });
  }

  const entities = await db.collection(col).find(filter).project(project).toArray();
  return res.send(entities);
};

const buildPipelineForGetSurveyPage = ({ q, groups, projections, creator, skip, limit }) => {
  const match = {};
  const project = {};
  let parsedSkip = 0;
  let parsedLimit = DEFAULT_LIMIT;

  if (q) {
    match.name = {
      $regex: q,
      $options: 'i',
    };
  }

  if (groups && Array.isArray(groups) && groups.length > 0) {
    match['meta.group.id'] = {
      $in: groups.map((item) => new ObjectId(item)),
    };
  }

  if (creator) {
    match['meta.creator'] = new ObjectId(creator);
  }

  const pipeline = [
    {
      $match: match,
    },
  ];
  if (!q) {
    pipeline.push({
      $sort: {
        dateModified: -1,
      },
    });
  }

  if (projections) {
    projections.forEach((projection) => {
      project[projection] = 1;
    });
    pipeline.push({
      $project: project,
    });
  }

  // default sort by name (or date modified?)
  // needs aggregation for case insensitive sorting
  pipeline.push(
    ...[
      { $addFields: { name_lowercase: { $toLower: '$name' } } },
      { $sort: { name_lowercase: 1 } },
      { $project: { name_lowercase: 0 } },
    ]
  );

  // skip
  if (skip) {
    try {
      const n = Number.parseInt(skip);
      if (n > 0) {
        parsedSkip = n;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query paramter skip: ${skip}`);
    }
  }

  // limit
  if (limit) {
    try {
      const n = Number.parseInt(limit);
      if (n > 0) {
        parsedLimit = n;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query paramter limit: ${limit}`);
    }
  }

  // pagination stage
  const paginationStages = [
    {
      $facet: {
        content: [
          {
            $skip: parsedSkip,
          },
          {
            $limit: parsedLimit,
          },
        ],
        pagination: [
          {
            $count: 'total',
          },
          {
            $addFields: {
              parsedSkip,
              parsedLimit,
            },
          },
        ],
      },
    },
    {
      $unwind: '$pagination',
    },
  ];
  pipeline.push(...paginationStages);

  return pipeline;
};

const getSurveyPage = async (req, res) => {
  const skip = req.query.skip || 0;
  const limit = req.query.limit || DEFAULT_LIMIT;
  const pipeline = buildPipelineForGetSurveyPage(req.query);

  const entities = await db.collection(col).aggregate(pipeline).toArray();

  // empty array when ther is no match
  // however, we still want content and pagination properties
  if (!entities[0]) {
    entities[0] = { content: [], pagination: { total: 0, skip, limit } };
  }

  return res.send(entities[0]);
};

const getSurveyListPage = async (req, res) => {
  const query = {
    ...req.query,
    projections: [
      ...(req.query.projections || []),
      '_id',
      'name',
      'latestVersion',
      'meta.dateModified',
      'meta.group',
      'meta.creator',
      'meta.submissions',
    ],
  };
  const pipeline = buildPipelineForGetSurveyPage(query);

  const [entities] = await db.collection(col).aggregate(pipeline).toArray();

  // empty array when ther is no match
  // however, we still want content and pagination properties
  if (!entities) {
    return res.send({
      content: [],
      pagination: {
        total: 0,
        skip: req.query.skip || 0,
        limit: req.query.limit || DEFAULT_LIMIT,
      },
    });
  }

  return res.send(entities);
};

const getSurvey = async (req, res) => {
  const { id } = req.params;
  let entity;

  entity = await db.collection(col).findOne({ _id: new ObjectId(id) });

  if (!entity) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`,
    });
  }

  return res.send(entity);
};

const getSurveyInfo = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    throw boom.badRequest(`query param not set: id`);
  }

  const entity = await db
    .collection('surveys')
    .findOne(
      { _id: new ObjectId(id) },
      { projection: { name: 1, latestVersion: 1, 'meta.dateModified': 1, 'meta.dateCreated': 1 } }
    );

  const submissions = await db
    .collection('submissions')
    .find({ 'meta.survey.id': new ObjectId(id), 'meta.archived': { $ne: true } })
    .count();

  const latestSubmissions = await db
    .collection('submissions')
    .aggregate([
      { $match: { 'meta.survey.id': new ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'meta.creator',
          foreignField: '_id',
          as: 'meta.creator',
        },
      },
      { $unwind: '$meta.creator' },
      { $project: { 'meta.dateModified': 1, 'meta.creator._id': 1, 'meta.creator.name': 1 } },
      { $sort: { 'meta.dateModified': -1 } },
      { $limit: 1 },
    ])
    .toArray();

  entity.latestSubmission = null;
  if (latestSubmissions[0]) {
    const s = latestSubmissions[0];
    entity.latestSubmission = { dateModified: s.meta.dateModified, creator: s.meta.creator };
  }
  entity.submissions = submissions;

  return res.send(entity);
};

const createSurvey = async (req, res) => {
  const entity = await sanitize(req.body);
  // apply creator (endpoint already has assertAuthenticated, so auth.user._id must exist)
  entity.meta.creator = res.locals.auth.user._id;

  try {
    let r = await db.collection(col).insertOne(entity);
    assert.equal(1, r.insertedCount);
    return res.send(r);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(409).send({ message: `Entity with _id already exists: ${entity._id}` });
    }
  }

  return res.status(500).send({ message: 'Internal error' });
};

const isUserAllowedToModifySurvey = async (survey, user) => {
  if (!survey.meta.group && !survey.meta.creator) {
    return true; // no user and no group => free for all!
  }

  if (survey.meta.creator.equals(user)) {
    return true; // user may delete their own surveys
  }

  const hasAdminRole = await rolesService.hasAdminRole(user, survey.meta.group.id);
  if (hasAdminRole) {
    return true; // group admins may delete surveys
  }

  return false;
};

const updateSurvey = async (req, res) => {
  const { id } = req.params;
  const entity = await sanitize(req.body);

  const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
  if (!existing) {
    throw boom.notFound(`No entity with _id exists: ${id}`);
  }

  const isAllowed = await isUserAllowedToModifySurvey(existing, res.locals.auth.user._id);
  if (!isAllowed) {
    throw boom.unauthorized(`You are not authorized to update survey: ${id}`);
  }

  try {
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: entity },
      {
        returnOriginal: false,
      }
    );
    return res.send(updated);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

const deleteSurvey = async (req, res) => {
  const { id } = req.params;

  const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
  if (!existing) {
    throw boom.notFound(`No entity with _id exists: ${id}`);
  }

  const isAllowed = await isUserAllowedToModifySurvey(existing, res.locals.auth.user._id);
  if (!isAllowed) {
    throw boom.unauthorized(`You are not authorized to delete survey: ${id}`);
  }

  try {
    let r = await db.collection(col).deleteOne({ _id: new ObjectId(id) });
    assert.equal(1, r.deletedCount);
    return res.send({ message: 'OK' });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

export default {
  getSurveys,
  getSurveyPage,
  getSurveyListPage,
  getSurvey,
  getSurveyInfo,
  createSurvey,
  updateSurvey,
  deleteSurvey,
};
