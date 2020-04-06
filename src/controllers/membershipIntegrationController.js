import { ObjectId } from 'mongodb';
import assert from 'assert';

import boom from '@hapi/boom';

import { db } from '../db';

import { populate } from '../helpers';

const col = 'integrations.memberships';

const sanitizeIntegration = (entity) => {
  entity._id = new ObjectId(entity._id);
  entity.membership = new ObjectId(entity.membership);
  return true;
};

const getIntegrations = async (req, res) => {
  const { membership, type, user } = req.query;
  const filter = {};

  if (type) {
    filter.type = type;
  }

  // integrations for a specific user
  if (user) {
    const memberships = await db
      .collection('memberships')
      .find({ user: new ObjectId(user) })
      .project({ _id: 1 })
      .toArray();
    filter.membership = { $in: memberships.map((m) => m._id) };
  }

  // ... or override with integrations for a specific membership
  if (membership) {
    filter.membership = new ObjectId(membership);
  }

  console.log('filter', filter);

  const entities = await db
    .collection(col)
    .find(filter)
    .toArray();
  return res.send(entities);
};

const getIntegration = async (req, res) => {
  const { id } = req.params;

  let entity;
  entity = await db.collection(col).findOne({ _id: new ObjectId(id) });

  return res.send(entity);
};

const createIntegration = async (req, res) => {
  const entity = req.body;
  sanitizeIntegration(entity);

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

const updateIntegration = async (req, res) => {
  const entity = req.body;
  const id = entity._id;
  sanitizeIntegration(entity);

  try {
    delete entity._id;
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

const deleteIntegration = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).send({
        message: `No entity with _id exists: ${id}`,
      });
    }
    let r = await db.collection(col).deleteOne({ _id: new ObjectId(id) });
    assert.equal(1, r.deletedCount);
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
