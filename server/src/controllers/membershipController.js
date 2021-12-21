import assert from 'assert';
import boom from '@hapi/boom';

import { ObjectId } from 'mongodb';

import { db } from '../db';

import { queryParam } from '../helpers';
import mailService from '../services/mail/mail.service';
import membershipService from '../services/membership.service';
import rolesService from '../services/roles.service';
import { createLoginPayload, createUserIfNotExist } from '../services/auth.service';
import { pick } from 'lodash';
import flatten from 'flat'

const col = 'memberships';

const sanitize = (entity) => {
  entity._id = new ObjectId(entity._id);

  entity.group && (entity.group = new ObjectId(entity.group));
  entity.user && (entity.user = new ObjectId(entity.user));

  if (entity.meta) {
    const meta = entity.meta;
    meta.dateCreated && (meta.dateCreated = new Date(meta.dateCreated));
    meta.dateSent && (meta.dateSent = new Date(meta.dateSent));
    meta.dateActivated && (meta.dateActivated = new Date(meta.dateActivated));
  }
};

const createPopulationPipeline = () => {
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

const getAdminOfSubGroups = async (entities) => {
  const adminOfSubGroups = [];
  for (const e of [...entities]) {
    if (e.role === 'admin') {
      const subgroups = await rolesService.getDescendantGroups(e.group);

      for (const subgroup of subgroups) {
        // console.log('subgroup', subgroup._id);
        // console.log('entities', entities);
        // console.log('adminOfSubGroups', adminOfSubGroups);

        if (adminOfSubGroups.find((m) => m.group._id == subgroup._id)) {
          continue;
        }

        const presentEntity = entities.find((e) => `${e.group._id}` == `${subgroup._id}`);
        // console.log('found entity', presentEntity);

        if (presentEntity) {
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

const getMemberships = async (req, res) => {
  const filter = {};

  const { group, user, invitationCode, status } = req.query;
  if (group) {
    const parentGroups = await rolesService.getParentGroups(group);
    // console.log('parentGroups', parentGroups);
    filter.group = { $in: parentGroups.map((g) => new ObjectId(g._id)) };
    // console.log('filter', filter);
  }

  if (user) {
    filter.user = new ObjectId(user);
  }

  if (invitationCode) {
    filter['meta.invitationCode'] = invitationCode;
  }

  if (status) {
    filter['meta.status'] = status;
  }

  const pipeline = [{ $match: filter }];
  if (queryParam(req.query.populate)) {
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

      if (
        member.user &&
        admins.find((m) => m.user && `${m.user._id}` === `${member.user._id}`)
      ) {
        continue;
      }

      if (admins.find((m) => `${m._id}` === `${member._id}`)) {
        continue;
      }

      admins.push(member);
    }

    // console.log('admins', admins);

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

    return res.send([...admins, ...otherMembers]);
  }

  return res.send(entities);
};

const getTree = async (req, res) => {
  const { user } = req.query;

  if (!user && !res.locals.auth.isAuthenticated) {
    return res.send([]);
  }

  const userId = new ObjectId(user ? user : res.locals.auth.user._id);

  const membershipPipeline = [
    { $match: { user: userId, 'meta.status': 'active' } },
    { $project: { role: 1, group: 1 } },
  ];

  membershipPipeline.push(...createPopulationPipeline());
  membershipPipeline.push(
    ...[
      {
        $lookup: {
          from: 'groups',
          let: { path: '$group.path' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $indexOfCP: ['$path', '$$path'] }, 0] },
              },
            },
            { $project: { name: 1, slug: 1, dir: 1, path: 1 } },
          ],
          as: 'group',
        },
      },
      { $unwind: '$group' },
      {
        $group: {
          _id: '$group._id',
          group: { $first: '$group' },
          roles: { $addToSet: '$role' },
        },
      },
      {
        $sort: { 'group.path': 1 },
      },
    ]
  );

  const memberships = await db.collection(col).aggregate(membershipPipeline).toArray();

  const m = await db
    .collection(col)
    .aggregate([{ $match: { user: userId } }])
    .toArray();

  return res.send(memberships);
};

const getMembership = async (req, res) => {
  const { id } = req.params;
  const filter = {};

  if (!id) {
    throw boom.badRequest(`param not set: id`);
  }

  filter._id = new ObjectId(id);

  const pipeline = [{ $match: filter }];

  if (queryParam(req.query.populate)) {
    pipeline.push(...createPopulationPipeline());
  }
  const [entity] = await db.collection(col).aggregate(pipeline).toArray();

  console.log(entity);

  if (!entity) {
    throw boom.notFound();
  }

  return res.send(entity);
};

const createMembership = async (req, res) => {
  const entity = req.body;
  const { sendEmail } = req.query;
  sanitize(entity);

  console.log(req.headers);

  if (!entity.meta.invitationEmail) {
    throw boom.badRequest('Need to supply an email address');
  }

  const adminAccess = await rolesService.hasAdminRole(res.locals.auth.user._id, entity.group);
  if (!adminAccess) {
    throw boom.unauthorized(`Only group admins can create memberships`);
  }

  if (sendEmail === 'SEND_NOW') {
    await sendMembershipInvitation({ membership: entity, origin: req.headers.origin });
    entity.meta.dateSent = new Date();
  }

  try {
    let r = await db.collection(col).insertOne(entity);
    assert.strictEqual(1, r.insertedCount);
    return res.send(r);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      throw boom.conflict(`Entity with _id already exists: ${entity._id}`);
    }
  }

  throw boom.internal();
};

