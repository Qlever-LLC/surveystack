import { ObjectId } from 'mongodb';
import assert from 'assert';
import bcrypt from 'bcrypt';
import uuidv4 from 'uuid/v4';

import boom from '@hapi/boom';

import { db } from '../db';

const col = 'users';

const getUsers = async (req, res) => {
  let entities;

  const projection = { name: 1, email: 1 };

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
      .find({ name: { $regex: req.query.find, $options: 'i' } })
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
};

/*
// TODO: secure this route
const getUsersByGroup = async (req, res) => {
  const { group } = req.params;

  const entities = await db
    .collection('users')
    .aggregate([
      {
        $match: {
          $or: [{ 'group.user': new ObjectId(group) }, { 'group.admin': new ObjectId(group) }],
        },
      },
      {
        $lookup: {
          from: 'groups',
          let: { usergroups: { $ifNull: ['$group.user', []] } },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$usergroups'] } } },
            { $project: { slug: 0 } },
          ],
          as: 'group.user',
        },
      },
      {
        $lookup: {
          from: 'groups',
          let: { admingroups: { $ifNull: ['$group.admin', []] } },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$admingroups'] } } },
            { $project: { slug: 0 } },
          ],
          as: 'group.admin',
        },
      },
      {
        $project: {
          email: 1,
          name: 1,
          group: 1,
        },
      },
    ])
    .toArray();

  return res.send(entities);
};
*/

const getUser = async (req, res) => {
  const { id } = req.params;

  const pipeline = [];
  pipeline.push({ $match: { _id: new ObjectId(id) } });
  pipeline.push({ $project: { email: 1, name: 1 } });

  const [entity] = await db
    .collection(col)
    .aggregate(pipeline)
    .toArray();

  if (!entity) {
    throw boom.notFound(`No user found for id: ${id}`);
  }

  return res.send(entity);
};

const createUser = async (req, res) => {
  const entity = req.body;

  const { email, name, password, memberships } = entity;
  if (password.trim() === '') {
    throw boom.badRequest('Password must not be empty');
  }

  const hash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS));
  const token = uuidv4();
  const user = {
    email,
    name,
    token,
    password: hash,
    permissions: [],
    authProviders: [],
  };

  // TODO: only allow admins of group to create memberships
  try {
    let r = await db.collection(col).insertOne({ ...user, _id: new ObjectId(entity._id) });
    assert.equal(1, r.insertedCount);
    return res.send(r.ops[0]);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(409).send({ message: `User with _id already exists: ${entity._id}` });
    }
  }

  return res.status(500).send({ message: 'Internal error' });
};

const updateUser = async (req, res) => {
  const entity = req.body;
  const id = entity._id;

  if (!res.locals.auth.isSuperAdmin && res.locals.auth.user._id != id) {
    throw boom.unauthorized(`Not allowed to put user: ${id}`);
  }

  const { password } = entity;
  if (password === '') {
    delete entity.password;
  } else {
    entity.password = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));
  }

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

const deleteUser = async (req, res) => {
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
  getUsers,
  getUser,
  //getUsersByGroup,
  createUser,
  updateUser,
  deleteUser,
};
