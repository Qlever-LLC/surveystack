import { db } from '../db';

const getUser = async userId => {
  let entity;

  const pipeline = [];
  pipeline.push({ $match: { _id: userId } });

  pipeline.push(
    ...[
      { $unwind: '$memberships' },
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
      { $unwind: '$memberships.groupDetail' },
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

  if (!entity) {
    return null;
  }

  return entity[0];
};

const getDescendantGroups = async group => {
  const descendants = await db
    .collection('groups')
    .find({ path: { $regex: `^${group.path}/` } })
    .toArray();
  return descendants;
};

export const getRoles = async userId => {
  const roles = [];

  const user = await getUser(userId);

  user.memberships.forEach(async membership => {
    // TOOD: add child roles?
    roles.push(`${membership.role}@${membership.groupDetail.path}`);
  });

  return roles;
};

export default {
  getRoles,
};
