import assert from 'assert';
import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';

import { db } from '../db';
import _ from 'lodash';

import { changeRecursive, changeRecursiveAsync, checkSurvey } from '../helpers/surveys';
import rolesService from '../services/roles.service';
import pdfService from '../services/pdf.service';

const SURVEYS_COLLECTION = 'surveys';
const GROUPS_COLLECTION = 'groups';
const SUBMISSIONS_COLLECTION = 'submissions';

const DEFAULT_LIMIT = 20;

const sanitize = async (entity, version = 1) => {
  entity._id = new ObjectId(entity._id);

  entity.revisions.forEach((version) => {
    version.dateCreated = new Date(version.dateCreated);

    version.controls.forEach((control) => {
      changeRecursive(control, (control) => {
        if (control.libraryId) {
          control.libraryId = new ObjectId(control.libraryId);
        }
      });
    });
  });

  entity.resources.forEach((resource) => {
    if (resource.libraryId) {
      resource.libraryId = new ObjectId(resource.libraryId);
    }
  });

  if (entity.meta) {
    entity.meta.dateCreated = new Date(entity.meta.dateCreated);
    entity.meta.dateModified = new Date(entity.meta.dateModified);

    if (entity.meta.creator) {
      entity.meta.creator = new ObjectId(entity.meta.creator);
    }

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
  }

  checkSurvey(entity, version);

  return entity;
};

const getSurveys = async (req, res) => {
  const filter = {};
  const project = {};

  const { q, projections } = req.query;

  if (q) {
    if (ObjectId.isValid(q)) {
      filter._id = new ObjectId(q);
    } else {
      filter.name = { $regex: q, $options: 'i' };
    }
  }

  if (projections) {
    projections.forEach((projection) => {
      project[projection] = 1;
    });
  }

  const entities = await db.collection(SURVEYS_COLLECTION).find(filter).project(project).toArray();
  return res.send(entities);
};

