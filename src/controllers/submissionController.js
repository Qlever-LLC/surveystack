import _ from 'lodash';

import assert from 'assert';
import { ObjectId } from 'mongodb';

import boom from '@hapi/boom';

import { db } from '../db';
import csvService from '../services/csv.service';
import headerService from '../services/header.service';
import * as farmOsService from '../services/farmos.service';
import rolesService from '../services/roles.service';
import { queryParam } from '../helpers';

const col = 'submissions';
const DEFAULT_LIMIT = 100000;
const DEFAULT_SORT = { _id: -1 }; // reverse insert order

// NOTE: when adding fields to a submission
// you may need to adapt csv.service.js in both back-end and front-end
const sanitize = async (entity) => {
  if (entity._id) {
    entity._id = new ObjectId(entity._id);
  }

  entity.meta.dateCreated = new Date(entity.meta.dateCreated);
  entity.meta.dateModified = new Date(entity.meta.dateModified);
  entity.meta.dateSubmitted = new Date();

  entity.meta.survey.id = new ObjectId(entity.meta.survey.id);

  if (entity.meta.group) {
    if (entity.meta.group.id) {
      const _id = new ObjectId(entity.meta.group.id);
      entity.meta.group.id = _id;
      const group = await db.collection('groups').findOne({ _id });
      if (group) {
        entity.meta.group.path = group.path;
      }
    }
  }

  if (entity.meta.creator) {
    entity.meta.creator = new ObjectId(entity.meta.creator);
  }

  if (entity.meta.original) {
    entity.meta.original = new ObjectId(entity.meta.original);
  }

  // TODO: may want to save dateModified from nested data meta fields
  // as new Date(..) as well, currently it is just a string

  return entity;
};

