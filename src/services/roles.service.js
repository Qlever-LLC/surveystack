import { ObjectId } from 'mongodb';

import { db } from '../db';

/*
const getUser = async userId => {
  let entity;

  const pipeline = [];
  pipeline.push({ $match: { _id: userId } });

  pipeline.push(
    ...[
      { $unwind: { path: '$memberships', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'groups',
          let: { groupId: '$memberships.group' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$groupId'] } } },
            { $project: { _id: 1, name: 1, slug: 1, path: 1 } },
          ],
          as: 'memberships.groupDetail',
        },
      },
      { $unwind: { path: '$memberships.groupDetail', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          email: { $first: '$email' },
          name: { $first: '$name' },
          memberships: { $push: '$memberships' },
        },
      },
    ]
  );

  pipeline.push({ $project: { password: 0, token: 0 } });

  entity = await db
    .collection('users')
    .aggregate(pipeline)
    .toArray();

  let r = entity[0];
  if (r.memberships.length === 1 && Object.keys(r.memberships[0]).length === 0) {
    r.memberships = [];
  }

  if (!r) {
    return null;
  }

  return r;
};
*/

const getDescendantGroups = async (group) => {
  const descendants = await db
    .collection('groups')
    .find({ path: { $regex: `^${group.path}/` } })
    .toArray();
  return descendants;
};

export const getRoles = async (userId) => {
  const roles = ['public'];
  if (!userId) {
    return roles;
  }

  const memberships = await db
    .collection('memberships')
    .aggregate([
      { $match: { user: new ObjectId(userId) } },
      { $lookup: { from: 'groups', localField: 'group', foreignField: '_id', as: 'groupDetail' } },
      { $unwind: '$groupDetail' },
    ])
    .toArray();

  memberships.forEach((membership) => {
    const role = `${membership.role}@${membership.groupDetail.path}`;
    roles.push(role);
  });

  return roles;
};

export default {
  getRoles,
};
