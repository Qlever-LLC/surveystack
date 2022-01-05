import assert from 'assert';
import { ObjectId } from 'mongodb';

import boom from '@hapi/boom';

import { db } from '../db';
import { queryParam } from '../helpers';

import membershipService from '../services/membership.service';
import rolesService from '../services/roles.service';

const col = 'groups';

const sanitizeGroup = (entity) => {
  entity._id = new ObjectId(entity._id);

  if (!entity.slug) {
    throw boom.badRequest(`Group slug not set`);
  }

  const slugExp = new RegExp('^[a-z0-9]+(-[a-z0-9]+)*$');
  if (!slugExp.test(entity.slug)) {
    throw boom.badRequest(`Bad group slug name: ${entity.slug}`);
  }

  if (entity.dir !== '/') {
    if (entity.dir.length <= 2 || !entity.dir.startsWith('/') || !entity.dir.endsWith('/')) {
      throw boom.badRequest(`Bad group dir: ${entity.dir}`);
    }

    let slugs = entity.dir.split('/');
    // remove first and last empty strings
    slugs.shift();
    slugs.pop();
    slugs.forEach((slug) => {
      if (!slugExp.test(slug)) {
        throw boom.badRequest(`Bad group dir: ${entity.dir}`);
      }
    });
  }

  if (entity.surveys && entity.surveys.pinned) {
    entity.surveys.pinned = entity.surveys.pinned.map((p) => {
      if (typeof p === 'object') {
        return new ObjectId(p._id);
      }
      return new ObjectId(p);
    });
  }

  entity.path = `${entity.dir}${entity.slug}/`;
};

const createPinnedSurveysPopulationStages = () => {
  // Aggregation to populate favorites such as "surveys.pinned"
  // This is a bit tricky, because we want users to have duplicate and - more importantly - ordered survey favorites.
  // The $lookup stage however removes duplicate references and does not guarantee order
  // https://stackoverflow.com/questions/55033804/aggregate-lookup-does-not-return-elements-original-array-order
  // https://jira.mongodb.org/browse/SERVER-32494
  return [
    {
      $lookup: {
        from: 'surveys',
        let: { surveyIds: { $ifNull: ['$surveys.pinned', []] } },
        pipeline: [
          { $match: { $expr: { $in: ['$_id', '$$surveyIds'] } } },
          {
            $addFields: {
              sort: { $indexOfArray: ['$$surveyIds', '$_id'] },
            },
          },
          { $sort: { sort: 1 } },
          { $addFields: { sort: '$$REMOVE' } },
          { $project: { name: 1, latestVersion: 1, meta: 1 } },
        ],
        as: 'surveys.pinnedDetails',
      },
    },
    {
      $addFields: {
        'surveys.pinned': {
          $map: {
            input: { $ifNull: ['$surveys.pinned', []] },
            as: 'a',
            in: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$surveys.pinnedDetails',
                    cond: { $eq: ['$$this._id', '$$a'] },
                  },
                },
                0,
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        'surveys.pinned': {
          $filter: {
            input: '$surveys.pinned',
            as: 'sp',
            cond: {
              $ne: ['$$sp', null],
            },
          },
        },
        'surveys.pinnedDetails': '$REMOVE',
      },
    },
  ];
};

const getGroups = async (req, res) => {
  const { showArchived, prefix } = req.query;

  let entities;
  let dir = '/';

  let archived = false;
  if (queryParam(showArchived)) {
    archived = true;
  }

  if (req.query.dir) {
    dir = req.query.dir;
  }

  if (!dir.endsWith('/')) {
    dir += '/';
  }

  let dirQuery = dir;
  if (req.query.tree) {
    dirQuery = { $regex: `^${dir}` };
  }

  const findQuery = {
    dir: dirQuery,
    'meta.archived': archived,
  };

  if (prefix) {
    delete findQuery.dir;
    findQuery.path = { $regex: `^${prefix}` };
  }

  entities = await db.collection(col).find(findQuery).sort({ path: 1 }).toArray();
  return res.send(entities);
};

const getGroupByPath = async (req, res) => {
  let path = req.params[0];

  if (!path.endsWith('/')) {
    path += '/';
  }

  const pipeline = [{ $match: { path } }];

  if (queryParam(req.query.populate)) {
    pipeline.push(...createPinnedSurveysPopulationStages());
  }

  const [entity] = await db.collection(col).aggregate(pipeline).toArray();

  if (!entity) {
    return res.status(404).send({
      message: `No entity found under path: ${path}`,
    });
  }

  return res.send(entity);
};

const getGroupById = async (req, res) => {
  const { id } = req.params;
  const pipeline = [{ $match: { _id: new ObjectId(id) } }];

  if (queryParam(req.query.populate)) {
    pipeline.push(...createPinnedSurveysPopulationStages());
  }

  const [entity] = await db.collection(col).aggregate(pipeline).toArray();

  if (!entity) {
    return res.status(404).send({
      message: `No entity found with _id: ${id}`,
    });
  }

  return res.send(entity);
};