const buildPipelineForGetSurveyPage = ({
  q,
  groups,
  projections,
  creator,
  skip,
  limit,
  prefix,
  isLibrary,
}) => {
  const match = {};
  const project = {};
  let parsedSkip = 0;
  let parsedLimit = DEFAULT_LIMIT;

  if (q) {
    match.name = {
      $regex: q,
      $options: 'i',
    };
  }

  if (Array.isArray(groups) && groups.length > 0) {
    match['meta.group.id'] = {
      $in: groups.map((item) => new ObjectId(item)),
    };
  }

  if (creator) {
    match['meta.creator'] = new ObjectId(creator);
  }

  if (prefix) {
    match['meta.group.path'] = {
      $regex: `^${prefix}`,
    };
  }

  if (isLibrary) {
    match['meta.isLibrary'] = isLibrary === 'true';
  }

  const pipeline = [];

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  if (projections) {
    projections.forEach((projection) => {
      project[projection] = 1;
    });
    pipeline.push({
      $project: { ...project },
    });
  }

  // default sort by name (or date modified?)
  // needs aggregation for case insensitive sorting
  pipeline.push(
    { $addFields: { lowercasedName: { $toLower: '$name' } } },
    { $sort: { lowercasedName: 1 } },
    { $project: { lowercasedName: 0 } }
  );

  if (isLibrary === 'true') {
    // add to pipeline the aggregation for number of referencing survey and for number of submissions of referencing surveys
    // TODO further reduce meta.libraryUsageCountSurveys by revisions.controls.isLibraryRoot=true and revisions.version=latestVersion
    // TODO also count revisions.controls.children.libraryId
    const aggregateCounts = [
      {
        $match: {
          'meta.isLibrary': true,
        },
      },
      /*
      TODO Resolve #48, then uncommet this
       {
        $lookup: {
          from: 'surveys',
          localField: '_id',
          foreignField: 'revisions.controls.libraryId',
          as: 'meta.libraryUsageCountSurveys',
        },
      },
      {
        $addFields: {
          'meta.libraryUsageCountSurveys': {
            $size: '$meta.libraryUsageCountSurveys',
          },
        },
      },*/
      {
        $lookup: {
          from: SUBMISSIONS_COLLECTION,
          let: {
            surveyId: '$_id',
          },
          pipeline: [
            { $match: { $expr: { $eq: ['$meta.survey.id', '$$surveyId'] } } },
            { $count: 'count' },
          ],
          as: 'meta.libraryUsageCountSubmissions',
        },
      },
      {
        $addFields: {
          'meta.libraryUsageCountSubmissions': {
            $arrayElemAt: ['$meta.libraryUsageCountSubmissions.count', 0],
          },
        },
      },
      {
        $sort: {
          // TODO Resolve #48, then uncommet this and remove the other line
          // 'meta.libraryUsageCountSurveys': -1,
          'meta.libraryUsageCountSubmissions': -1,
        },
      },
    ];
    pipeline.push(...aggregateCounts);
  }

  // skip
  if (skip) {
    try {
      const n = Number.parseInt(skip);
      if (n > 0) {
        parsedSkip = n;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query paramter skip: ${skip}`);
    }
  }

  // limit
  if (limit) {
    try {
      const n = Number.parseInt(limit);
      if (n > 0) {
        parsedLimit = n;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query paramter limit: ${limit}`);
    }
  }

  // pagination stage
  const paginationStages = [
    {
      $facet: {
        content: [
          {
            $skip: parsedSkip,
          },
          {
            $limit: parsedLimit,
          },
        ],
        pagination: [
          {
            $count: 'total',
          },
          {
            $addFields: {
              parsedSkip,
              parsedLimit,
            },
          },
        ],
      },
    },
    {
      $unwind: '$pagination',
    },
  ];
  pipeline.push(...paginationStages);

  return pipeline;
};
const buildPipelineGetSurveyPinned = ({ q, groupId, creator, prefix }) => {
  const match = {};

  if (q) {
    match.name = {
      $regex: q,
      $options: 'i',
    };
  }

  if (creator) {
    match['meta.creator'] = new ObjectId(creator);
  }

  if (prefix) {
    match['meta.group.path'] = {
      $regex: `^${prefix}`,
    };
  }

  const pipeline = [
    { $match: { _id: ObjectId(groupId) } },
    { $unwind: '$surveys.pinned' },
    {
      $lookup: {
        from: 'surveys',
        localField: 'surveys.pinned',
        foreignField: '_id',
        as: 'pinnedSurveys',
      },
    },
    {
      $project: {
        _id: {
          $arrayElemAt: ['$pinnedSurveys._id', 0],
        },
      },
    },
    { $sort: { name: 1 } },
  ];

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  return pipeline;
};