// Work in progress
const joinGroup = async (req, res) => {
  const { id: groupId } = req.query;

  const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });
  if (!group) {
    throw boom.badRequest('Group not found');
  }

  if (group.meta.invitationOnly) {
    throw boom.badRequest('Group is set to invitation only');
  }

  const { user } = res.locals.auth;

  let r = await db.collection(col).findOne({
    group: group._id,
    user: user._id,
  });
  console.log("user in group findone result: ", r)
  if(r) {
    return res.send({
      status: "ok"
    })
  }

  const membership = {
    user: user._id,
    group: group._id,
    role: 'user',
    meta: {
      status: 'active',
      dateCreated: new Date(),
      dateSent: null,
      dateActivated: new Date(),
      notes: '',
      invitationEmail: null,
      invitationCode: null,
    },
  };

  try {
    let r = await db.collection(col).insertOne(membership);
    assert.strictEqual(1, r.insertedCount);
    console.log(r);
    return res.send(r);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      throw boom.conflict(`Entity with _id already exists`);
    }
  }

  throw boom.internal();
};

const sendMembershipInvitation = async ({ membership, origin }) => {
  const group = await db.collection('groups').findOne({ _id: membership.group });
  if (!group) {
    throw boom.badRequest(`Group does not exist: ${membership.group}`);
  }

  await mailService.sendLink({
    to: membership.meta.invitationEmail,
    subject: `SurveyStack invitation to group ${group.name}`,
    link: `${origin}/invitations?code=${membership.meta.invitationCode}`,
    actionDescriptionHtml: `You have been invited to join group '${group.name}'!`,
    actionDescriptionText: `You have been invited to join group '${group.name}'!\nFollow this link to activate your invitation:`,
    btnText: 'Join',
  });
};

const resendInvitation = async (req, res) => {
  const membership = res.locals.existing;
  const adminAccess = await rolesService.hasAdminRole(res.locals.auth.user._id, membership.group);
  if (!adminAccess) {
    throw boom.unauthorized(`Only group admins can resend membership invitations`);
  }
  await sendMembershipInvitation({ membership, origin: req.headers.origin });
  const updated = await db
    .collection(col)
    .findOneAndUpdate(
      { _id: membership._id },
      { $set: { 'meta.dateSent': new Date() } },
      { returnOriginal: false }
    );
  return res.send(updated.value);
};

const updateMembership = async (req, res) => {
  const { id } = req.params;
  const { group } = req.body;

  const adminAccess = await rolesService.hasAdminRole(res.locals.auth.user._id, group);
  if (!adminAccess) {
    throw boom.unauthorized(`Only group admins can update memberships`);
  }

  // select the fields that are updateable by the user
  // TODO validate role (user/admin?)
  const update = flatten(pick(req.body, ['role', 'meta.invitationName']));

  try {
    let updated = await db
      .collection(col)
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: update }, { returnOriginal: false });
    return res.send(updated);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

const deleteMembership = async (req, res) => {
  const { id } = req.params;

  const membership = await db.collection(col).findOne({ _id: new ObjectId(id) });
  if (!membership) {
    throw boom.notFound(`No membership found: ${id}`);
  }

  const adminAccess = await rolesService.hasAdminRole(res.locals.auth.user._id, membership.group);
  const userAccess = res.locals.auth.user._id.equals(membership.user);
  if (!adminAccess && !userAccess) {
    throw boom.unauthorized(`Only group admins or oneself can delete memberships`);
  }

  try {
    let r = await db.collection(col).deleteOne({ _id: new ObjectId(id) });
    assert.equal(1, r.deletedCount);

    // delete associated intgegrations
    await db.collection('integrations.memberships').deleteMany({ membership: new ObjectId(id) });

    return res.send({ message: 'OK' });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

const activateMembership = async (req, res) => {
  const { code } = req.body;
  let user;
  let loginPayload = null;

  const membership = await db.collection(col).findOne({ 'meta.invitationCode': code });
  // is authenticated with the user that owns the invitation
  if (
    res.locals.auth.isAuthenticated &&
    res.locals.auth.user.email === membership.meta.invitationEmail
  ) {
    user = res.locals.auth.user._id;
  } else {
    const userObject = await createUserIfNotExist(
      membership.meta.invitationEmail,
      membership.meta.invitationName
    );
    loginPayload = await createLoginPayload(userObject);
    user = userObject._id;
  }
  await membershipService.activateMembership({ code, user });

  if (loginPayload) {
    res.send(loginPayload);
  } else {
    res.send({ message: 'ok' });
  }
};

export default {
  getMemberships,
  getMembership,  
  createMembership,
  updateMembership,
  deleteMembership,
  activateMembership,
  getTree,
  resendInvitation,
  joinGroup,
};
