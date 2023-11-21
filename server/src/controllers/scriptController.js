import assert from 'assert';
import boom from '@hapi/boom';
import rolesService from '../services/roles.service';

import { ObjectId } from 'mongodb';

import { db } from '../db';

const col = 'scripts';

const sanitize = async (entity) => {
  if (entity._id) {
    entity._id = new ObjectId(entity._id);
  }

  if (entity.meta) {
    if (entity.meta.dateCreated) {
      entity.meta.dateCreated = new Date(entity.meta.dateCreated);
    }

    if (entity.meta.dateModified) {
      entity.meta.dateModified = new Date(entity.meta.dateModified);
    }

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
};

const getScripts = async (req, res) => {
  const { q } = req.query;
  const filter = {};
  const projection = { content: 0 };

  if (q) {
    if (ObjectId.isValid(q)) {
      filter._id = new ObjectId(q);
    } else {
      filter.name = { $regex: q, $options: 'i' };
    }
  }

  const entities = await db
    .collection(col)
    .find(filter)
    .project(projection)
    .sort({ name: 1 })
    .toArray();
  return res.send(entities);
};

const getScript = async (req, res) => {
  const { id } = req.params;

  console.log('getScript', id);
  const entity = await db.collection(col).findOne({ _id: new ObjectId(id) });

  if (!entity) {
    throw boom.notFound();
  }

  return res.send(entity);
};

const createScript = async (req, res) => {
  const entity = req.body;
  sanitize(entity);
  entity.meta.creator = res.locals.auth.user._id;

  if (!entity.meta.group?.id) {
    return res.status(400).send({ message: 'A script must be assigned to a group.' });
  }

  const hasAdminRoleForGroup = await rolesService.hasAdminRoleForRequest(res, entity.meta.group.id);

  if (!hasAdminRoleForGroup) {
    return res.status(401).send();
  }

  try {
    const insertResult = await db.collection(col).insertOne(entity);
    assert.equal(insertResult?.acknowledged, true);
    return res.status(201).send({ _id: insertResult.insertedId, ...entity });
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      throw boom.conflict(`Entity with _id already exists: ${entity._id}`);
    }
  }

  throw boom.internal();
};

const updateScript = async (req, res) => {
  const { id } = req.params;
  const entity = req.body;

  const hasAdminRoleForExistingGroup = await rolesService.hasAdminRoleForRequest(
    res,
    res.locals.existing.meta.group?.id
  );

  if (!hasAdminRoleForExistingGroup) {
    return res.status(401).send();
  }

  const isUpdatingGroup = entity.meta.group?.id !== res.locals.existing.meta.group?.id;
  if (isUpdatingGroup) {
    const hasAdminRoleForNewGroup = await rolesService.hasAdminRoleForRequest(
      res,
      entity.meta.group?.id
    );

    if (!hasAdminRoleForNewGroup) {
      return res.status(401).send();
    }
  }

  sanitize(entity);
  entity.meta.dateModified = new Date();

  try {
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: new ObjectId(id) },
      // TODO: only set updatable properties instead of replacing entire entity
      { $set: entity },
      {
        returnDocument: 'after',
      }
    );
    return res.send(updated);
  } catch (err) {
    return res.status(500).send();
  }
};

const deleteScript = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteResult = await db.collection(col).deleteOne({ _id: new ObjectId(id) });
    assert.equal(1, deleteResult.deletedCount);
    return res.send({ message: 'OK' });
  } catch (error) {
    return res.status(500).send();
  }
};

export default {
  getScripts,
  getScript,
  createScript,
  updateScript,
  deleteScript,
};
