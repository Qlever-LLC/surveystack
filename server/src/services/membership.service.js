import boom from '@hapi/boom';

import { db } from '../db';
import { createMagicLink, createUserIfNotExist } from './auth.service';
import mailService from './mail/mail.service';

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
      `User ${user} already has ${existing.length} memberships for group ${membership.group}`
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

// activates the membership and notifies the user in email
export const activateMembershipByAdmin = async ({ membershipId, origin }) => {
  const membership = await db.collection(col).findOne({ _id: membershipId });
  let group = await db.collection('groups').findOne({ _id: membership.group });
  if (!group) {
    throw boom.badRequest(`Can't find a group with the ID: ${membership.group}`);
  }
  let userObject = await createUserIfNotExist(
    membership.meta.invitationEmail,
    membership.meta.invitationName
  );
  await activateMembership({
    code: membership.meta.invitationCode,
    user: userObject._id,
  });

  const magicLink = await createMagicLink({
    origin,
    email: userObject.email,
    expiresAfterDays: 7,
    landingPath: `/g/${group.slug}/`,
  });

  await mailService.sendLink({
    to: userObject.email,
    subject: `SurveyStack sign in`,
    link: magicLink,
    // TODO add the rest of the copy
    actionDescriptionHtml: `You've been added to "${group.name}" in SurveyStack!`,
    actionDescriptionText: `You've been added to "${group.name}" in SurveyStack!`,
    btnText: 'Sign in',
  });
};

export default {
  addMembership,
  activateMembership,
  activateMembershipByAdmin,
};
