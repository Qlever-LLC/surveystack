import assert from 'assert';
import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';

import { db } from '../db';

import { checkSurvey } from '../helpers/surveys';

const col = 'surveys';
const DEFAULT_LIMIT = 20;

const sanitize = (entity) => {
  entity._id = new ObjectId(entity._id);
  entity.dateCreated = new Date(entity.dateCreated);
  entity.dateModified = new Date(entity.dateModified);
  if (entity.creator) {
    entity.creator = new ObjectId(entity.creator);
  }
  entity.revisions.forEach((version) => {
    version.dateCreated = new Date(entity.dateCreated);
  });

  if (entity.group.id) {
    entity.group.id = new ObjectId(entity.group.id);
  }

  checkSurvey(entity, entity.latestVersion);

  return entity;
};

const getSurveys = async (req, res) => {
  const filter = {};
  const project = {};

  const { find, projections } = req.query;

  if (find) {
    if (ObjectId.isValid(find)) {
      filter._id = new ObjectId(find);
    } else {
      filter.name = { $regex: find, $options: 'i' };
    }
  }

  if (projections) {
    projections.forEach((projection) => {
      project[projection] = 1;
    });
  }

  const entities = await db
    .collection(col)
    .find(filter)
    .project(project)
    .toArray();
  return res.send(entities);
};

const getSurveyPage = async (req, res) => {
  let entities;
  const match = {};
  let skip = 0;
  let limit = DEFAULT_LIMIT;

  const { q, group } = req.query;
  if (q) {
    match.name = { $regex: q, $options: 'i' };
  }

  if (group && !Array.isArray(group)) {
    match['group.id'] = new ObjectId(group);
  } else if (group && Array.isArray(group)) {
    match['group.id'] = { $in: group.map((item) => new ObjectId(item)) };
  }

  const pipeline = [{ $match: match }];
  if (!q) {
    pipeline.push({ $sort: { dateModified: -1 } });
  }

  // skip
  if (req.query.skip) {
    try {
      const querySkip = Number.parseInt(req.query.skip);
      if (querySkip > 0) {
        skip = querySkip;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query paramter skip: ${skip}`);
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
      throw boom.badRequest(`Bad query paramter limit: ${limit}`);
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

  entities = await db
    .collection(col)
    .aggregate(pipeline)
    .toArray();

  // empty array when ther is no match
  // however, we still want content and pagination properties
  if (!entities[0]) {
    entities[0] = { content: [], pagination: { total: 0, skip, limit } };
  }

  return res.send(entities[0]);
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
      { projection: { name: 1, dateModified: 1, dateCreated: 1, latestVersion: 1 } }
    );

  const submissions = await db
    .collection('submissions')
    .find({ 'meta.survey.id': new ObjectId(id) })
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
  const entity = sanitize(req.body);
  // add creator to survey
  entity.creator = res.locals.auth.user._id;

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

const updateSurvey = async (req, res) => {
  const { id } = req.params;
  const entity = sanitize(req.body);

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
  getSurvey,
  getSurveyInfo,
  createSurvey,
  updateSurvey,
  deleteSurvey,
};
