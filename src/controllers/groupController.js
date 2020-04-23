import assert from 'assert';
import { ObjectId } from 'mongodb';

import boom from '@hapi/boom';

import { db } from '../db';
import { populate } from '../helpers';

import membershipService from '../services/membership.service';

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

  entity.path = `${entity.dir}${entity.slug}/`;
};

const getGroups = async (req, res) => {
  let entities;
  let dir = '/';

  if (req.query.dir) {
    dir = req.query.dir;
  }

  if (!dir.endsWith('/')) {
    dir += '/';
  }

  let dirQuery = dir;
  if (req.query.tree) {
    console.log('setting dirQuery');
    dirQuery = { $regex: `^${dir}` };
  }

  entities = await db
    .collection(col)
    .find({ dir: dirQuery })
    .sort({ path: 1 })
    .toArray();
  return res.send(entities);
};

const getGroupByPath = async (req, res) => {
  let path = req.params[0];

  if (!path.endsWith('/')) {
    path += '/';
  }

  const pipeline = [{ $match: { path } }];

  // Aggregation to populate favorites such as "surveys.pinned"
  // This is a bit tricky, because we want users to have duplicate and - more importantly - ordered survey favorites.
  // The $lookup stage however removes duplicate references and does not guarantee order
  // https://stackoverflow.com/questions/55033804/aggregate-lookup-does-not-return-elements-original-array-order
  // https://jira.mongodb.org/browse/SERVER-32494
  if (populate(req)) {
    pipeline.push(
      ...[
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
              { $project: { name: 1 } },
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
            'surveys.pinnedDetails': '$REMOVE',
          },
        },
      ]
    );
  }

  const [entity] = await db
    .collection(col)
    .aggregate(pipeline)
    .toArray();

  if (!entity) {
    return res.status(404).send({
      message: `No entity found under path: ${path}`,
    });
  }

  return res.send(entity);
};

const getGroupById = async (req, res) => {
  const { id } = req.params;
  let entity;

  entity = await db.collection(col).findOne({ _id: new ObjectId(id) });

  if (!entity) {
    throw boom.notFound(`No entity with _id exists: ${id}`);
  }

  return res.send(entity);
};

const createGroup = async (req, res) => {
  const entity = req.body;
  sanitizeGroup(entity);

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

// TODO: only allow admins to update group
const updateGroup = async (req, res) => {
  const { id } = req.params;
  const entity = req.body;
  sanitizeGroup(entity);

  const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });

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
      let oldSubgroupDir = existing.path;
      let newSubgroupDir = entity.path;
      await bulkChangePaths(oldSubgroupDir, newSubgroupDir);
    }

    return res.send(updated);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

// mongodb 4.2 now allows an aggregation pipeline inside "update"
const bulkChangePaths = async (oldDir, newDir) => {
  await db.collection(col).updateMany({ dir: { $regex: `^${oldDir}` } }, [
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

export default {
  getGroups,
  getGroupByPath,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
};
