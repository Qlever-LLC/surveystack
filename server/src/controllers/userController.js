import { ObjectId } from 'mongodb';
import assert from 'assert';
import bcrypt from 'bcrypt';
import uuidv4 from 'uuid/v4';

import boom from '@hapi/boom';

import { db } from '../db';
import { createCookieOptions } from '../constants';
import _, { isEmpty, isString } from 'lodash';
import IsEmail from 'isemail';

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

  entities = await db.collection(col).find({}).project(projection).toArray();
  return res.send(entities);
};

const getUser = async (req, res) => {
  const { id } = req.params;

  const pipeline = [];
  pipeline.push({ $match: { _id: new ObjectId(id) } });
  pipeline.push({ $project: { email: 1, name: 1 } });

  const [entity] = await db.collection(col).aggregate(pipeline).toArray();

  if (!entity) {
    throw boom.notFound(`No user found for id: ${id}`);
  }

  return res.send(entity);
};

/**
 * returns true if the user owns an instance at least once
 */
const isUserOwner = async (req, res) => {
  const { userId } = req.params;
  const ownership = await db.collection('farmos-instances').findOne({
    userId: new ObjectId(userId),
    owner: true,
  });
  const response = !!ownership;
  return res.send(response);
};

// response structure
/*
  [
    { 
      instanceName: "instanceName", 
      isOwner: true, 
      groups: [
        { "groupId":"string id", "groupName": "name"},
        { "groupId":"string id", "groupName": "name"},
      ], 
      otherUsers: [
        { "userId":"string id", "userEmail": "email"},
        { "userId":"string id", "userEmail": "email"},
      ]
    }
    { 
      instanceName: "instanceName",
      isOwner: false
    }
  ]
*/
const getOwnership = async (req, res) => {
  const { userId } = req.params;
  const data = [];
  const groupCompl = [];
  const userCompl = [];

  const instances = await db
    .collection('farmos-instances')
    .find({
      userId: new ObjectId(userId),
    })
    .toArray();
  instances.map((obj) => {
    data.push({
      instanceName: obj.instanceName,
      isOwner: !!obj.owner,
    });
  });

  const instanceNamesWhereOwner = instances.filter((el) => el.owner).map((obj) => obj.instanceName);

  // groups part
  const groupsMapped = await db
    .collection('farmos-group-mapping')
    .find({
      instanceName: { $in: instanceNamesWhereOwner },
    })
    .toArray();
  const groupIds = groupsMapped.map((el) => el.groupId);
  const groupsAffected = await db
    .collection('groups')
    .find({
      _id: { $in: groupIds.map((id) => new ObjectId(id)) },
    })
    .toArray();

  for (const inst of instanceNamesWhereOwner) {
    const groupMappings = groupsMapped
      .filter((e) => e.instanceName === inst)
      .map((f) => ({
        groupId: groupsAffected.find((g) => String(g._id) === String(f.groupId))._id,
        groupName: groupsAffected.find((g) => String(g._id) === String(f.groupId)).name,
      }));

    groupCompl.push({
      instanceName: inst,
      groups: groupMappings,
    });
  }

  // otherUsers part
  const usersMapped = await db
    .collection('farmos-instances')
    .find({
      instanceName: { $in: instanceNamesWhereOwner },
    })
    .toArray();
  const userIds = usersMapped.map((el) => el.userId);
  const usersAffected = await db
    .collection('users')
    .find({
      _id: { $in: userIds.map((id) => new ObjectId(id)) },
    })
    .toArray();

  for (const inst of instanceNamesWhereOwner) {
    const userMappings = usersMapped
      .filter((e) => e.instanceName === inst)
      .map((f) => ({
        userId: usersAffected.find((g) => String(g._id) === String(f.userId))._id,
        userEmail: usersAffected.find((g) => String(g._id) === String(f.userId)).email,
      }));

    userCompl.push({
      instanceName: inst,
      otherUsers: userMappings,
    });
  }

  // merge data with all complements arrays
  const mergeById = (array1, array2) =>
    array1.map((itm) => ({
      ...array2.find((item) => item.instanceName === itm.instanceName && item),
      ...itm,
    }));

  const mergedGroupData = mergeById(data, groupCompl);
  const mergedData = mergeById(mergedGroupData, userCompl);

  res.send(mergedData);
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
  const { _id: id, password, name, email } = req.body;

  const updatedUser = {};

  if (isString(name) && !isEmpty(name)) {
    updatedUser.name = name;
  }

  if (isString(email) && !isEmpty(email)) {
    if (!IsEmail.validate(email)) {
      throw boom.badRequest('Invalid email address');
    }
    updatedUser.email = email;
  }

  if (!res.locals.auth.isSuperAdmin && res.locals.auth.user._id != id) {
    throw boom.unauthorized(`Not allowed to put user: ${id}`);
  }

  if (isString(password) && !isEmpty(password)) {
    updatedUser.password = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

    // create a new user token when password changes
    updatedUser.token = uuidv4();

    // remove the previously set token header
    // use a try-catch because it's accessing undocumented API and failing is non-critical
    try {
      _.remove(res._headers['set-cookie'], (c) => c.startsWith('token='));
    } catch (e) {
      console.warn(e);
    }
    // udpate the token in the cookie header for backward compatibility: https://gitlab.com/our-sci/software/surveystack/-/merge_requests/33#note_700125477
    res.cookie('token', updatedUser.token, createCookieOptions());
  }

  try {
    const updated = await db
      .collection(col)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updatedUser },
        { returnOriginal: false }
      );
    return res.send(updated);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: 'Failed to update user.' });
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
  isUserOwner,
  getOwnership,
  createUser,
  updateUser,
  deleteUser,
};
