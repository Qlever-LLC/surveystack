import { ObjectId } from 'mongodb';

import { db } from '../db';

const getDescendantGroups = async (group) => {
  const descendants = await db
    .collection('groups')
    .find({ path: { $regex: `^${group.path}/` } })
    .toArray();
  return descendants;
};

export const hasRole = async (user, group, role) => {
  if (!user || !group || !role) {
    return false;
  }

  const userId = typeof user === 'string' ? new ObjectId(user) : user;
  const groupId = typeof group === 'string' ? new ObjectId(group) : group;

  const roles = await getRoles(userId);
  const groupEntity = await db.collection('groups').findOne({ _id: groupId });
  const targetRole = `${role}@${groupEntity.path}`;

  let ret = false;
  roles.forEach((r) => {
    if (targetRole.startsWith(r)) {
      console.log(
        `targetRole '${targetRole}' starts with '${r}'\n  => User ${userId} is granted ${role}@${groupEntity.path}`
      );
      ret = true;
    }
  });

  return ret;
};

export const getRoles = async (user) => {
  const roles = ['public'];
  if (!user) {
    return roles;
  }

  const userId = typeof user === 'string' ? new ObjectId(user) : user;

  const memberships = await db
    .collection('memberships')
    .aggregate([
      { $match: { user: userId } },
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
  hasRole,
};
