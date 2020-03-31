import assert from 'assert';
import { ObjectId } from 'mongodb';

import boom from '@hapi/boom';

import { db } from '../db';

const col = 'groups';

const getGroups = async (req, res) => {
  let entities;
  let dir = '/';

  if (req.query.dir) {
    dir = req.query.dir;
  }

  if (!dir.endsWith('/')) {
    dir += '/';
  }

  let dirQuery = dir;
  if (req.query.tree) {
    console.log('setting dirQuery');
    dirQuery = { $regex: `^${dir}` };
  }

  entities = await db
    .collection(col)
    .find({ dir: dirQuery })
    .sort({ path: 1 })
    .toArray();
  return res.send(entities);
};

const getGroupByPath = async (req, res) => {
  let path = req.params[0];

  if (!path.endsWith('/')) {
    path += '/';
  }

  const entity = await db.collection(col).findOne({ path });

  if (!entity) {
    return res.status(404).send({
      message: `No entity found under path: ${path}`,
    });
  }

  return res.send(entity);
};

const getGroupById = async (req, res) => {
  const { id } = req.params;
  let entity;

  entity = await db.collection(col).findOne({ _id: new ObjectId(id) });

  if (!entity) {
    throw boom.notFound(`No entity with _id exists: ${id}`);
  }

  return res.send(entity);
};

const sanitizeGroup = group => {
  const slugExp = new RegExp('^[a-z0-9]+(-[a-z0-9]+)*$');
  if (!slugExp.test(group.slug)) {
    throw boom.badRequest(`Bad group slug name: ${group.slug}`);
  }
};

const createGroup = async (req, res) => {
  const entity = req.body;
  entity.path = `${entity.dir}${entity.slug}/`; // TODO: make sanitization function

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

const updateGroup = async (req, res) => {
  const { id } = req.params;
  const entity = req.body;
  entity.path = `${entity.dir}${entity.slug}/`; // TODO: make sanitization function

  const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });

  try {
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...entity, _id: new ObjectId(id) } },
      {
        returnOriginal: false,
      }
    );

    if (existing.slug !== updated.slug) {
      // also find and modify descendants
      let oldSubgroupDir = existing.path;
      let newSubgroupDir = entity.path;
      await bulkChangePaths(oldSubgroupDir, newSubgroupDir);
    }

    return res.send(updated);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

// mongodb 4.2 now allows an aggregation pipeline inside "update"
const bulkChangePaths = async (oldDir, newDir) => {
  await db.collection(col).updateMany({ dir: { $regex: `^${oldDir}` } }, [
    {
      $set: {
        dir: {
          $concat: [newDir, { $substr: ['$dir', { $strLenBytes: oldDir }, -1] }],
        },
        path: {
          $concat: [newDir, { $substr: ['$dir', { $strLenBytes: oldDir }, -1] }, '$slug', '/'],
        },
      },
    },
  ]);
};

const deleteGroup = async (req, res) => {
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

const getUsers = async (req, res) => {
  const { id } = req.params;

  var groups = [new ObjectId(id)];

  const users = await db
    .collection('users')
    .aggregate([
      { $match: { 'memberships.group': { $in: groups } } },
      { $unwind: '$memberships' },
      {
        $lookup: {
          from: 'groups',
          let: { groupId: '$memberships.group' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$groupId'] } } },
            { $project: { _id: 1, name: 1 } },
          ],
          as: 'memberships.groupDetail',
        },
      },
      { $unwind: '$memberships.groupDetail' },
      {
        $group: {
          _id: '$_id',
          email: { $first: '$email' },
          name: { $first: '$name' },
          memberships: { $push: '$memberships' },
        },
      },
      {
        $project: {
          email: 1,
          name: 1,
          memberships: {
            $filter: {
              input: '$memberships',
              as: 'membership',
              cond: { $in: ['$$membership.group', groups] },
            },
          },
        },
      },
    ])
    .toArray();

  console.log(users);

  return res.send(users);
};

export default {
  getGroups,
  getGroupByPath,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getUsers,
};
