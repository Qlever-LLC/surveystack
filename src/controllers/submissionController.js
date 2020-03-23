import _ from 'lodash';

import assert from 'assert';
import { ObjectId } from 'mongodb';

import boom from '@hapi/boom';

import { db } from '../db';
import csvService from '../services/csv.service';

const col = 'submissions';
const DEFAULT_LIMIT = 100000;

const sanitize = entity => {
  if (entity._id) {
    entity._id = new ObjectId(entity._id);
  }
  entity.survey = new ObjectId(entity.survey);
  entity.meta.dateCreated = new Date(entity.meta.dateCreated);
  entity.meta.dateModified = new Date(entity.meta.dateModified);

  if (entity.meta.creator) {
    entity.meta.creator = new ObjectId(entity.meta.creator);
  }

  // TODO: may want to save dateModified from nested data meta fields
  // as new Date(..) as well, currently it is just a string

  return entity;
};

const sanitizeMatch = obj => {
  Object.keys(obj).forEach(key => {
    //console.log(`key: ${key}, value: ${obj[key]}`);
    if (typeof obj[key] === 'object') {
      // check for {"$date": "2020-01-30"}
      // and transform it into new Date("2020-01-30")
      if (obj[key]['$date']) {
        const v = obj[key]['$date'];
        obj[key] = new Date(v);
        return;
      }
      sanitizeMatch(obj[key]);
    }
  });
};

const createRedactStage = (user, roles) => {
  return {
    $redact: {
      $switch: {
        branches: [
          // check if user is creator
          {
            case: { $eq: [user ? new ObjectId(user) : 'NO_AUTH_USER', '$$ROOT.meta.creator'] },
            then: '$$KEEP',
          },
          // check for owner rights
          {
            case: {
              $in: [
                user ? new ObjectId(user) : 'NO_AUTH_USER',
                { $ifNull: ['$$ROOT.meta.owners', []] },
              ],
            },
            then: '$$KEEP',
          },
          // check if meta.permissions does not exist or is empty
          {
            case: { $eq: [{ $size: { $ifNull: ['$meta.permissions', []] } }, 0] },
            then: '$$DESCEND',
          },
          // check if user has specific role
          // e.g. "meta.permissions": ['admin'], "$$ROOT.meta.path": "/oursci/lab"
          // => User needs 'admin@/oursci/lab' to view
          {
            case: {
              $gt: [
                {
                  $size: {
                    $setIntersection: [
                      {
                        $concatArrays: [
                          {
                            $map: {
                              input: '$meta.permissions',
                              as: 'role',
                              in: { $concat: ['$$role', '@', '$$ROOT.meta.path'] },
                            },
                          },
                        ],
                      },
                      roles,
                    ],
                  },
                },
                0,
              ],
            },
            then: '$$DESCEND',
          },
        ],
        default: '$$PRUNE', // default do not proceed
      },
    },
  };
};

const buildPipeline = async (req, res) => {
  const pipeline = [];

  let match = {};
  let project = {};
  let sort = {};
  let skip = 0;
  let limit = DEFAULT_LIMIT;
  let user = null;
  let roles = [];

  // initial match stage to filter surveys
  if (req.query.survey) {
    pipeline.push({ $match: { survey: new ObjectId(req.query.survey) } });
  }

  // redact stage
  if (res.locals.auth.user) {
    user = res.locals.auth.user._id.toString();
    // TODO: remove this hack and do a real implementation
    console.log('User is ', user);
    if (user === '5e452119c5117c000185f275') {
      roles.push('admin@/our-sci');
    }
  }

  if (req.query.roles) {
    const splits = req.query.roles.split(',');
    splits.forEach(role => {
      roles.push(role.trim());
    });
  }

  console.log('creating redact stage with user', user);
  const redactStage = createRedactStage(user, roles);
  pipeline.push(redactStage);

  // user defined match stage
  if (req.query.match) {
    try {
      const m = JSON.parse(req.query.match);
      match = { ...match, ...m };
      sanitizeMatch(match);
    } catch (error) {
      throw boom.badRequest('invalid match query');
    }
    pipeline.push({ $match: match });
  }

  // project stage
  if (req.query.project) {
    try {
      const p = JSON.parse(req.query.project);
      project = { ...project, ...p };
    } catch (error) {
      throw boom.badRequest('invalid project query');
    }

    if (!_.isEmpty(project)) {
      const autoProjections = {};
      if (_.some(project, v => v === 0) && _.some(project, v => v === 1)) {
        throw boom.badRequest(`One can not mix and match inclusion and exclusion in project stage`);
      }

      /*
        If a nested field inside a group was marked as 1
        then we should also include the meta data of the parents
        e.g.
        {"data.personal_group.age": 1}
        => {"data.personal_group.age": 1, "data.personal_group.meta": 1}
        Furthermore, the root level "meta" should be included
      */
      if (_.every(project, v => v === 1)) {
        autoProjections.meta = 1;
        _.map(project, (v, k) => {
          const splits = k.split('.');
          if (splits[0] === 'data' && splits.length > 2) {
            let key = 'data';
            for (let i = 1; i < splits.length - 1; i++) {
              key += `.${splits[i]}`;
              autoProjections[`${key}.meta`] = 1;
            }
          }
        });
      }
      project = { ...project, ...autoProjections };
      pipeline.push({ $project: project });
    }
  }

  // sort stage
  if (req.query.sort) {
    try {
      const s = JSON.parse(req.query.sort);
      sort = { ...sort, ...s };
    } catch (error) {
      throw boom.badRequest(`Bad query paramter sort: ${sort}`);
    }

    _.forOwn(sort, v => {
      if (v !== -1 && v !== 1) {
        throw boom.badRequest(`Bad query paramter sort, value must be either 1 or -1`);
      }
    });

    if (!_.isEmpty(sort)) {
      pipeline.push({
        $sort: sort,
      });
    }
  }
  return pipeline;
};

