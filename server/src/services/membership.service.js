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
export const activateMembershipByAdmin = async (options) => {
  const {
    membershipId,
    origin,
    activateMembership: _activateMembership,
  } = { activateMembership, ...options };
  const membership = await db.collection(col).findOne({ _id: membershipId });
  let group = await db.collection('groups').findOne({ _id: membership.group });
  if (!group) {
    throw boom.badRequest(`Can't find a group with the ID: ${membership.group}`);
  }
  let userObject = await createUserIfNotExist(
    membership.meta.invitationEmail,
    membership.meta.invitationName
  );
  await _activateMembership({
    code: membership.meta.invitationCode,
    user: userObject._id,
  });

  const magicLink = await createMagicLink({
    origin,
    email: userObject.email,
    expiresAfterDays: 7,
    landingPath: `/g/${group.slug}/`,
  });
  const magicLinkProfile = await createMagicLink({
    origin,
    email: userObject.email,
    expiresAfterDays: 7,
    landingPath: `/auth/profile`,
  });
  const magicLinkUser = await createMagicLink({
    origin,
    email: userObject.email,
    expiresAfterDays: 7,
    landingPath: `/users/${userObject._id}/edit`,
  });

  await mailService.sendLink({
    to: userObject.email,
    subject: `You've been added to "${group.name}" in SurveyStack!`,
    link: magicLink,
    actionDescriptionHtml: `You've been added to "${group.name}" in SurveyStack!`,
    actionDescriptionText: `You've been added to "${group.name}" in SurveyStack!`,
    btnText: 'Sign in',
    afterHtml: `<b>Unsure why you're receiving this email?</b> 
"${group.name}" added you to a SurveyStack group and may have initiated an account on your behalf. 
You have control over your account. 
<a href="${magicLinkProfile}">Click here</a> to view and change groups. 
You can <a href="${magicLinkUser}">click here</a> to manage or change your account.`,
  });
};

export default {
  addMembership,
  activateMembership,
  activateMembershipByAdmin,
};
