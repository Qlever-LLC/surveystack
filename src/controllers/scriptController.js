import assert from 'assert';
import boom from '@hapi/boom';

import { ObjectId } from 'mongodb';

import { db } from '../db';

const col = 'scripts';

const sanitize = entity => {
  entity._id = new ObjectId(entity._id);
};

const getScripts = async (req, res) => {
  const entities = await db
    .collection(col)
    .find({})
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

  try {
    let r = await db.collection(col).insertOne({ ...entity, _id: new ObjectId(entity._id) });
    assert.equal(1, r.insertedCount);
    return res.send(r);
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

  sanitize(entity);

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

const deleteScript = async (req, res) => {
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
  getScripts,
  getScript,
  createScript,
  updateScript,
  deleteScript,
};
