import { ObjectId } from 'mongodb';

import { db } from '../db';

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