const buildPipelineForGetSurveyPagePrioPinned = (
  { q, groupId, projections, creator, skip, limit, prefix, isLibrary },
  pinnedEntities
) => {
  const match = {};
  const project = {};
  let parsedSkip = 0;
  let parsedLimit = DEFAULT_LIMIT;

  if (q) {
    match.name = {
      $regex: q,
      $options: 'i',
    };
  }

  if (creator) {
    match['meta.creator'] = new ObjectId(creator);
  }

  if (prefix) {
    match['meta.group.path'] = {
      $regex: `^${prefix}`,
    };
  }

  if (isLibrary) {
    match['meta.isLibrary'] = isLibrary === 'true';
  }

  const pipeline = [
    { $match: { 'meta.group.id': ObjectId(groupId) } },
    {
      $addFields: {
        lowercasedName: {
          $toLower: '$name',
        },
      },
    },
    {
      $addFields: {
        isInPinnedList: {
          $in: ['$_id', pinnedEntities],
        },
      },
    },
    {
      $addFields: {
        sortOrder: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$isInPinnedList', true] },
                then: 0,
              },
            ],
            default: 1,
          },
        },
      },
    },
    {
      $sort: { sortOrder: 1, lowercasedName: 1 },
    },
  ];

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  if (projections) {
    projections.forEach((projection) => {
      project[projection] = 1;
    });
    pipeline.push({
      $project: { ...project, isInPinnedList: 1 },
    });
  }

  if (isLibrary === 'true') {
    // add to pipeline the aggregation for number of referencing survey and for number of submissions of referencing surveys
    // TODO further reduce meta.libraryUsageCountSurveys by revisions.controls.isLibraryRoot=true and revisions.version=latestVersion
    // TODO also count revisions.controls.children.libraryId
    const aggregateCounts = [
      {
        $match: {
          'meta.isLibrary': true,
        },
      },
      /*
      TODO Resolve #48, then uncommet this
       {
        $lookup: {
          from: 'surveys',
          localField: '_id',
          foreignField: 'revisions.controls.libraryId',
          as: 'meta.libraryUsageCountSurveys',
        },
      },
      {
        $addFields: {
          'meta.libraryUsageCountSurveys': {
            $size: '$meta.libraryUsageCountSurveys',
          },
        },
      },*/
      {
        $lookup: {
          from: SUBMISSIONS_COLLECTION,
          let: {
            surveyId: '$_id',
          },
          pipeline: [
            { $match: { $expr: { $eq: ['$meta.survey.id', '$$surveyId'] } } },
            { $count: 'count' },
          ],
          as: 'meta.libraryUsageCountSubmissions',
        },
      },
      {
        $addFields: {
          'meta.libraryUsageCountSubmissions': {
            $arrayElemAt: ['$meta.libraryUsageCountSubmissions.count', 0],
          },
        },
      },
      {
        $sort: {
          // TODO Resolve #48, then uncommet this and remove the other line
          // 'meta.libraryUsageCountSurveys': -1,
          'meta.libraryUsageCountSubmissions': -1,
        },
      },
    ];
    pipeline.push(...aggregateCounts);
  }

  // skip
  if (skip) {
    try {
      const n = Number.parseInt(skip);
      if (n > 0) {
        parsedSkip = n;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query paramter skip: ${skip}`);
    }
  }

  // limit
  if (limit) {
    try {
      const n = Number.parseInt(limit);
      if (n > 0) {
        parsedLimit = n;
      }
    } catch (error) {
      throw boom.badRequest(`Bad query paramter limit: ${limit}`);
    }
  }

  // pagination stage
  const paginationStages = [
    {
      $facet: {
        content: [
          {
            $skip: parsedSkip,
          },
          {
            $limit: parsedLimit,
          },
        ],
        pagination: [
          {
            $count: 'total',
          },
          {
            $addFields: {
              parsedSkip,
              parsedLimit,
            },
          },
        ],
      },
    },
    {
      $unwind: '$pagination',
    },
  ];
  pipeline.push(...paginationStages);

  return pipeline;
};

const getSurveyPage = async (req, res) => {
  const pipeline = buildPipelineForGetSurveyPage(req.query);

  const [entities] = await db.collection(SURVEYS_COLLECTION).aggregate(pipeline).toArray();

  // empty array when ther is no match
  // however, we still want content and pagination properties
  if (!entities) {
    return res.send({
      content: [],
      pagination: {
        total: 0,
        skip: req.query.skip || 0,
        limit: req.query.limit || DEFAULT_LIMIT,
      },
    });
  }

  return res.send(entities[0]);
};

const getSurveyListPage = async (req, res) => {
  const query = {
    ...req.query,
    projections: [
      ...(req.query.projections || []),
      '_id',
      'name',
      'latestVersion',
      'meta.dateModified',
      'meta.dateCreated',
      'meta.group',
      'meta.creator',
      'meta.submissions',
      'meta.isLibrary',
    ],
  };

  const pipeline = buildPipelineForGetSurveyPage(query);
  const [entities] = await db.collection(SURVEYS_COLLECTION).aggregate(pipeline).toArray();

  // empty array when there is no match
  // however, we still want content and pagination properties
  if (!entities) {
    return res.send({
      content: [],
      pagination: {
        total: 0,
        skip: req.query.skip || 0,
        limit: req.query.limit || DEFAULT_LIMIT,
      },
    });
  }

  return res.send(entities);
};

const getSurveyListPagePrioPinned = async (req, res) => {
  const query = {
    ...req.query,
    projections: [
      ...(req.query.projections || []),
      '_id',
      'name',
      'latestVersion',
      'meta.dateModified',
      'meta.dateCreated',
      'meta.group',
      'meta.creator',
      'meta.submissions',
      'meta.isLibrary',
    ],
  };

  const pipelinePinned = buildPipelineGetSurveyPinned(query);
  const pipelinePinnedEntities = await db
    .collection(GROUPS_COLLECTION)
    .aggregate(pipelinePinned)
    .toArray();

  const pinnedEntities = pipelinePinnedEntities.map((obj) => obj._id);

  const pipeline = buildPipelineForGetSurveyPagePrioPinned(query, pinnedEntities);
  const [entities] = await db.collection(SURVEYS_COLLECTION).aggregate(pipeline).toArray();

  if (!entities) {
    return res.send({
      content: [],
      pagination: {
        total: 0,
        skip: req.query.skip || 0,
        limit: req.query.limit || DEFAULT_LIMIT,
      },
    });
  }

  const pinned = [];

  for (let i = entities.content.length - 1; i >= 0; i--) {
    const entity = entities.content[i];
    if (entity.isInPinnedList) {
      delete entity.isInPinnedList;
      pinned.push(entity);
      entities.content.splice(entities.content.indexOf(entity), 1);
    }
  }

  entities.pinned = pinned;

  return res.send(entities);
};

const getSurvey = async (req, res) => {
  const { id } = req.params;
  const { version } = req.query;

  const pipeline = [{ $match: { _id: new ObjectId(id) } }];

  if (version === undefined || version === 'latest') {
    // caller only requests the LATEST PUBLISHED survey revision with version=latestVersion, exclude all others and also exclude drafts
    pipeline.push({
      $project: {
        name: 1,
        latestVersion: 1,
        meta: 1,
        description: 1,
        resources: 1,
        revisions: {
          $filter: {
            input: '$revisions',
            as: 'revision',
            cond: { $eq: ['$$revision.version', '$latestVersion'] },
          },
        },
      },
    });
  } else if (version === 'latestPublishedOrDraft') {
    // caller only requests the latest survey revision which may be published or draft, exclude all other revisions
    pipeline.push({
      $project: {
        name: 1,
        latestVersion: 1,
        meta: 1,
        description: 1,
        resources: 1,
        revisions: {
          $slice: ['$revisions', -1],
        },
      },
    });
  } else if (version === 'all') {
    // caller explicitly wants to get all version, thus projection is not required
  } else {
    // caller only requests the survey revision with the passed version, exclude all others
    pipeline.push({
      $project: {
        name: 1,
        latestVersion: 1,
        meta: 1,
        description: 1,
        resources: 1,
        revisions: {
          $filter: {
            input: '$revisions',
            as: 'revision',
            cond: { $eq: ['$$revision.version', Number(version)] },
          },
        },
      },
    });
  }

  const entities = await db.collection(SURVEYS_COLLECTION).aggregate(pipeline).toArray();

  if (entities.length === 0) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`,
    });
  }

  const entity = entities[0];

  return res.send(entity);
};

