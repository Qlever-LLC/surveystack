import boom from '@hapi/boom';

import { db } from '../db';

const col = 'memberships';

export const addMembership = async ({ user, group, role }) => {
  const entity = { user, group, role };
  entity.meta = {
    status: 'active',
    dateCreated: new Date(),
    dateSent: null,
    dateActivated: new Date(),
    notes: '(creator)',
    invitationEmail: null,
    invitationCode: null,
  };
  const m = await db.collection(col).insertOne(entity);
  return m;
};

export const activateMembership = async ({ code, user }) => {
  const existing = await db.collection(col).findOne({ 'meta.invitationCode': code });
  if (!existing) {
    throw boom.notFound(`No invitation found for code: ${code}`);
  }

  if (existing.meta.status !== 'pending') {
    throw boom.badRequest(`Code already activated: ${code}`);
  }

  await db.collection(col).findOneAndUpdate(
    { 'meta.invitationCode': code },
    {
      $set: {
        user: user,
        'meta.status': 'active',
        'meta.dateActivated': new Date(),
      },
    }
  );
};

export default {
  addMembership,
  activateMembership,
};
