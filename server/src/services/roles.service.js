import { ObjectId } from 'mongodb';

import { db } from '../db';

const isParent = (parent, child) => {
  return child.startsWith(parent);
};

const getParentGroups = async (groupId) => {
  const groups = await db
    .collection('groups')
    .find({ _id: new ObjectId(groupId) })
    .toArray();

  if (groups.length != 1) {
    return [];
  }

  const group = groups[0];

  const parts = group.path.split('/');
  if (parts.length < 2) {
    return [];
  }

  if (parts[1] == '') {
    return [];
  }

  const root = `/${parts[1]}/`;

  const descendants = await db
    .collection('groups')
    .find({ path: { $regex: `^${root}` } })
    .toArray();

  return descendants.filter((d) => isParent(d.path, group.path));
};

const getDescendantGroups = async (group) => {
  const descendants = await db
    .collection('groups')
    .find({ path: { $regex: `^${group.path}` } })
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
      ret = true;
    }
  });

  return ret;
};

export const hasAdminRole = async (user, group) => {
  if (!group) {
    return false;
  }
  
  const ret = await hasRole(user, group, 'admin');
  if (ret) {
    return true;
  }

  return false;
};

export const hasUserRole = async (user, group) => {
  const ret = await hasRole(user, group, 'user');
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
  hasAdminRole,
  hasUserRole,
  getDescendantGroups,
  getParentGroups,
};