const getSubmissionsPage = async (req, res) => {
  let entities;
  let skip = 0;
  let limit = DEFAULT_LIMIT;

  const pipeline = await buildPipeline(req, res);

  // skip
  if (req.query.skip) {
    try {
      const querySkip = Number.parseInt(req.query.skip);
      if (querySkip > 0) {
        skip = querySkip;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query paramter skip: ${skip}`);
    }
  }

  // limit
  if (req.query.limit) {
    try {
      const queryLimit = Number.parseInt(req.query.limit);
      if (queryLimit > 0) {
        limit = queryLimit;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query paramter limit: ${limit}`);
    }
  }

  // pagination stage
  const paginationStages = [
    {
      $facet: {
        content: [{ $skip: skip }, { $limit: limit }],
        pagination: [{ $count: 'total' }, { $addFields: { skip, limit } }],
      },
    },
    { $unwind: '$pagination' },
  ];

  console.log(pipeline);
  pipeline.push(...paginationStages);

  entities = await db
    .collection(col)
    .aggregate(pipeline)
    .toArray();

  return res.send(entities[0]);
};

const getSubmissions = async (req, res) => {
  let entities;
  let skip = 0;
  let limit = DEFAULT_LIMIT;

  const pipeline = await buildPipeline(req, res);

  // skip
  if (req.query.skip) {
    try {
      const querySkip = Number.parseInt(req.query.skip);
      if (querySkip > 0) {
        skip = querySkip;
        pipeline.push({ $skip: skip });
      }
    } catch (error) {
      throw boom.badRequest(`Bad query paramter skip: ${skip}`);
    }
  }

  // limit
  if (req.query.limit) {
    try {
      const queryLimit = Number.parseInt(req.query.limit);
      if (queryLimit > 0) {
        limit = queryLimit;
        pipeline.push({ $limit: limit });
      }
    } catch (error) {
      throw boom.badRequest(`Bad query paramter limit: ${limit}`);
    }
  }

  entities = await db
    .collection(col)
    .aggregate(pipeline)
    .toArray();

  if (req.query.format === 'csv') {
    const csv = csvService.createCsv(entities);
    res.set('Content-Type', 'text/plain');
    return res.send(csv);
  }

  return res.send(entities);
};

const getSubmission = async (req, res) => {
  const { id } = req.params;
  let entity;

  entity = await db.collection(col).findOne({ _id: new ObjectId(id) });

  if (!entity) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`,
    });
  }

  return res.send(entity);
};

const createSubmission = async (req, res) => {
  const entity = sanitize(req.body);

  // apply creator
  if (res.locals.auth.user) {
    entity.meta.creator = res.locals.auth.user._id;
  } else {
    entity.meta.creator = null;
  }

  try {
    let r = await db.collection(col).insertOne(entity);
    assert.equal(1, r.insertedCount);
    return res.send(r);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(409).send({ message: `Entity with _id already exists: ${entity._id}` });
    }
  }

  return res.status(500).send({ message: 'Internal error' });
};

const updateSubmission = async (req, res) => {
  const { id } = req.params;
  const entity = sanitize(req.body);

  try {
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: id },
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

const deleteSubmission = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).send({
        message: `No entity with _id exists: ${id}`,
      });
    }
    let r = await db.collection(col).deleteOne({ _id: id });
    assert.equal(1, r.deletedCount);
    return res.send({ message: 'OK' });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

export default {
  getSubmissions,
  getSubmissionsPage,
  getSubmission,
  createSubmission,
  updateSubmission,
  deleteSubmission,
};
