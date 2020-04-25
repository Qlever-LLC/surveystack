import assert from 'assert';
import boom from '@hapi/boom';

import { ObjectId } from 'mongodb';

import { db } from '../db';

import { populate } from '../helpers';
import mailService from '../services/mail.service';
import membershipService from '../services/membership.service';
import rolesService from '../services/roles.service';

const col = 'memberships';

const sanitize = (entity) => {
  entity._id = new ObjectId(entity._id);

  entity.group && (entity.group = new ObjectId(entity.group));
  entity.user && (entity.user = new ObjectId(entity.user));

  if (entity.meta) {
    const meta = entity.meta;
    meta.dateCreated && (meta.dateCreated = new Date(meta.dateCreated));
    meta.dateClaimed && (meta.dateClaimed = new Date(meta.dateClaimed));
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

  return pipeline;
};

const getMemberships = async (req, res) => {
  const filter = {};

  const { group, user, invitation, status } = req.query;
  if (group) {
    filter.group = new ObjectId(group);
  }

  if (user) {
    filter.user = new ObjectId(user);
  }

  if (invitation) {
    filter['meta.invitation'] = invitation;
  }

  if (status) {
    filter['meta.status'] = status;
  }

  const pipeline = [{ $match: filter }];
  if (populate(req)) {
    pipeline.push(...createPopulationPipeline());
  }

  const entities = await db
    .collection(col)
    .aggregate(pipeline)
    .toArray();

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

  const memberships = await db
    .collection(col)
    .aggregate(membershipPipeline)
    .toArray();

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

  if (populate(req)) {
    pipeline.push(...createPopulationPipeline());
  }
  const [entity] = await db
    .collection(col)
    .aggregate(pipeline)
    .toArray();

  console.log(entity);

  if (!entity) {
    throw boom.notFound();
  }

  return res.send(entity);
};

const createMembership = async (req, res) => {
  const entity = req.body;
  sanitize(entity);

  const g = await db.collection('groups').findOne({ _id: entity.group });
  if (!g) {
    throw boom.badRequest(`Group does not exist: ${entity.group}`);
  }

  const adminAccess = await rolesService.hasAdminRole(res.locals.auth.user._id, entity.group);
  if (!adminAccess) {
    throw boom.unauthorized(`Only group admins can create memberships`);
  }

  mailService.send({
    to: entity.meta.sentTo,
    subject: `Surveystack invitation to group ${g.name}`,
    text: `Hello
    
You are invited to join group ${g.name}!
    
Please use the following link to claim your invitation:
${process.env.SERVER_URL}/invitations?code=${entity.meta.invitation}
    
Best Regards`,
  });

  try {
    let r = await db.collection(col).insertOne(entity);
    assert.equal(1, r.insertedCount);
    return res.send(r);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      throw boom.conflict(`Entity with _id already exists: ${entity._id}`);
    }
  }

  throw boom.internal();
};

const updateMembership = async (req, res) => {
  const { id } = req.params;
  const entity = req.body;

  sanitize(entity);

  const adminAccess = await rolesService.hasAdminRole(res.locals.auth.user._id, entity.group);
  if (!adminAccess) {
    throw boom.unauthorized(`Only group admins can update memberships`);
  }

  try {
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: entity },
      {
        returnOriginal: false,
      }
    );
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

const claimMembership = async (req, res) => {
  const { code } = req.body;
  const user = res.locals.auth.user._id;

  await membershipService.claimMembership({ code, user });

  return res.send('OK');
};

export default {
  getMemberships,
  getMembership,
  createMembership,
  updateMembership,
  deleteMembership,
  claimMembership,
  getTree,
};