const getSurveyInfo = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    throw boom.badRequest(`query param not set: id`);
  }

  const entity = await db.collection('surveys').findOne(
    { _id: new ObjectId(id) },
    {
      projection: {
        name: 1,
        latestVersion: 1,
        'meta.dateModified': 1,
        'meta.dateCreated': 1,
        description: 1,
      },
    }
  );

  const submissions = await db
    .collection(SUBMISSIONS_COLLECTION)
    .find({ 'meta.survey.id': new ObjectId(id), 'meta.archived': { $ne: true } })
    .count();

  const latestSubmissions = await db
    .collection(SUBMISSIONS_COLLECTION)
    .aggregate([
      { $match: { 'meta.survey.id': new ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'meta.creator',
          foreignField: '_id',
          as: 'meta.creator',
        },
      },
      { $unwind: '$meta.creator' },
      { $project: { 'meta.dateModified': 1, 'meta.creator._id': 1, 'meta.creator.name': 1 } },
      { $sort: { 'meta.dateModified': -1 } },
      { $limit: 1 },
    ])
    .toArray();

  entity.latestSubmission = null;
  if (latestSubmissions[0]) {
    const s = latestSubmissions[0];
    entity.latestSubmission = { dateModified: s.meta.dateModified, creator: s.meta.creator };
  }
  entity.submissions = submissions;

  return res.send(entity);
};

