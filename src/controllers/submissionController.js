import assert from 'assert';
import { ObjectId } from 'mongodb';

import boom from '@hapi/boom';

import { db } from '../db';

const col = 'submissions';

const sanitize = entity => {
  if (entity._id) {
    entity._id = new ObjectId(entity._id);
  }
  entity.survey = new ObjectId(entity.survey);
  entity.meta.dateCreated = new Date(entity.meta.dateCreated);
  return entity;
};

const getSubmissions = async (req, res) => {
  let entities;

  let find = {};
  let project = {};
  let sort = {};
  let skip = 0;
  let limit = 0;

  if (req.query.survey) {
    find.survey = new ObjectId(req.query.survey);
  }

  if (req.query.find) {
    try {
      const f = JSON.parse(req.query.find);
      find = { ...find, ...f };
    } catch (error) {
      throw boom.badRequest('invalid find query');
    }
  }

  if (req.query.project) {
    try {
      const p = JSON.parse(req.query.project);
      project = { ...project, ...p };
    } catch (error) {
      throw boom.badRequest('invalid project query');
    }
  }

  if (req.query.sort) {
    try {
      const s = JSON.parse(req.query.sort);
      sort = { ...sort, ...s };
    } catch (error) {
      throw boom.badRequest('invalid sort query');
    }
  }

  if (req.query.skip) {
    skip = Number.parseInt(req.query.skip);
  }

  if (req.query.limit) {
    limit = Number.parseInt(req.query.limit);
  }

  entities = await db
    .collection(col)
    .find(find)
    .sort(sort)
    .project(project)
    .skip(skip)
    .limit(limit)
    .toArray();
  return res.send(entities);
};

const getSubmission = async (req, res) => {
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

const createSubmission = async (req, res) => {
  const entity = sanitize(req.body);

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

const updateSubmission = async (req, res) => {
  const { id } = req.params;
  const entity = sanitize(req.body);

  try {
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: id },
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

const deleteSubmission = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).send({
        message: `No entity with _id exists: ${id}`,
      });
    }
    let r = await db.collection(col).deleteOne({ _id: id });
    assert.equal(1, r.deletedCount);
    return res.send({ message: 'OK' });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

export default {
  getSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  deleteSubmission,
};
