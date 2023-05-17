import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';
import { db, mongoClient } from '../db';
import { withSession, withTransaction } from '../db/helpers';

const col = 'drafts';

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

const getDrafts = async (req, res) => {
  const authUserId = res.locals.auth.user._id;

  const entities = await db
    .collection(col)
    .find({
      $or: [{ 'meta.creator': authUserId }, { 'meta.proxyUserId': authUserId }],
    })
    .sort({ 'meta.dateModified': -1 })
    .toArray();

  return res.send(entities);
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

export default { getDrafts, createDrafts };
