import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';
import { db } from '../db';
import assert from 'assert';

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

  return entity;
};

/**
 * Store drafts to server
 */
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

/**
 * Fetch my submissions
 * What is 'my submissions'? - creator, proxyUserId, resubmitter are my user ID
 */
const getDrafts = async (req, res) => {
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
  createDrafts,
  getDrafts,
  deleteDrafts,
};
