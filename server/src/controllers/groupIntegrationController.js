import { ObjectId } from 'mongodb';
import assert from 'assert';

import boom from '@hapi/boom';

import { db } from '../db';

import rolesService from '../services/roles.service';

const col = 'integrations.groups';

const sanitizeIntegration = (entity) => {
  entity._id = new ObjectId(entity._id);
  entity.group = new ObjectId(entity.group);
  return true;
};

const getIntegrations = async (req, res) => {
  const { group, type, populate } = req.query;
  const filter = {};
  //const options = {}; // TODO: find better way to hide secrets

  if (group) {
    filter.group = new ObjectId(group);
  }

  if (type) {
    filter.type = type;
  }

  const options = { projection: { data: 0 } }; // TODO: find better way to hide secrets
  if (populate && res.locals.auth.user && res.locals.auth.user._id) {
    const access = await rolesService.hasAdminRoleForRequest(res, group);
    if (access) {
      options.projection = {};
    }
  }

  const entities = await db.collection(col).find(filter, options).toArray();
  return res.send(entities);
};

const getIntegration = async (req, res) => {
  const { id } = req.params;

  let entity;
  entity = await db.collection(col).findOne({ _id: new ObjectId(id) });
  const access = await rolesService.hasAdminRoleForRequest(res, entity.group);
  if (!access) {
    throw boom.unauthorized();
  }

  return res.send(entity);
};

const createIntegration = async (req, res) => {
  const entity = req.body;
  sanitizeIntegration(entity);

  const access = await rolesService.hasAdminRoleForRequest(res, entity.group);
  if (!access) {
    throw boom.unauthorized();
  }

  try {
    const insertResult = await db.collection(col).insertOne(entity);
    assert.equal(insertResult?.acknowledged, true);
    return res.send({ _id: insertResult.insertedId, ...entity });
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(409).send({ message: `Entity with _id already exists: ${entity._id}` });
    }
  }

  return res.status(500).send({ message: 'Internal error' });
};

const updateIntegration = async (req, res) => {
  const entity = req.body;
  const id = entity._id;

  sanitizeIntegration(entity);

  const access = await rolesService.hasAdminRoleForRequest(res, entity.group);
  if (!access) {
    throw boom.unauthorized();
  }

  try {
    delete entity._id;
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: entity },
      {
        returnDocument: 'after',
      }
    );
    return res.send(updated);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: 'Error updating integration' });
  }
};

const deleteIntegration = async (req, res) => {
  const { id } = req.params;

  const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
  const access = await rolesService.hasAdminRoleForRequest(res, existing.group);
  if (!access) {
    throw boom.unauthorized();
  }

  try {
    // TODO do we need to delete all references to this integration first?
    const deleteResult = await db.collection(col).deleteOne({ _id: new ObjectId(id) });
    assert.equal(1, deleteResult.deletedCount);
    return res.send({ message: 'OK' });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

export default {
  getIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
};
