import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';
import { db, mongoClient } from '../db';
import { withSession, withTransaction } from '../db/helpers';
import { queryParam } from '../helpers';
import assert from 'assert';
import rolesService from '../services/roles.service';

const col = 'drafts';
const DEFAULT_LIMIT = 100000;

const sanitize = (entity) => {
  if (entity._id) {
    entity._id = new ObjectId(entity._id);
  }

  entity.meta.dateCreated = new Date(entity.meta.dateCreated);
  entity.meta.dateModified = new Date(entity.meta.dateModified);
  entity.meta.survey.id = new ObjectId(entity.meta.survey.id);

  if (entity.meta.submitAsUser && entity.meta.submitAsUser._id) {
    entity.meta.submitAsUser._id = new ObjectId(entity.meta.submitAsUser._id);
  }

  if (entity.meta.group) {
    entity.meta.group.id = new ObjectId(entity.meta.group.id);
  }

  if (entity.meta.creator) {
    entity.meta.creator = new ObjectId(entity.meta.creator);
  }

  if (entity.meta.proxyUserId) {
    entity.meta.proxyUserId = new ObjectId(entity.meta.proxyUserId);
  }

  // Remove temporal properties for client usage
  delete entity.options;

  return entity;
};

const isDraft = (req) => queryParam(req.query.draft);
const isSubmitted = (req) =>
  queryParam(req.query.creator) ||
  queryParam(req.query.proxyUserId) ||
  queryParam(req.query.resubmitter);

const isUserAllowedToModifyDraft = async (draft, user) => {
  if (draft.meta.creator === user) {
    return true; // user may delete their own draft
  }

  if (draft.meta.proxyUserId === user) {
    return true; // proxy user may delete their draft
  }

  const hasAdminRole = await rolesService.hasAdminRole(user, draft.meta.group.id);
  if (hasAdminRole) {
    return true; // group admins may delete surveys
  }

  return false;
};

const paginationStages = (req) => {
  const skip = req.query.skip ? Number(req.query.skip) : 0;
  if (isNaN(skip)) {
    throw boom.badRequest(`Bad query parameter skip: ${skip}`);
  }

  const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_LIMIT;
  if (isNaN(limit) || limit === 0) {
    throw boom.badRequest(`Bad query parameter limit: ${limit}`);
  }

  return [
    // Sort
    {
      $sort: { 'meta.dateModified': -1 },
    },
    // Pagination
    {
      $facet: {
        content: [{ $skip: skip }, { $limit: limit }],
        pagination: [{ $count: 'total' }, { $addFields: { skip, limit } }],
      },
    },
    { $unwind: '$pagination' },
  ];
};

const draftStages = (req, res, match) => {
  const user = res.locals.auth.user._id;

  return [
    {
      $match: {
        $or: [{ 'meta.resubmitter': user }, { 'meta.proxyUserId': user }, { 'meta.creator': user }],
        ...match,
      },
    },
  ];
};

const submittedStages = (req, res, match) => {
  const user = res.locals.auth.user._id;

  return [
    {
      $match: {
        $or: [
          ...(queryParam(req.query.resubmitter) ? [{ 'meta.resubmitter': user }] : []),
          ...(queryParam(req.query.proxyUserId) ? [{ 'meta.proxyUserId': user }] : []),
          ...(queryParam(req.query.creator) ? [{ 'meta.creator': user }] : []),
        ],
        ...match,
      },
    },
  ];
};

