import assert from 'assert';
import { ObjectId } from 'mongodb';

import { db } from '../models';

const col = 'surveys';

const getSurveys = async (req, res) => {
  let entities;

  if (req.query.find) {
    if (ObjectId.isValid(req.query.find)) {
      entities = await db
        .collection(col)
        .find({ _id: new ObjectId(req.query.find) })
        .toArray();
      return res.send(entities);
    }
    entities = await db
      .collection(col)
      .find({ name: { $regex: req.query.find, $options: 'i' } })
      .toArray();
    return res.send(entities);
  }

  entities = await db
    .collection(col)
    .find({})
    .toArray();
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

const createSurvey = async (req, res) => {
  const entity = req.body;
  try {
    let r = await db.collection(col).insertOne({ ...entity, _id: new ObjectId(entity._id) });
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

  try {
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...req.body, _id: new ObjectId(id) } },
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
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
};
