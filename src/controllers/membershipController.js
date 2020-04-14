import assert from 'assert';
import boom from '@hapi/boom';

import { ObjectId } from 'mongodb';

import { db } from '../db';

import { populate } from '../helpers';
import mailService from '../services/mail.service';

const col = 'memberships';

const sanitize = (entity) => {
  entity._id = new ObjectId(entity._id);

  entity.group && (entity.group = new ObjectId(entity.group));
  entity.user && (entity.user = new ObjectId(entity.user));

  if (entity.meta) {
    const meta = entity.meta;
    meta.dateCreated && (meta.dateCreated = new Date(meta.dateCreated));
    meta.dateClaimed && (meta.dateClaimed = new Date(meta.dateClaimed));
  }
};

const getMemberships = async (req, res) => {
  const filter = {};

  const { group, user, invitation } = req.query;
  if (group) {
    filter.group = new ObjectId(group);
  }

  if (user) {
    filter.user = new ObjectId(user);
  }

  if (invitation) {
    filter['meta.invitation'] = invitation;
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
          $unwind: { path: '$user', preserveNullAndEmptyArrays: true },
        },
        {
          $set: {
            user: { $ifNull: ['$user', null] }, // we want user: null explicitly
          },
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
  const filter = {};

  if (!id) {
    throw boom.badRequest(`param not set: id`);
  }

  filter._id = new ObjectId(id);

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
          $unwind: { path: '$user', preserveNullAndEmptyArrays: true },
        },
        {
          $set: {
            user: { $ifNull: ['$user', null] }, // we want user: null explicitly
          },
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
  const [entity] = await db
    .collection(col)
    .aggregate(pipeline)
    .toArray();

  console.log(entity);

  if (!entity) {
    throw boom.notFound();
  }

  return res.send(entity);
};

const createMembership = async (req, res) => {
  const entity = req.body;
  sanitize(entity);

  const g = await db.collection('groups').findOne({ _id: entity.group });
  if (!g) {
    throw boom.badRequest(`Group does not exist: ${entity.group}`);
  }

  mailService.send({
    to: entity.meta.sentTo,
    subject: `SurveyStack invitation to group ${g.name}`,
    text: `Hello
    
You are invited to join group ${g.name}!
    
Please use the following link to claim your invitation:
https://app.surveystack.io/auth/register?invitation=${entity.meta.code}
    
Best Regards`,
  });

  try {
    let r = await db.collection(col).insertOne(entity);
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
  // TODO: also delete associated integrations
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