const surveyStages = (req, res) => {
  const user = res.locals.auth.user._id;

  return [
    // Join `drafts`
    ...(isDraft(req)
      ? [
          {
            $lookup: {
              from: 'drafts',
              let: { surveyId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ['$meta.survey.id', '$$surveyId'],
                        },
                        {
                          $or: [
                            { $eq: ['$meta.resubmitter', user] },
                            { $eq: ['$meta.proxyUserId', user] },
                            { $eq: ['$meta.creator', user] },
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
              as: 'draft',
            },
          },
        ]
      : []),
    // Join `submissions`
    ...(isSubmitted(req)
      ? [
          {
            $lookup: {
              from: 'submissions',
              let: { surveyId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ['$meta.survey.id', '$$surveyId'],
                        },
                        {
                          $or: [
                            ...(queryParam(req.query.resubmitter)
                              ? [{ $eq: ['$meta.resubmitter', user] }]
                              : []),
                            ...(queryParam(req.query.proxyUserId)
                              ? [{ $eq: ['$meta.proxyUserId', user] }]
                              : []),
                            ...(queryParam(req.query.creator)
                              ? [{ $eq: ['$meta.creator', user] }]
                              : []),
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
              as: 'submitted',
            },
          },
        ]
      : []),
    {
      $match: {
        $or: [
          ...(isDraft(req) ? [{ draft: { $exists: true, $ne: [] } }] : []),
          ...(isSubmitted(req) ? [{ submitted: { $exists: true, $ne: [] } }] : []),
          ...(req.query.localSurveyIds
            ? [{ _id: { $in: req.query.localSurveyIds.map((id) => new ObjectId(id)) } }]
            : []),
        ],
      },
    },
    {
      $project: { _id: 1, name: 1 },
    },
  ];
};

const createDrafts = async (req, res) => {
  const drafts = Array.isArray(req.body) ? req.body : [req.body];

  let draftsEntities = await Promise.all(drafts.map(sanitize));

  const entities = await withSession(mongoClient, async (session) => {
    try {
      return await withTransaction(session, async () => {
        const result = await db.collection(col).insertMany(draftsEntities);

        if (draftsEntities.length !== result.insertedCount) {
          await session.abortTransaction();
          return;
        }

        return result;
      });
    } catch (error) {
      throw boom.boomify(error);
    }
  });

  if (!entities) {
    throw boom.internal('The transaction was intentionally aborted.');
  }

  res.send(entities);
};

/**
 * Fetch my submissions from the combined parameters
 * - What is 'my submissions'? - creator, proxyUserId, resubmitter are my user ID
 *
 * This function designed to support infinite pagination for the my submissions page.
 * Since we have 3 data sources (local IDB, remote draft collection, remote submissions collection),
 * it is difficult to implement a pagination normally but infinite is possible by using the modified date as a skip point.
 *
 * @param {
 *   lastDateModified:  string,          // Filter submissions that has older date modified than the last element
 *   limit:             number,          // How many items per request?
 *   draft:             boolean,         // Fetch draft submissions
 *   creator:           boolean,         // Fetch the submissions that is submitted by me
 *   proxyUserId:       boolean,         // Fetch the submissions that is submitted by me as a proxy
 *   resubmitter:       boolean,         // Fetch the submissions that is resubmitted by me
 *   surveyIds:         array,           // Filter by survey(s)
 * } req
 * @param {*} res
 * @returns
 * {
 *   submissions:  array,          // Submissions
 *   total:        number,         // Total count
 * }
 */
const getDrafts = async (req, res) => {
  let draft = [];
  let submitted = [];
  let total = 0;

  let match = {};

  // Filter by last modified date
  if (req.query.lastDateModified) {
    match = {
      ...match,
      'meta.dateModified': { $lt: new Date(req.query.lastDateModified) },
    };
  }

  // Filter by survey
  if (Array.isArray(req.query.surveyIds) && req.query.surveyIds.length > 0) {
    match = {
      ...match,
      'meta.survey.id': { $in: req.query.surveyIds.map((id) => new ObjectId(id)) },
    };
  }

  // Fetch remote draft
  if (isDraft(req)) {
    const pipeline = [...draftStages(req, res, match), ...paginationStages(req)];

    const [entities] = await db
      .collection(col)
      .aggregate(pipeline, { allowDiskUse: true })
      .toArray();

    if (entities) {
      draft = entities.content.map((item) => ({
        ...item,
        options: {
          draft: true,
          local: false,
        },
      }));
      total += entities.pagination.total;
    }
  }

  // Fetch remote submitted
  if (isSubmitted(req)) {
    let pipeline = [...submittedStages(req, res, match), ...paginationStages(req, res)];

    const [entities] = await db
      .collection('submissions')
      .aggregate(pipeline, { allowDiskUse: true })
      .toArray();

    if (entities) {
      submitted = entities.content.map((item) => ({
        ...item,
        options: {
          draft: false,
          local: false,
        },
      }));
      total += entities.pagination.total;
    }
  }

  return res.send({
    total,
    submissions: [...draft, ...submitted],
  });
};

/**
 * Fetch the surveys of my submissions
 * - What is 'my submissions'? - creator, proxyUserId, resubmitter are my user ID
 * - Why fetch surveys? - We have survey filters and it is changed based on the parameters
 *
 * @param {
 *   draft:             boolean,         // Fetch draft submissions
 *   creator:           boolean,         // Fetch the submissions that is submitted by me
 *   proxyUserId:       boolean,         // Fetch the submissions that is submitted by me as a proxy
 *   resubmitter:       boolean,         // Fetch the submissions that is resubmitted by me
 *   localSurveyIds:    array,           // Survey ID(s) of the local drafts
 * } req
 * @param {*} res
 * @returns             array,          // Surveys { ID, name }
 */
const getSurveys = async (req, res) => {
  let surveys = [];

  // At least one parameter should be set
  if (!isDraft(req) && !isSubmitted(req) && !req.query.localSurveyIds) {
    return res.send(surveys);
  }

  const pipeline = surveyStages(req, res);
  surveys = await db.collection('surveys').aggregate(pipeline).toArray();

  return res.send(surveys);
};

const deleteDraft = async (req, res) => {
  const { id } = req.params;

  const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
  if (!existing) {
    throw boom.notFound(`No entity with _id exists: ${id}`);
  }

  const isAllowed = await isUserAllowedToModifyDraft(existing, res.locals.auth.user._id);
  if (!isAllowed) {
    throw boom.unauthorized(`You are not authorized to delete draft: ${id}`);
  }

  try {
    const result = await db.collection(col).deleteOne({ _id: new ObjectId(id) });
    assert.equal(1, result.deletedCount);
  } catch (e) {
    throw boom.internal('Unknown internal error', e);
  }

  return res.send({ message: 'OK' });
};

export default { createDrafts, getDrafts, getSurveys, deleteDraft };
