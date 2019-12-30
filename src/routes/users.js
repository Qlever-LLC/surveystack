import { Router } from "express";
import { ObjectId } from "mongodb";
import assert from "assert";
import bcrypt from "bcrypt";
import uuidv4 from "uuid/v4";

import { db } from "../models";

import { assertAdmin } from "../middleware";

const router = Router();

const col = "users";

router.get("/", assertAdmin, async (req, res) => {
  let entities;

  const projection = { username: 1 };

  if (req.query.find) {
    if (ObjectId.isValid(req.query.find)) {
      entities = await db
        .collection(col)
        .find({ _id: new ObjectId(req.query.find) })
        .project(projection)
        .toArray();
      return res.send(entities);
    }
    entities = await db
      .collection(col)
      .find({ username: { $regex: req.query.find, $options: "i" } })
      .project(projection)
      .toArray();
    return res.send(entities);
  }

  entities = await db
    .collection(col)
    .find({})
    .project(projection)
    .toArray();
  return res.send(entities);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  let entity;

  entity = await db
    .collection(col)
    .findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });

  if (!entity) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`
    });
  }

  return res.send(entity);
});

router.post("/", async (req, res) => {
  const entity = req.body;

  const { username, email, password } = entity;
  if (password.trim() === "") {
    return res.status(400).send("password must not be empty");
  }

  const existing = await db.collection(col).findOne({
    username
  });

  if (existing) {
    return res
      .status(409)
      .send({ message: `User already exists: ${username}` });
  }

  const hash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS));
  const token = uuidv4();
  const user = {
    username,
    email,
    token,
    password: hash,
    permissions: [`/u/${username}`],
    authProviders: []
  };

  try {
    let r = await db
      .collection(col)
      .insertOne({ ...user, _id: new ObjectId(entity._id) });
    assert.equal(1, r.insertedCount);
    return res.send(r);
  } catch (err) {
    if (err.name === "MongoError" && err.code === 11000) {
      return res
        .status(409)
        .send({ message: `User with _id already exists: ${entity._id}` });
    }
  }

  return res.status(500).send({ message: "Internal error" });
});

router.put("/:id", async (req, res) => {
  const entity = req.body;
  const id = entity._id;
  if (id != req.params.id) {
    return res
      .status(400)
      .send({ message: `Ids do not match: ${id}, ${req.params.id}` });
  }

  const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
  if (!existing) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`
    });
  }

  if (!res.locals.auth.isAdmin && res.locals.auth.user._id != id) {
    return res.status(403).send(`Not allowed to put user: ${id}`);
  }

  const { password } = entity;
  if (password === "") {
    delete entity.password;
  } else {
    entity.password = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_ROUNDS)
    );
  }

  try {
    delete entity._id;
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: entity },
      {
        returnOriginal: false
      }
    );
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