const getSurveyLibraryConsumersInternal = async (id) => {
  const pipeline = [
    {
      $project: {
        name: 1,
        revisions: {
          $filter: {
            input: '$revisions',
            as: 'revision',
            cond: { $eq: ['$$revision.version', '$latestVersion'] },
          },
        },
      },
    },
    {
      $match: {
        revisions: {
          $elemMatch: {
            // TODO try to find elegant query which is not limited to 4 child levels but still performing well
            $or: [
              { 'controls.libraryId': new ObjectId(id) },
              { 'controls.children.libraryId': new ObjectId(id) },
              { 'controls.children.children.libraryId': new ObjectId(id) },
              { 'controls.children.children.children.libraryId': new ObjectId(id) },
              { 'controls.children.children.children.children.libraryId': new ObjectId(id) },
            ],
          },
        },
      },
    },
  ];
  return await db
    .collection(SURVEYS_COLLECTION)
    .aggregate(pipeline, { allowDiskUse: true })
    .toArray();
};

const getSurveyLibraryConsumers = async (req, res) => {
  const { id } = req.query;
  return res.send(await getSurveyLibraryConsumersInternal(id));
};

const getSurveyPdf = async (req, res) => {
  const { id } = req.params;
  const entity = await db.collection(SURVEYS_COLLECTION).findOne({ _id: new ObjectId(id) });

  if (!entity) {
    return res.status(404).send({ message: `No entity with _id exists: ${id}` });
  }

  try {
    const fileName = pdfService.getPdfName(entity);
    const data = await pdfService.getPdfBase64(entity, null);
    res.attachment(fileName);
    res.send('data:application/pdf;base64,' + data);
  } catch (e) {
    throw boom.internal(e);
  }
};

const createSurvey = async (req, res) => {
  const entity = await sanitize(req.body, req.body.latestVersion);
  // apply creator (endpoint already has assertAuthenticated, so auth.user._id must exist)
  entity.meta.creator = res.locals.auth.user._id;

  try {
    const insertResult = await db.collection(SURVEYS_COLLECTION).insertOne(entity);
    assert.equal(insertResult?.acknowledged, true);
    return res.send({ _id: insertResult.insertedId, ...entity });
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(409).send({ message: `Entity with _id already exists: ${entity._id}` });
    }
  }

  return res.status(500).send({ message: 'Internal error' });
};

const isUserAllowedToModifySurvey = async (survey, res) => {
  const user = res.locals.auth.user._id;
  if (!survey.meta.group && !survey.meta.creator) {
    return true; // no user and no group => free for all!
  }
  if (survey.meta.creator.equals(user)) {
    return true; // user may delete their own surveys
  }
  const hasAdminRoleForRequest = await rolesService.hasAdminRoleForRequest(
    res,
    survey.meta.group.id
  );
  if (hasAdminRoleForRequest) {
    return true; // group admins may delete surveys
  }

  return false;
};

