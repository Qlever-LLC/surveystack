import assert from 'assert';
import boom from '@hapi/boom';

import { ObjectId } from 'mongodb';

import { db } from '../db';

import { populate } from '../helpers';

const col = 'memberships';

const sanitize = entity => {
  entity._id = new ObjectId(entity._id);
};

const getMemberships = async (req, res) => {
  const filter = {};

  const { group } = req.query;
  if (group) {
    filter.group = new ObjectId(group);
  }

  const pipeline = [{ $match: filter }];
  if (populate(req)) {
    pipeline.push(
      ...[
        {
          $lookup: {
            from: 'users',
            let: { userId: '$user' },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
              { $project: { name: 1, email: 1 } },
            ],
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
      ]
    );

    pipeline.push(
      ...[
        {
          $lookup: {
            from: 'groups',
            let: { groupId: '$group' },
            pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$groupId'] } } }],
            as: 'group',
          },
        },
        {
          $unwind: '$group',
        },
      ]
    );
  }

  const entities = await db
    .collection(col)
    .aggregate(pipeline)
    .toArray();

  return res.send(entities);
};

const getMembership = async (req, res) => {
  const { id } = req.params;

  console.log('getMembership', id);
  const entity = await db.collection(col).findOne({ _id: new ObjectId(id) });

  if (!entity) {
    throw boom.notFound();
  }

  return res.send(entity);
};

const createMembership = async (req, res) => {
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

const updateMembership = async (req, res) => {
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

const deleteMembership = async (req, res) => {
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
  getMemberships,
  getMembership,
  createMembership,
  updateMembership,
  deleteMembership,
};
