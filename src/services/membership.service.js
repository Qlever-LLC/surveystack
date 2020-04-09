import { ObjectId } from 'mongodb';

import boom from '@hapi/boom';

import { db } from '../db';

const col = 'memberships';

export const createMembership = async ({ user, group, role }) => {
  const entity = { user, group, role };
  const m = await db.collection(col).insertOne(entity);
  return m;
};

export default {
  createMembership,
};
