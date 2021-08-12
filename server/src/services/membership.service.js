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
  const membership = await db.collection(col).findOne({ 'meta.invitationCode': code });
  if (!membership) {
    throw boom.notFound(`No invitation found for code: ${code}`);
  }

  if (membership.meta.status !== 'pending') {
    throw boom.badRequest(`Code already activated: ${code}`);
  }

  // clear any existing memberships for same user & group
  const existing = await db.collection(col).find({ user, group: membership.group }).toArray();
  if (existing.length > 0) {
    console.log(
      `User ${user.email} already has ${existing.length} memberships for group ${membership.group}`
    );
    console.log('deleting existing membership now...');
    await db.collection(col).deleteMany({ _id: { $in: existing.map((e) => e._id) } });
  }

  await db.collection(col).findOneAndUpdate(
    { _id: membership._id },
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