const createGroup = async (req, res) => {
  const entity = req.body;
  sanitizeGroup(entity);

  // TODO: only allow admins to create subgroups
  if (entity.dir !== '/') {
    const parentGroup = await db.collection(col).findOne({ path: entity.dir });
    if (!parentGroup) {
      throw boom.notFound(`No parent group found for subgroup (${entity.dir})`);
    }

    const hasAdminRoleForParentGroup = await rolesService.hasAdminRole(
      res.locals.auth.user._id,
      parentGroup._id
    );

    if (!hasAdminRoleForParentGroup) {
      throw boom.unauthorized(
        `You do not have admin rights for parent group (admin@${parentGroup.path})`
      );
    }
  }

  let r;

  try {
    r = await db.collection(col).insertOne(entity);
    assert.equal(1, r.insertedCount);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      throw boom.conflict(`Conflict _id or path: ${entity._id}, ${entity.path}`);
    }
    throw boom.internal(`createGroup: unknown internal error`);
  }

  await membershipService.addMembership({
    user: res.locals.auth.user._id,
    group: entity._id,
    role: 'admin',
  });

  return res.send(r);
};

const updateGroup = async (req, res) => {
  const { id } = req.params;
  const entity = req.body;
  sanitizeGroup(entity);

  const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
  const hasAdminRole = await rolesService.hasRole(
    res.locals.auth.user._id,
    new ObjectId(id),
    'admin'
  );
  if (!hasAdminRole) {
    throw boom.unauthorized(`You are not authorized: admin@${existing.path}`);
  }

  try {
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: entity._id },
      { $set: { ...entity } },
      {
        returnOriginal: false,
      }
    );

    if (existing.slug !== updated.slug) {
      // also find and modify descendants
      let oldPath = existing.path;
      let newPath = entity.path;
      await bulkChangePaths(oldPath, newPath);
    }

    return res.send(updated);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

// mongodb 4.2 now allows an aggregation pipeline inside "update"
const bulkChangePaths = async (oldDir, newDir) => {
  // groups
  await db.collection('groups').updateMany({ dir: { $regex: `^${oldDir}` } }, [
    {
      $set: {
        dir: {
          $concat: [newDir, { $substr: ['$dir', { $strLenBytes: oldDir }, -1] }],
        },
        path: {
          $concat: [newDir, { $substr: ['$dir', { $strLenBytes: oldDir }, -1] }, '$slug', '/'],
        },
      },
    },
  ]);
  // submissions
  await db.collection('submissions').updateMany({ 'meta.group.path': { $regex: `^${oldDir}` } }, [
    {
      $set: {
        'meta.group.path': {
          $concat: [newDir, { $substr: ['$meta.group.path', { $strLenBytes: oldDir }, -1] }],
        },
      },
    },
  ]);
  // surveys
  await db.collection('surveys').updateMany({ 'meta.group.path': { $regex: `^${oldDir}` } }, [
    {
      $set: {
        'meta.group.path': {
          $concat: [newDir, { $substr: ['$meta.group.path', { $strLenBytes: oldDir }, -1] }],
        },
      },
    },
  ]);
};

const deleteGroup = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).send({
        message: `No entity with _id exists: ${id}`,
      });
    }
    let r = await db.collection(col).deleteOne({ _id: new ObjectId(id) });
    assert.equal(1, r.deletedCount);
    return res.send({ message: 'OK' });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

const addDocLink = async (req, res) => {
  const { groupid, doc, addToDescendants } = req.body;

  try {
    // add doc to given group
    const existing = await db.collection(col).findOne({ _id: new ObjectId(groupid) });

    let groupIdsToUpdate = [];

    if (addToDescendants) {
      // find all descendant sub groups and add doc too
      const groupAndSubgroups = await rolesService.getDescendantGroups(existing);
      for (const subgroup of groupAndSubgroups) {
        groupIdsToUpdate.push(subgroup._id);
      }
    } else {
      existing.docs ? existing.docs.push(doc) : (existing.docs = [doc]);
      groupIdsToUpdate.push(existing._id);
    }

    let result = await db
      .collection(col)
      .updateMany({ _id: { $in: groupIdsToUpdate } }, { $addToSet: { docs: doc } });

    return res.send(result);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

const removeDocLink = async (req, res) => {
  const { groupid, doc, removeFromDescendants } = req.body;

  try {
    const existing = await db.collection(col).findOne({ _id: new ObjectId(groupid) });

    let groupIdsToUpdate = [];

    if (removeFromDescendants) {
      // find all descendant sub groups and add doc too
      const groupAndSubgroups = await rolesService.getDescendantGroups(existing);
      for (const subgroup of groupAndSubgroups) {
        groupIdsToUpdate.push(subgroup._id);
      }
    } else {
      existing.docs ? existing.docs.push(doc) : (existing.docs = [doc]);
      groupIdsToUpdate.push(existing._id);
    }

    let result = await db
      .collection(col)
      .updateMany({ _id: { $in: groupIdsToUpdate } }, { $pull: { docs: { link: doc.link } } });

    return res.send(result);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

export default {
  getGroups,
  getGroupByPath,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addDocLink,
  removeDocLink,
};
