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

export const getDescendantGroups = async (group, projection = {}) => {
  const descendants = await db
    .collection('groups')
    .find({ path: { $regex: `^${group.path}` } }, { projection: projection })
    .toArray();
  return descendants;
};

export const getAscendantGroups = async (group, projection = {}) => {
  const parts = group.path.split('/');
  const relevant = parts.filter((p) => !!p);

  const groupPaths = [];
  let last = '';
  for (const part of relevant) {
    let current = '';
    if (groupPaths.length == 0) {
      current = `/${part}/`;
    } else {
      current = `${last}${part}/`;
    }

    groupPaths.push(current);
    last = current;
  }
  const ascendants = await db
    .collection('groups')
    .find(
      {
        path: { $in: groupPaths },
      },
      { projection }
    )
    .toArray();

  return ascendants;
};

export const hasRole = async (userId, groupId, role) => {
  if (!userId || !groupId || !role) {
    return false;
  }

  const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const groupObjectId = typeof groupId === 'string' ? new ObjectId(groupId) : groupId;

  const roles = await getRoles(userObjectId);
  const groupEntity = await db.collection('groups').findOne({ _id: groupObjectId });
  const targetRole = `${role}@${groupEntity.path}`;

  return roles.some((role) => targetRole.startsWith(role));
};

const hasSuperAdminRole = async (userId) => {
  const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

  return (await db.collection('users').findOne({
    _id: userObjectId,
    permissions: { $eleMatch: { $eq: 'super-admin' } },
  }))
    ? true
    : false;
};

export const hasAdminRoleForRequest = async (res, groupId) => {
  if (res.locals.auth.isSuperAdmin) {
    return true;
  }
  let admin = false;
  if (res.locals.auth.user) {
    admin = await hasAdminRole(res.locals.auth.user._id, groupId);
  }
  return admin;
};

export const hasAdminRole = async (userId, groupId) => {
  return await hasRole(userId, groupId, 'admin');
};
export const hasUserRole = (userId, groupId) => hasRole(userId, groupId, 'user');

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
  hasSuperAdminRole,
  hasAdminRoleForRequest,
  hasAdminRole,
  hasUserRole,
  getDescendantGroups,
  getParentGroups,
};