const updateSurvey = async (req, res) => {
  const { id } = req.params;
  const entity = await sanitize(
    req.body,
    req.body.revisions[req.body.revisions.length - 1].version
  );

  const existing = await db.collection(SURVEYS_COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!existing) {
    throw boom.notFound(`No entity with _id exists: ${id}`);
  }

  const isAllowed = await isUserAllowedToModifySurvey(existing, res);
  if (!isAllowed) {
    throw boom.unauthorized(`You are not authorized to update survey: ${id}`);
  }

  // restore old revisions which may be missing in the passed survey
  const changedRevision = entity.revisions[entity.revisions.length - 1];
  const historicRevisions = existing.revisions.filter((r) => r.version < changedRevision.version);
  entity.revisions = [...historicRevisions, changedRevision];

  try {
    let updated = await db.collection(SURVEYS_COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: entity },
      {
        returnDocument: 'after',
      }
    );
    return res.send(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

const deleteSurvey = async (req, res) => {
  const { id } = req.params;

  const existing = await db.collection(SURVEYS_COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!existing) {
    throw boom.notFound(`No entity with _id exists: ${id}`);
  }

  const isAllowed = await isUserAllowedToModifySurvey(existing, res);
  if (!isAllowed) {
    throw boom.unauthorized(`You are not authorized to delete survey: ${id}`);
  }

  try {
    const deleteResult = await db
      .collection(SURVEYS_COLLECTION)
      .deleteOne({ _id: new ObjectId(id) });
    assert.equal(1, deleteResult.deletedCount);
    return res.send({ message: 'OK' });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

const checkForLibraryUpdates = async (req, res) => {
  const { id } = req.params;
  let updatableSurveys = {};
  let survey = await db.collection(SURVEYS_COLLECTION).findOne({ _id: new ObjectId(id) });

  if (!survey) {
    return res.send(updatableSurveys);
  }

  // get latest revision of survey controls, even if draft
  const latestRevision = survey.revisions[survey.revisions.length - 1];

  //for each question set library used in the given survey, collect id and version if updates available
  let promises = [];
  latestRevision.controls.map((rootControl) => {
    changeRecursiveAsync(promises, rootControl, async (control) => {
      if (control.isLibraryRoot && !control.libraryIsInherited) {
        //check if used library survey version is old
        const librarySurvey = await db
          .collection(SURVEYS_COLLECTION)
          .findOne({ _id: new ObjectId(control.libraryId) });
        if (!librarySurvey) {
          //library can not be found, also return this information
          updatableSurveys[control.libraryId] = null;
        } else if (control.libraryVersion < librarySurvey.latestVersion) {
          //library is updatable, add to result set
          updatableSurveys[control.libraryId] = librarySurvey.latestVersion;
        }
      }
    });
  });
  await Promise.all(promises);

  return res.send(updatableSurveys);
};

const getPinned = async (req, res) => {
  const pinned = [];

  if (!res.locals.auth || !res.locals.auth.user || !res.locals.auth.user._id) {
    // user not signed in, send empty array
    return res.send({
      status: 'success',
      pinned,
    });
  }

  const userId = res.locals.auth.user._id;

  // Pipeline
  // 1. find all memberships
  // 2. for all memberships find all groups
  // 3. for all groups find all pinned surveys

  const memberships = await db
    .collection('memberships')
    .find({ user: new ObjectId(userId) })
    .project({ group: 1 })
    .toArray();

  const groupIds = _.uniq(memberships.map((m) => m.group)).map((g) => new ObjectId(g));
  const groupsPinned = await db
    .collection('groups')
    .find({ _id: { $in: groupIds } })
    .project({ name: 1, 'surveys.pinned': 1 })
    .toArray();

  const r = groupsPinned.map((g) => {
    if (!g.surveys || !g.surveys.pinned) {
      return [];
    }

    return { group_id: g._id, group_name: g.name, pinned: g.surveys.pinned };
  });

  pinned.push(...r);

  // console.log('pinned', pinned);

  return res.send({
    status: 'success',
    pinned,
  });
};

const getSurveyAndCleanupInfo = async (id, res) => {
  const survey = await db.collection(SURVEYS_COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!survey) {
    throw boom.notFound(`No entity with _id exists: ${id}`);
  }

  const isAllowed = await isUserAllowedToModifySurvey(survey, res);
  if (!isAllowed) {
    throw boom.unauthorized(`You are not authorized to update survey: ${id}`);
  }

  const pipeline = [
    { $match: { 'meta.survey.id': new ObjectId(id) } },
    { $match: { 'meta.archived': { $ne: true } } },
    { $project: { 'meta.survey.version': 1 } },
  ];
  const submissions = await db
    .collection(SUBMISSIONS_COLLECTION)
    .aggregate(pipeline, { allowDiskUse: true })
    .toArray();

  const submissionsVersionCounts = _.countBy(
    submissions.map((submission) => submission.meta.survey.version)
  );

  let libraryConsumersByVersion = {};
  if (survey.meta.isLibrary) {
    const libraryConsumers = await getSurveyLibraryConsumersInternal(survey._id);
    libraryConsumers.forEach((s) => {
      s.revisions[0].controls.forEach((c) => {
        changeRecursive(c, (c) => {
          if (c.isLibraryRoot) {
            //increase count by version
            libraryConsumersByVersion[c.libraryVersion] = libraryConsumersByVersion[
              c.libraryVersion
            ]
              ? libraryConsumersByVersion[c.libraryVersion] + 1
              : 1;
          }
        });
      });
    });
  }

  const versionsToKeep = Array.from(
    new Set([
      ...Object.keys(submissionsVersionCounts),
      ...Object.keys(libraryConsumersByVersion),
      String(survey.latestVersion),
    ])
  );
  const surveyVersions = survey.revisions.map(({ version }) => String(version));
  const versionsToDelete = _.difference(surveyVersions, versionsToKeep, [
    String(survey.revisions[survey.revisions.length - 1].version), //also do not propose to delete draft version, while still allowing to delete them by will
  ]);
  return {
    survey,
    surveyVersions,
    versionsToKeep,
    versionsToDelete,
    submissionsVersionCounts,
    libraryConsumersByVersion,
  };
};

const getCleanupSurveyInfo = async (req, res) => {
  const { id } = req.params;
  const {
    versionsToKeep,
    versionsToDelete,
    surveyVersions,
    submissionsVersionCounts,
    libraryConsumersByVersion,
  } = await getSurveyAndCleanupInfo(id, res);
  res.send({
    versionsToKeep,
    versionsToDelete,
    surveyVersions,
    surveySubmissionsVersionCounts: submissionsVersionCounts,
    libraryConsumersByVersion,
  });
};

const cleanupSurvey = async (req, res) => {
  const { id } = req.params;
  const { versions: requestedVersionsToDelete, auto, dryRun } = req.query;
  const { survey, versionsToKeep, versionsToDelete } = await getSurveyAndCleanupInfo(id, res);

  // Don't allow deletion of survey versions that have associated submissions
  if (requestedVersionsToDelete.some((v) => versionsToKeep.includes(v))) {
    return res.status(404).send({ message: 'Invalid version cleanup requested' });
  }

  const versionsToFilter = auto ? versionsToDelete : requestedVersionsToDelete;
  const shouldKeepVersion = ({ version }) => !versionsToFilter.includes(String(version));
  const filteredSurveyRevisions = survey.revisions.filter(shouldKeepVersion);

  if (versionsToFilter.length > 0) {
    try {
      let updated = {};
      if (!dryRun) {
        updated = await db.collection(SURVEYS_COLLECTION).findOneAndUpdate(
          { _id: new ObjectId(id) },
          {
            $set: {
              revisions: filteredSurveyRevisions,
            },
          },
          { returnDocument: 'after' }
        );
        await deleteArchivedTestSubmissions(
          id,
          versionsToFilter.map((v) => Number(v)) //versionsToFilter had been converted to String before, convert it back...
        );
      }
      return res.send({ updated, deletedVersions: versionsToFilter, keptVersions: versionsToKeep });
    } catch (err) {
      console.log(err);
      return res.status(500).send({ message: 'Could not clean up survey' });
    }
  }

  res.send({ deletedVersions: versionsToFilter, keptVersions: versionsToKeep });
};

/**
 Delete all useless submissions
 Useless is defined as submissions archived with reasons of 'SUBMISSION_FROM_BUILDER' or 'TEST_DATA'
 @param surveyId: string object id of the survey to delete subissions for
 @param surveyVersions array of survey version numbers to delete submssions for
 @return count of deleted submissions
 **/
const deleteArchivedTestSubmissions = async (surveyId, surveyVersions) => {
  const filter = {
    'meta.survey.id': new ObjectId(surveyId),
    'meta.survey.version': { $in: surveyVersions },
    'meta.archived': true,
    'meta.archivedReason': { $in: ['SUBMISSION_FROM_BUILDER', 'TEST_DATA'] },
  };
  const result = await db.collection(SUBMISSIONS_COLLECTION).deleteMany(filter);
  return result.deletedCount;
};

export default {
  getSurveys,
  getSurveyPage,
  getPinned,
  getSurveyListPage,
  getSurveyListPagePrioPinned,
  getSurvey,
  getSurveyLibraryConsumers,
  getSurveyInfo,
  getSurveyPdf,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  checkForLibraryUpdates,
  cleanupSurvey,
  getCleanupSurveyInfo,
  getSurveyAndCleanupInfo,
  deleteArchivedTestSubmissions,
};
