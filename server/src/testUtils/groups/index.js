const { getDb } = jest.requireActual('../../db');
const { deburr, kebabCase, uniqueId } = jest.requireActual('lodash');
const { ObjectId } = jest.requireActual('mongodb');
const crypto = jest.requireActual('crypto');
import { createUser } from '../users';

const asMongoId = (source) =>
  source instanceof ObjectId ? source : ObjectId(typeof source === 'string' ? source : source._id);

const createGroup = async (_overrides = {}) => {
  const { name = `group ${uniqueId()}`, ...overrides } = _overrides;
  const doc = {
    meta: {
      archived: false,
      specVersion: 2,
      invitationOnly: true,
      ...overrides.meta,
    },
    name,
    slug: kebabCase(deburr(name)),
    dir: '/',
    path: `/${kebabCase(deburr(name))}/`,
    surveys: {
      pinned: [],
      ...overrides.surveys,
    },
    ...overrides,
  };

  const insertResult = await getDb().collection('groups').insertOne(doc);
  const group = { _id: insertResult.insertedId, ...doc };

  const createUserMember = async ({ userOverrides, membershipOverrides } = {}) => {
    const user = await createUser(userOverrides);
    const membership = await createMembership({
      user,
      group: group._id,
      role: 'user',
      ...membershipOverrides,
    });
    return { user, membership };
  };
  const createAdminMember = async ({ userOverrides, membershipOverrides } = {}) => {
    return await createUserMember({
      userOverrides,
      membershipOverrides: { role: 'admin', ...membershipOverrides },
    });
  };

  const createSubGroup = async (nameObj, _overrides = {}) => {
    const { name } = nameObj;
    return await createGroup({
      name: name,
      dir: doc.path,
      path: doc.path + kebabCase(deburr(name)) + '/',
      ..._overrides,
    });
  };

  return { ...group, createUserMember, createAdminMember, createSubGroup };
};

const createMembership = async (_overrides = {}) => {
  const { user, group, ...overrides } = _overrides;
  const doc = {
    user: overrides.meta?.status === 'pending' ? null : asMongoId(user),
    group: asMongoId(group),
    role: 'user',
    meta: {
      status: 'active',
      dateCreated: new Date(),
      dateSent: null,
      dateActivated: new Date(),
      invitationEmail: null,
      invitationCode: crypto.randomBytes(32).toString('hex'),
      ...overrides.meta,
    },
    ...overrides,
  };
  const insertResult = await getDb().collection('memberships').insertOne(doc);

  return { _id: insertResult.insertedId, ...doc };
};

const deleteMemberships = (groupId, userId) =>
  getDb()
    .collection('memberships')
    .deleteMany({
      group: asMongoId(groupId),
      user: asMongoId(userId),
    });

/**
 * membershipId must be ObjectId
 * @param {ObjectId} membershipId
 * @param {*} role
 * @returns
 */
const setRole = async (membershipId, role) => {
  return await getDb().collection('memberships').findOneAndUpdate(
    { _id: membershipId },
    { $set: { role } },
    {
      returnDocument: 'after',
    }
  );
};

export { createGroup, createMembership, deleteMemberships, setRole, asMongoId };
