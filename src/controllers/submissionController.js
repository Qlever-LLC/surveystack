import assert from "assert";
import { ObjectId } from "mongodb";

import boom from "@hapi/boom";

import { db } from "../models";

const col = "submissions";

const getSubmissions = async (req, res) => {
  let entities;

  if (req.query.survey) {
    entities = await db
      .collection(col)
      .find({
        survey: new ObjectId(req.query.survey)
      })
      .toArray();
    return res.send(entities);
  }

  entities = await db
    .collection(col)
    .find({})
    .toArray();
  return res.send(entities);
};

const getSubmission = async (req, res) => {
  const { id } = req.params;
  let entity;

  entity = await db.collection(col).findOne({ _id: new ObjectId(id) });

  if (!entity) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`
    });
  }

  return res.send(entity);
};

const createSubmission = async (req, res) => {
  const entity = req.body;
  try {
    let r = await db
      .collection(col)
      .insertOne({ ...entity, survey: new ObjectId(entity.survey) });
    assert.equal(1, r.insertedCount);
    return res.send(r);
  } catch (err) {
    if (err.name === "MongoError" && err.code === 11000) {
      return res
        .status(409)
        .send({ message: `Entity with _id already exists: ${entity._id}` });
    }
  }

  return res.status(500).send({ message: "Internal error" });
};

const updateSubmission = async (req, res) => {
  const { id } = req.params;

  const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
  if (!existing) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`
    });
  }

  try {
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: id },
      { $set: req.body },
      {
        returnOriginal: false
      }
    );
    return res.send(updated);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Ouch :/" });
  }
};

const deleteSubmission = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db
      .collection(col)
      .findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).send({
        message: `No entity with _id exists: ${id}`
      });
    }
    let r = await db.collection(col).deleteOne({ _id: id });
    assert.equal(1, r.deletedCount);
    return res.send({ message: "OK" });
  } catch (error) {
    return res.status(500).send({ message: "Ouch :/" });
  }
};

export default {
  getSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  deleteSubmission
};
