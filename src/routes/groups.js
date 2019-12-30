import { Router } from "express";
import { ObjectId } from "mongodb";
import assert from "assert";

import { db } from "../models";
import { GROUP_PATH_DELIMITER } from "../constants";

const router = Router();

const col = "groups";

router.get("/", async (req, res) => {
  let entities;

  /*
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
      .find({ name: { $regex: req.query.find, $options: "i" } })
      .toArray();
    return res.send(entities);
  }
  */

  if (req.query.path) {
    entities = await db
      .collection(col)
      .find({ path: req.query.path })
      .sort({ name: 1 })
      .toArray();
    return res.send(entities);
  }

  entities = await db
    .collection(col)
    .find({ path: null })
    .toArray();
  return res.send(entities);
});

router.get("/by-path*", async (req, res) => {
  console.log("req.params[0] =", req.params[0]);
  let entity;

  const splits = req.params[0]
    .split(GROUP_PATH_DELIMITER)
    .filter(split => split !== "");

  console.log(splits);

  let path = null;
  let name = null;

  if (splits.length === 0) {
    return res.status(400).send({ message: "Invalid path" });
  }

  if (splits.length === 1) {
    name = splits[0];
    path = null;
  }

  if (splits.length > 1) {
    name = splits.pop();
    path =
      GROUP_PATH_DELIMITER +
      splits.join(GROUP_PATH_DELIMITER) +
      GROUP_PATH_DELIMITER;
  }

  console.log("path", path);
  console.log("name", name);

  entity = await db.collection(col).findOne({ path, name });

  if (!entity) {
    return res.status(404).send({
      message: `No entity found: path=${path}, name=${name}`
    });
  }

  return res.send(entity);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  let entity;

  entity = await db.collection(col).findOne({ _id: new ObjectId(id) });

  if (!entity) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`
    });
  }

  return res.send(entity);
});

router.post("/", async (req, res) => {
  const entity = req.body;
  try {
    let r = await db
      .collection(col)
      .insertOne({ ...entity, _id: new ObjectId(entity._id) });
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
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
  if (!existing) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`
    });
  }

  const entity = req.body;

  try {
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...entity, _id: new ObjectId(id) } },
      {
        returnOriginal: false
      }
    );

    // also find and modify descendants
    let oldSubgroupPath = `${existing.path}${existing.name}${GROUP_PATH_DELIMITER}`;
    if (existing.path === null) {
      oldSubgroupPath = `${GROUP_PATH_DELIMITER}${existing.name}${GROUP_PATH_DELIMITER}`;
    }

    let newSubgroupPath = `${entity.path}${entity.name}${GROUP_PATH_DELIMITER}`;
    if (entity.path === null) {
      newSubgroupPath = `${GROUP_PATH_DELIMITER}${entity.name}${GROUP_PATH_DELIMITER}`;
    }

    await db
      .collection(col)
      .find({ path: { $regex: `^${oldSubgroupPath}` } })
      .forEach(descendant => {
        console.log(`${descendant.path}${descendant.name}`);
      });
    console.log(`old_name: '${existing.name}' => new_name: '${entity.name}'`);
    console.log(
      `old_path: '${oldSubgroupPath}' => new_path: '${newSubgroupPath}'`
    );
    console.log(
      `This change will affect descendants under '${oldSubgroupPath}'`
    );

    // with MONGO 4.2 "update" can accept an aggregation pipeline
    // https://stackoverflow.com/questions/12589792/how-to-replace-substring-in-mongodb-document
    await bulkChangePaths(oldSubgroupPath, newSubgroupPath);

    return res.send(updated);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Ouch :/" });
  }
});

router.delete("/:id", async (req, res) => {
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
    let r = await db.collection(col).deleteOne({ _id: new ObjectId(id) });
    assert.equal(1, r.deletedCount);
    return res.send({ message: "OK" });
  } catch (error) {
    return res.status(500).send({ message: "Ouch :/" });
  }
});

export default router;
