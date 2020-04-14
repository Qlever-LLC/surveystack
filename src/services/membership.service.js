import { ObjectId } from 'mongodb';

import boom from '@hapi/boom';

import { db } from '../db';

const col = 'memberships';

export const createMembership = async ({ user, group, role }) => {
  const entity = { user, group, role };
  const m = await db.collection(col).insertOne(entity);
  return m;
};

export const claimMembership = async ({ invitation, user }) => {
  await db.collection(col).findOneAndUpdate(
    { 'meta.invitation': invitation },
    {
      $set: {
        user: user,
        'meta.status': 'active',
        'meta.dateClaimed': new Date(),
      },
    }
  );
};

export default {
  createMembership,
  claimMembership,
};
