import boom from '@hapi/boom';

import { db } from '../db';
import { createMagicLink, createUserIfNotExist } from './auth.service';
import mailService from './mail/mail.service';
import rolesService from './roles.service';
import { ObjectId } from 'mongodb';
import { queryParam } from '../helpers';

const col = 'memberships';

export const getMemberships = async ({
  group,
  user,
  invitationCode,
  status,
  role,
  populate,
  coffeeShop,
}) => {
  const filter = {};

  if (group) {
    const parentGroups = await rolesService.getParentGroups(group);
    filter.group = { $in: parentGroups.map((g) => new ObjectId(g._id)) };
  }

  if (user) {
    filter.user = new ObjectId(user);
  }

  if (role) {
    filter.role = role;
  }

  if (invitationCode) {
    filter['meta.invitationCode'] = invitationCode;
  }

  if (status) {
    filter['meta.status'] = status;
  }

  const pipeline = [{ $match: filter }];
  if (queryParam(populate) || queryParam(coffeeShop)) {
    pipeline.push(...createPopulationPipeline());
  }

  const entities = await db.collection(col).aggregate(pipeline).toArray();

  if (user) {
    const adminOfSubGroups = await getAdminOfSubGroups(entities);
    entities.push(...adminOfSubGroups);
  }

  if (group) {
    const filteredMemberships = entities.filter(
      (e) => !(e.role != 'admin' && e.group._id != group)
    );

    const otherMembers = [];
    const admins = [];

    for (const member of filteredMemberships) {
      if (member.role !== 'admin') {
        continue;
      }

      if (member.user && admins.find((m) => m.user && `${m.user._id}` === `${member.user._id}`)) {
        continue;
      }

      if (admins.find((m) => `${m._id}` === `${member._id}`)) {
        continue;
      }

      admins.push(member);
    }

    for (const member of filteredMemberships) {
      if (member.role !== 'user') {
        continue;
      }

      if (
        member.user &&
        otherMembers.find((m) => m.user && `${m.user._id}` === `${member.user._id}`)
      ) {
        continue;
      }

      if (otherMembers.find((m) => `${m._id}` === `${member._id}`)) {
        continue;
      }

      otherMembers.push(member);
    }

    return [...admins, ...otherMembers];
  }

  // FarmOS integration settings for coffee-shop
  if (queryParam(coffeeShop)) {
    const farmosCoffeeshop = await db
      .collection('farmos-coffeeshop')
      .find({ group: { $in: entities.map((item) => item.group._id) } })
      .toArray();
    const enableIds = farmosCoffeeshop.map((item) => String(item.group));

    entities.forEach((entity, index) => {
      entities[index].group.coffeeShopSettings = {
        groupHasCoffeeshopAccess: enableIds.includes(String(entity.group._id)),
      };
    });
  }

  return entities;
};

export const createPopulationPipeline = () => {
  const pipeline = [];
  const userLookup = [
    {
      $lookup: {
        from: 'users',
        let: { userId: '$user' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
          { $project: { name: 1, email: 1 } },
        ],
        as: 'user',
      },
    },
    {
      $unwind: { path: '$user', preserveNullAndEmptyArrays: true },
    },
    {
      $set: {
        user: { $ifNull: ['$user', null] }, // we want user: null explicitly
      },
    },
  ];
  pipeline.push(...userLookup);

  const groupLookup = [
    {
      $lookup: {
        from: 'groups',
        let: { groupId: '$group' },
        pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$groupId'] } } }],
        as: 'group',
      },
    },
    {
      $unwind: '$group',
    },
  ];
  pipeline.push(...groupLookup);
  pipeline.push({ $sort: { 'group.path': 1 } });

  return pipeline;
};

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
    // make sure the path is separated by single '/'s
    landingPath: `/g/${group.path.split('/').filter(Boolean).join('/')}/`,
  });
  const magicLinkProfile = await createMagicLink({
    origin,
    email: userObject.email,
    expiresAfterDays: 7,
    landingPath: `/auth/profile`,
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
<a href="${magicLinkProfile}">Click here</a> to manage or change your account. `,
  });
};

const getAdminOfSubGroups = async (entities) => {
  const adminOfSubGroups = [];
  for (const e of [...entities]) {
    if (e.role === 'admin') {
      const subgroups = await rolesService.getDescendantGroups(e.group);

      for (const subgroup of subgroups) {
        const isEntityPresent = entities.some(
          (item) => String(item.group._id) === String(subgroup._id)
        );
        const isSubGroupPresent = adminOfSubGroups.some(
          (item) => String(item.group._id) === String(subgroup._id)
        );

        if (isEntityPresent || isSubGroupPresent) {
          continue;
        }

        const cpy = { ...e };
        cpy.group = { ...subgroup };
        e.projected = true;
        adminOfSubGroups.push(cpy);
      }
    }
  }

  return adminOfSubGroups;
};

export default {
  addMembership,
  activateMembership,
  activateMembershipByAdmin,
  createPopulationPipeline,
  getMemberships,
};