const sanitizeMatch = (obj) => {
  Object.keys(obj).forEach((key) => {
    //console.log(`key: ${key}, value: ${obj[key]}`);
    if (typeof obj[key] === 'object') {
      // check for {"$date": "2020-01-30"}
      // and transform it into new Date("2020-01-30")
      if (obj[key]['$date']) {
        const v = obj[key]['$date'];
        obj[key] = new Date(v);
        return;
      }

      if (obj[key]['$oid']) {
        const v = obj[key]['$oid'];
        obj[key] = new ObjectId(v);
        return;
      }

      // if (/^.*\.(creator|id)$/) {
      //   obj[key] = ObjectId(obj[key]);
      //   return;
      // }
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
          // e.g. "meta.permissions": ['admin'], "$$ROOT.meta.group.path": "/oursci/lab/"
          // => User needs 'admin@/oursci/lab/' to view
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
                              in: { $concat: ['$$role', '@', '$$ROOT.meta.group.path'] },
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
          // Assume "meta.permissions": ['admin'] and "$$ROOT.meta.group.path": "/oursci/lab/testing/"
          // => submission_role = "admin@/oursci/lab/testing/"
          // A user role of "admin@/oursci/" can view, since
          // "admin@/oursci/lab/testing" is a regexMatch of "^admin@/oursci/"
          // TODO: with this case branch, we probably dont even need the one from before
          {
            case: {
              $anyElementTrue: {
                $map: {
                  input: {
                    $map: {
                      input: '$meta.permissions',
                      as: 'role',
                      in: { $concat: ['$$role', '@', '$$ROOT.meta.group.path'] },
                    },
                  },
                  as: 'submission_role',
                  in: {
                    $anyElementTrue: {
                      $map: {
                        input: roles,
                        as: 'user_role',
                        in: {
                          $regexMatch: {
                            input: '$$submission_role',
                            regex: { $concat: ['^', '$$user_role'] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            then: '$$DESCEND',
          },
        ],
        default: '$$PRUNE', // default do not proceed
      },
    },
  };
};

const createRelevanceStage = () => {
  return {
    $redact: {
      $cond: {
        if: { $eq: ['$meta.relevant', false] },
        then: '$$PRUNE',
        else: '$$DESCEND',
      },
    },
  };
};

const createDataMetaStage = () => {
  return {
    $redact: {
      $cond: {
        if: { $eq: ['$CURRENT', false] },
        then: '$$PRUNE',
        else: '$$DESCEND',
      },
    },
  };
};

const buildPipeline = async (req, res) => {
  const pipeline = [];

  let match = {};
  let project = {};
  let sort = DEFAULT_SORT;
  let skip = 0;
  let limit = DEFAULT_LIMIT;
  let user = null;
  let roles = [];

  // initial match stage to filter surveys
  if (req.query.survey) {
    pipeline.push({
      $match: { 'meta.survey.id': new ObjectId(req.query.survey) },
    });
  }

  // archived
  const archivedMatch = { 'meta.archived': { $ne: true } };
  if (queryParam(req.query.showArchived)) {
    archivedMatch['meta.archived'] = true;
  }
  pipeline.push({ $match: archivedMatch });
  
  if (req.query.creator) {
    pipeline.push({
      $match: {
        'meta.creator': new ObjectId(req.query.creator),
      },
    });
  }

  if (req.query.group) {
    pipeline.push({
      $match: {
        'meta.group.id': new ObjectId(req.query.group),
      },
    });
  }

  // Authenticated either Authorization header or Cookie
  if (res.locals.auth.isAuthenticated) {
    // Authorization header
    user = res.locals.auth.user._id.toString();
    roles.push(...res.locals.auth.roles);
  } else if (req.cookies.user && req.cookies.token) {
    // Cookie
    user = req.cookies.user;
    const userRoles = await rolesService.getRoles(user);
    roles.push(...userRoles);
  }

  // Add creator details if request has admin rights on survey.
  // However, don't add creator details if pure=1 is set (e.g. for re-submissions)
  if (user && req.query.survey && !queryParam(req.query.pure)) {
    const survey = await db.collection('surveys').findOne({ _id: new ObjectId(req.query.survey) });
    const groupId = survey.meta.group.id;
    const hasAdminRights = await rolesService.hasAdminRole(user, groupId);

    if (hasAdminRights) {
      pipeline.push({
        $lookup: {
          from: 'users',
          let: { creatorId: '$meta.creator' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$creatorId'] } } },
            { $project: { name: 1, email: 1, _id: 0 } },
          ],
          as: 'meta.creatorDetail',
        },
      });
      pipeline.push({
        $unwind: { path: '$meta.creatorDetail', preserveNullAndEmptyArrays: true },
      });
    }
  }

  // Hide fields with meta.relevant = false (and below) by default
  // However, don't hide if query showIrrelevant=1 or pure=1
  if (!queryParam(req.query.showIrrelevant) && !queryParam(req.query.pure)) {
    const relevanceStage = createRelevanceStage();
    pipeline.push(relevanceStage);
  }

  // For development purposes
  if (process.env.NODE_ENV === 'development' && req.query.roles) {
    try {
      const splits = req.query.roles.split(',');
      splits.forEach((role) => {
        roles.push(role.trim());
      });
    } catch (error) {
      console.log(error);
    }
  }

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
      if (_.some(project, (v) => v === 0) && _.some(project, (v) => v === 1)) {
        throw boom.badRequest(`One can not mix and match inclusion and exclusion in project stage`);
      }

      project = { ...project, ...autoProjections };
      pipeline.push({ $project: project });
    }
  }

  // sort stage
  if (req.query.sort) {
    try {
      const s = JSON.parse(req.query.sort);
      if (!_.isEmpty(s)) {
        sort = s;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query paramter sort: ${sort}`);
    }

    _.forOwn(sort, (v) => {
      if (v !== -1 && v !== 1) {
        throw boom.badRequest(`Bad query paramter sort, value must be either 1 or -1`);
      }
    });
  }

  pipeline.push({
    $sort: sort,
  });
  return pipeline;
};

const getSubmissionsPage = async (req, res) => {
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

  pipeline.push(...paginationStages);

  const [entities] = await db.collection(col).aggregate(pipeline).toArray();

  if (!entities) {
    return res.send({
      content: [],
      headers: [],
      pagination: { total: 0, skip: 0, limit: DEFAULT_LIMIT },
    });
  }

  try {
    const headers = await headerService.getHeaders(req.query.survey, entities.content, {
      excludeDataMeta: !queryParam(req.query.showCsvDataMeta),
    });
    entities.headers = headers;
  } catch (error) {
    console.error('error creating headers', error);
    entities.headers = [];
  }

  return res.send(entities);
};

const getSubmissions = async (req, res) => {
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

  const entities = await db.collection(col).aggregate(pipeline).toArray();

  return res.send(entities);
};

const getSubmissionsCsv = async (req, res) => {
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

  const entities = await db.collection(col).aggregate(pipeline).toArray();

  const headers = await headerService.getHeaders(req.query.survey, entities, {
    excludeDataMeta: !queryParam(req.query.showCsvDataMeta),
  });

  const csv = csvService.createCsv(entities, headers);
  res.set('Content-Type', 'text/plain');
  return res.send(csv);
};

const getSubmission = async (req, res) => {
  const { id } = req.params;
  const pipeline = [];

  let user = null;
  let roles = [];

  // Authenticated either Authorization header or Cookie
  if (res.locals.auth.isAuthenticated) {
    // Authorization header
    user = res.locals.auth.user._id.toString();
    roles.push(...res.locals.auth.roles);
  } else if (req.cookies.user && req.cookies.token) {
    // Cookie
    user = req.cookies.user;
    const userRoles = await rolesService.getRoles(user);
    roles.push(...userRoles);
  }

  // Add creator details if request has admin rights on survey.
  // However, don't add creator details if pure=1 is set (e.g. for re-submissions)
  if (user && !queryParam(req.query.pure)) {
    const groupId = res.locals.existing.meta.group.id;
    const hasAdminRights = await rolesService.hasAdminRole(user, groupId);

    if (hasAdminRights) {
      pipeline.push({
        $lookup: {
          from: 'users',
          let: { creatorId: '$meta.creator' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$creatorId'] } } },
            { $project: { name: 1, email: 1, _id: 0 } },
          ],
          as: 'meta.creatorDetail',
        },
      });
      pipeline.push({
        $unwind: { path: '$meta.creatorDetail', preserveNullAndEmptyArrays: true },
      });
    }
  }

  // Hide fields with meta.relevant = false (and below) by default
  // However, don't hide if query showIrrelevant=1 or pure=1
  if (!queryParam(req.query.showIrrelevant) && !queryParam(req.query.pure)) {
    const relevanceStage = createRelevanceStage();
    pipeline.push(relevanceStage);
  }

  pipeline.push({ $match: { _id: new ObjectId(id) } });
  const redactStage = createRedactStage(user, roles);
  pipeline.push(redactStage);

  const [entity] = await db.collection(col).aggregate(pipeline).toArray();
  if (!entity) {
    throw boom.notFound(`No entity found for id: ${id}`);
  }

  return res.send(entity);
};

const createSubmission = async (req, res) => {
  const entity = await sanitize(req.body);

  const survey = await db.collection('surveys').findOne({ _id: entity.meta.survey.id });
  if (!survey) {
    throw boom.notFound(`No survey found with id: ${entity.meta.survey.id}`);
  }

  // authenticated
  if (res.locals.auth.isAuthenticated) {
    entity.meta.creator = res.locals.auth.user._id;
  }

  // anonymous
  if (!res.locals.auth.isAuthenticated) {
    entity.meta.creator = null;
    // set submission group to survey's group for now
    if (survey.meta.group) {
      entity.meta.group = survey.meta.group;
    }
  }

  const farmosResults = [];
  try {
    const results = await farmOsService.handle(res, entity, survey, res.locals.auth.user);
    farmosResults.push(...results);
    // could contain errors, need to pass these on to the user
  } catch (error) {
    // TODO what should we do if something internal fails?
    // need to let the user somehow know
    console.log('error handling farmos', error);
    return res.status(503).send({
      message: `error submitting to farmos ${error}`,
      farmos: error.messages,
    });
  }

  try {
    // insert the submission
    let r = await db.collection(col).insertOne(entity);
    assert.equal(1, r.insertedCount);
    // copy submission to library survey
    let controls = survey.revisions[entity.meta.survey.version-1].controls;
    await copySubmissionToLibrarySurveys(controls, entity);
    // set formosResults to result
    r.farmos = farmosResults;
    return res.send(r);
  } catch (err) {
    throw boom.boomify(err);
  }
};

// if submission contains question set library questions, submit a subset copy to each question set library
const copySubmissionToLibrarySurveys = async (controls, submission) => {
  // for each component in survey.revisions[meta.survey.version]
  controls.forEach(function(control) {
    // for each library root control which is not deleted
    if (control.isLibraryRoot && !control.options.redacted) {
      // create a copy of submission
      let submissionCopy = JSON.parse(JSON.stringify(submission));
      // remember submission id in original
      submissionCopy.meta.original = new ObjectId(submissionCopy._id);
      // set new id
      submissionCopy._id = new ObjectId();
      // remember survey id in origin_id and set survey id to the qsl survey
      submissionCopy.meta.survey.origin = new ObjectId(submissionCopy.meta.survey.id);
      submissionCopy.meta.survey.id = new ObjectId(control.libraryId);
      submissionCopy.meta.survey.version = control.libraryVersion; // must be version of the library survey, not the consuming survey
      // remove all data with a name not in values array (except meta)
      let dataNamesOfThisLibrary = [];
      collectDataNamesOfGivenLibraryId(control, control.libraryId, dataNamesOfThisLibrary);
      //remove libraryRoot container including meta child
      submissionCopy.data = findVal(submissionCopy.data, control.name);
      delete submissionCopy.data['meta'];
      //remove all data not in dataNamesOfThisLibrary
      removePrivateData(submissionCopy.data, dataNamesOfThisLibrary);

      // do not store if no data is left
      if(Object.keys(submissionCopy.data).length==0) {
        return;
      }

      // TODO if qsl survey is not found, we are probably on an on-premise-system, so try to find the survey on the central surveystack system

      // store
      console.log('create submission copy '+submissionCopy._id);
      db.collection(col).insertOne(submissionCopy);
    } else if(control.children) {
      // recursively go through the children
      copySubmissionToLibrarySurveys(control.children, submission);
    }
  });
};

const collectDataNamesOfGivenLibraryId = (control, libraryId, collection) => {
  if(control.libraryId===libraryId && !control.isLibraryRoot) {
    collection.push(control.name);
  }
  if(control.children) {
    control.children.forEach(child => {
      collectDataNamesOfGivenLibraryId(child, libraryId, collection);
    })
  }
}

const removePrivateData = (submissionData, dataNamesToInclude) => {
  Object.keys(submissionData).forEach(key => {
    if(key!='meta' &&  key!='value') {
      if(dataNamesToInclude.indexOf(key)==-1) {
        delete submissionData[key];
      } else {
        removePrivateData(submissionData[key], dataNamesToInclude);
      }
    }
  });
};

const findVal = (obj, keyToFind) => {
  if(!obj) {
    return false;
  }
  if (obj[keyToFind]) return obj[keyToFind];

  for (let key in obj) {
    if (typeof obj[key] === 'object') {
      const value = findVal(obj[key], keyToFind);
      if (value) return value;
    }
  }
  return false;
}

const updateSubmission = async (req, res) => {
  const { id } = req.params;
  const entity = await sanitize(req.body);

  const existing = res.locals.existing;
  const updatedRevision = existing.meta.revision + 1;

  // re-insert existing submission with a new _id
  existing._id = new ObjectId();
  existing.meta.original = new ObjectId(id);
  existing.meta.archived = true;
  existing.meta.archivedReason = entity.meta.archivedReason || 'RESUBMIT';
  await db.collection(col).insertOne(existing);

  // update with upped revision and resubmitter
  entity.meta.revision = updatedRevision;
  entity.meta.resubmitter = new ObjectId(res.locals.auth.user._id);

  const survey = await db.collection('surveys').findOne({ _id: entity.meta.survey.id });
  if (!survey) {
    throw boom.notFound(`No survey found with id: ${entity.meta.survey.id}`);
  }

  const farmosResults = [];
  try {
    // re-run with original creator user
    const creator = await db.collection('users').findOne({ _id: entity.meta.creator });
    const results = await farmOsService.handle(res, entity, survey, creator);
    farmosResults.push(...results);
    // could contain errors, need to pass these on to the user
  } catch (error) {
    // TODO what should we do if something internal fails?
    // need to let the user somehow know
    console.log('error handling farmos', error);
    return res.status(503).send({
      message: `error submitting to farmos ${error}`,
      farmos: error.messages,
    });
  }

  const updated = await db.collection(col).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: entity },
    {
      returnOriginal: false,
    }
  );
  updated.value.farmos = farmosResults;

  await updateSubmissionToLibrarySurveys(survey, entity);

  return res.send(updated.value);
};

const updateSubmissionToLibrarySurveys = async (survey, submission) => {
  // find library submissions to be updated
  //const librarySubmissions =  await db.collection('submissions').find({'meta.original':submission._id }).toArray();
  const librarySubmissions =  await db.collection('submissions').find({'meta.survey.origin':survey._id }).toArray();

  // archive current library submissions
  await librarySubmissions.forEach(function(librarySubmission) {
    // re-insert existing submissions with a new _id
    //librarySubmission.meta.original = new ObjectId(librarySubmission._id);
    //librarySubmission._id = new ObjectId();
    librarySubmission.meta.archived = true;
    librarySubmission.meta.archivedReason = submission.meta.archivedReason || 'RESUBMIT';
    db.collection(col).replaceOne({"_id":librarySubmission._id}, librarySubmission);
  });
  // create new library submissions
  let controls = survey.revisions[submission.meta.survey.version-1].controls;
  await copySubmissionToLibrarySurveys(controls, submission);
}

const reassignSubmission = async (req, res) => {
  const { id } = req.params;
  const { body } = req;

  const existing = res.locals.existing;
  const updatedRevision = existing.meta.revision + 1;

  const survey = await db.collection('surveys').findOne({ _id: existing.meta.survey.id });
  if (!survey) {
    throw boom.notFound(`No survey found with id: ${existing.meta.survey.id}`);
  }

  // re-insert existing submission with a new _id
  existing._id = new ObjectId();
  existing.meta.original = new ObjectId(id);
  existing.meta.archived = true;
  existing.meta.archivedReason = 'REASSIGN';
  await db.collection(col).insertOne(existing);

  const farmosResults = [];
  try {
    // TODO: should we use the currently logged in user or the submission's user?
    // probably the submission's user (for instance if submission is re-assigned with a different user)
    const results = await farmOsService.handle(res, existing, survey, res.locals.auth.user);
    farmosResults.push(...results);
    // could contain errors, need to pass these on to the user
  } catch (error) {
    // TODO what should we do if something internal fails?
    // need to let the user somehow know
    console.log('error handling farmos', error);
    return res.status(503).send({
      message: `error submitting to farmos ${error}`,
      farmos: error.messages,
    });
  }

  const updateOperation = { 'meta.revision': updatedRevision };
  if (body.group) {
    const group = await db.collection('groups').findOne({ _id: new ObjectId(body.group) });
    if (group) {
      updateOperation['meta.group.id'] = group._id;
      updateOperation['meta.group.path'] = group.path;
    }
  }
  if (body.creator) {
    updateOperation['meta.creator'] = ObjectId(body.creator);
  }

  const updated = await db.collection(col).findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: updateOperation,
    },
    {
      returnOriginal: false,
    }
  );
  updated.value.farmos = farmosResults;
  return res.send(updated.value);
};

const archiveSubmission = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.query;
  let archived = true;

  if (req.query.set) {
    if (req.query.set === 'false' || req.query.set === '0') {
      archived = false;
    }
  }

  const update = { $set: { 'meta.archived': archived } };
  if (archived) {
    update['$set']['meta.archivedReason'] = reason;
  } else {
    update['$unset'] = { 'meta.archivedReason': '' };
  }

  const updated = await db.collection(col).findOneAndUpdate({ _id: new ObjectId(id) }, update, {
    returnOriginal: false,
  });

  // archive / unarchive library submissions as well
  const updatedLibrarySubmissions = await db.collection(col).findOneAndUpdate({ 'meta.original': new ObjectId(id) }, update, {
    returnOriginal: false,
  });

  return res.send(updated);
};

const deleteSubmission = async (req, res) => {
  const { id } = req.params;

  try {
    let r = await db.collection(col).deleteOne({ _id: new ObjectId(id) });
    assert.equal(1, r.deletedCount);
    // delete library submissions as well
    let rqsl = await db.collection(col).deleteOne({ 'meta.original': new ObjectId(id) });
    return res.send({ message: 'OK' });
  } catch (error) {
    throw boom.internal(`deleteSubmission: unknown error`);
  }
};

export default {
  getSubmissions,
  getSubmissionsPage,
  getSubmissionsCsv,
  getSubmission,
  createSubmission,
  updateSubmission,
  reassignSubmission,
  archiveSubmission,
  deleteSubmission,
};
