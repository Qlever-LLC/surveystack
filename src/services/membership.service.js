import { ObjectId } from 'mongodb';

import boom from '@hapi/boom';

import { db } from '../db';

const col = 'memberships';

export const createMembership = async ({ user, group, role }) => {
  const entity = { user, group, role };
  entity.meta = {
    status: 'active',
    dateCreated: new Date(),
    dateClaimed: new Date(),
    sentTo: null,
    notes: '(creator)',
    invitation: null,
  };
  const m = await db.collection(col).insertOne(entity);
  return m;
};

export const claimMembership = async ({ code, user }) => {
  const existing = await db.collection(col).findOne({ 'meta.invitation': code });
  if (!existing) {
    throw boom.notFound(`No invitation found for code: ${code}`);
  }

  if (existing.meta.status !== 'pending') {
    throw boom.badRequest(`Code already claimed: ${code}`);
  }

  await db.collection(col).findOneAndUpdate(
    { 'meta.invitation': code },
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
