import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';
import { db, mongoClient } from '../db';
import { withSession, withTransaction } from '../db/helpers';
import { queryParam } from '../helpers';

const col = 'drafts';
const DEFAULT_LIMIT = 100000;

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

  // Remove temporal properties for client usage
  delete entity.options;

  return entity;
};

const createDrafts = async (req, res) => {
  const drafts = Array.isArray(req.body) ? req.body : [req.body];

  let draftsEntities = await Promise.all(drafts.map(sanitize));

  const results = await withSession(mongoClient, async (session) => {
    try {
      return await withTransaction(session, async () => {
        const result = await db.collection(col).insertMany(draftsEntities);

        if (draftsEntities.length !== result.insertedCount) {
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

  res.send({ ...results });
};

const getDrafts = async (req, res) => {
  const user = res.locals.auth.user._id;

  const skip = req.query.skip ? Number(req.query.skip) : 0;
  if (isNaN(skip)) {
    throw boom.badRequest(`Bad query parameter skip: ${skip}`);
  }

  const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_LIMIT;
  if (isNaN(limit) || limit === 0) {
    throw boom.badRequest(`Bad query parameter limit: ${limit}`);
  }

  let match = {};

  // Filter by survey
  if (req.query.survey) {
    const ids = Array.isArray(req.query.survey) ? req.query.survey : [req.query.survey];
    match = {
      'meta.survey.id': { $in: ids.map((id) => new ObjectId(id)) },
    };
  }

  const pipeline = [
    // Submitted or proxy by user
    {
      $match: {
        $or: [{ 'meta.creator': user }, { 'meta.proxyUserId': user }],
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
    // Sort
    {
      $sort: { 'meta.dateModified': -1 },
    },
  ];

  const emptyEntities = { content: [], pagination: { total: 0, skip, limit } };
  let submitted = emptyEntities;
  let draft = emptyEntities;

  // Fetch draft (draft=1)
  if (queryParam(req.query.draft)) {
    const [entities] = await db
      .collection(col)
      .aggregate(pipeline, { allowDiskUse: true })
      .toArray();

    if (entities) {
      draft = entities;
    }
  }

  // Fetch submitted (submitted=1)
  if (queryParam(req.query.submitted)) {
    const [entities] = await db
      .collection('submissions')
      .aggregate(pipeline, { allowDiskUse: true })
      .toArray();

    if (entities) {
      submitted = entities;
    }
  }

  return res.send({
    draft,
    submitted,
  });
};

const getDraftSurveys = async (req, res) => {
  const { local } = req.query;
  const user = res.locals.auth.user._id;

  const surveyIds = [];

  // Survey from local drafts
  if (Array.isArray(local)) {
    surveyIds.push(...local.map((id) => new ObjectId(id)));
  }

  // Survey from remote drafts
  if (queryParam(req.query.draft)) {
    const draftEntities = await db
      .collection(col)
      .find({ $or: [{ 'meta.creator': user }, { 'meta.proxyUserId': user }] })
      .toArray();

    surveyIds.push(
      ...draftEntities
        .map((entity) => entity.meta.survey.id)
        .filter((item, index, ary) => ary.indexOf(item) === index)
    );
  }

  // Survey from submitted submissions
  if (queryParam(req.query.submitted)) {
    const submittedEntities = await db
      .collection('submissions')
      .find({ $or: [{ 'meta.creator': user }, { 'meta.proxyUserId': user }] })
      .toArray();

    surveyIds.push(
      ...submittedEntities
        .map((entity) => entity.meta.survey.id)
        .filter((item, index, ary) => ary.indexOf(item) === index)
        .filter((item) => !surveyIds.includes(item))
    );
  }

  const surveys = await db
    .collection('surveys')
    .aggregate([{ $match: { _id: { $in: surveyIds } } }, { $project: { _id: 1, name: 1 } }])
    .toArray();

  return res.send(surveys);
};

export default { getDrafts, createDrafts, getDraftSurveys };
