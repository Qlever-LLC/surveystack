import boom from '@hapi/boom';
import { Request, Response } from 'express';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import { db } from '../db';
import { sanitize, getSkip, getLimit } from './submissionController.js';
import handleApiCompose from './utils/handleApiCompose';
import { type ObjectId } from 'mongodb';
import { hasSubmissionRights } from '../handlers/assertions.js';

type SubmissionStatusType =
  | 'READY_TO_SUBMIT'
  | 'READY_TO_DELETE'
  | 'UNAUTHORIZED_TO_SUBMIT'
  | 'FAILED_TO_SUBMIT';
type SubmissionStatus = {
  type: SubmissionStatusType;
  value: {
    at: string;
  };
};

// TODO: replace this type with one generated from the open api spec or a mongo schema.
type Submission = {
  _id: ObjectId;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  data: any;
  meta: {
    dateCreated: Date;
    dateModified: Date;
    dateSubmitted?: Date;
    isDraft: boolean;
    isDeletedDraft: boolean;
    survey: {
      id: string;
      name: string;
      version: number;
    };
    revision: number;
    permissions: string[];
    status: SubmissionStatus[];
    group: {
      id: string;
      path: string;
    };
    archived?: boolean;
    archivedReason?: string;
    specVersion: number;
    creator?: ObjectId;
  };
};

const getReleventStatusDates = (statuses: SubmissionStatus[]): Date[] => {
  const relevantStatuses = ['READY_TO_SUBMIT', 'READY_TO_DELETE'];
  return statuses
    .filter((status) => relevantStatuses.includes(status.type))
    .map((status) => new Date(status.value.at));
};

const getLatestSubmissionTimestamp = (submission: Submission): Date => {
  const statusTimestamps = getReleventStatusDates(submission.meta.status);
  const dateModified = submission.meta.dateModified;
  const timestamps = [...statusTimestamps, dateModified].map((timestamp) => timestamp.valueOf());
  return new Date(Math.max(...timestamps));
};

const isRequestSubmissionLatest = (
  requestSubmission: Submission,
  databaseSubmission: Submission
): boolean =>
  getLatestSubmissionTimestamp(requestSubmission) >
  getLatestSubmissionTimestamp(databaseSubmission);

const syncDraft = async (req: Request, res: Response) => {
  let submission: Submission = await sanitize(req.body);

  const existingSubmission = await db.collection('submissions').findOne({ _id: submission._id });

  const creatorProperties = [existingSubmission?.meta?.creator, submission.meta.creator].filter(
    Boolean
  );
  const requestingUserOwnsSubmission = creatorProperties.every((creator) =>
    creator.equals(res.locals.auth.user._id)
  );
  if (!requestingUserOwnsSubmission) {
    throw boom.unauthorized();
  }

  if (existingSubmission && !existingSubmission.meta.isDraft) {
    return res.status(200).send();
  }

  if (existingSubmission && !isRequestSubmissionLatest(submission, existingSubmission)) {
    return res.status(200).send();
  }

  const readyToDeleteStatus = submission.meta.status.find(
    (status) => status.type === 'READY_TO_DELETE'
  );
  if (readyToDeleteStatus) {
    if (existingSubmission) {
      submission.meta.dateModified = new Date(readyToDeleteStatus.value.at);
      submission.meta.status = submission.meta.status.filter(
        (status) => status.type !== 'READY_TO_DELETE'
      );
      submission.meta.isDeletedDraft = true;
      await db.collection('submissions').replaceOne({ _id: submission._id }, submission);
    }
    return res.status(200).send();
  }

  if (submission.meta.status.some((status) => status.type === 'READY_TO_SUBMIT')) {
    let isAuthorizedToSubmit: boolean;
    try {
      isAuthorizedToSubmit = await hasSubmissionRights(submission, res);
    } catch (error) {
      isAuthorizedToSubmit = false;
    }
    if (!isAuthorizedToSubmit) {
      submission.meta.status = [
        ...submission.meta.status.filter((status) => status.type !== 'READY_TO_SUBMIT'),
        {
          type: 'UNAUTHORIZED_TO_SUBMIT',
          value: { at: new Date().toISOString() },
        },
      ];
      await db
        .collection('submissions')
        .replaceOne({ _id: submission._id }, submission, { upsert: true });
      return res.status(200).send();
    }

    let survey;
    try {
      survey = await db.collection('surveys').findOne({ _id: submission.meta.survey.id });
      ({
        entities: [{ entity: submission }],
      } = await handleApiCompose([{ entity: submission, survey }], res.locals.auth.user));
    } catch (error) {
      submission.meta.status = [
        ...submission.meta.status.filter((status) => status.type !== 'READY_TO_SUBMIT'),
        {
          type: 'FAILED_TO_SUBMIT',
          value: { at: new Date().toISOString() },
        },
      ];
      await db
        .collection('submissions')
        .replaceOne({ _id: submission._id }, submission, { upsert: true });
      return res.status(200).send();
    }

    // prepare draft to be submitted
    submission.meta.isDraft = false;
    submission.meta.status = submission.meta.status.filter(
      (status) => status.type !== 'READY_TO_SUBMIT'
    );
    // submit draft
    const result = await db
      .collection('submissions')
      .replaceOne({ _id: submission._id }, submission, { upsert: true });
    if (!result) {
      throw boom.internal();
    }

    return res.status(200).send();
  } else {
    await db
      .collection('submissions')
      .replaceOne({ _id: submission._id }, submission, { upsert: true });
    return res.status(200).send();
  }
};

const getDraftsPage = async (req: Request, res: Response) => {
  const skip = getSkip(req);
  const limit = getLimit(req);

  const paginationStages = [
    {
      $facet: {
        content: [{ $skip: skip }, { $limit: limit }],
        pagination: [{ $count: 'total' }, { $addFields: { skip, limit } }],
      },
    },
    { $unwind: '$pagination' },
  ];
  const pipeline = [
    {
      $match: {
        'meta.isDraft': true,
        'meta.isDeletedDraft': false,
        'meta.creator': res.locals.auth.user._id,
      },
    },
    { $sort: { 'meta.dateModified': -1 } },
    ...paginationStages,
  ];

  const [results] = await db.collection('submissions').aggregate(pipeline).toArray();

  return res.status(200).json(
    results ?? {
      content: [],
      pagination: {
        limit,
        skip: 0,
        total: 0,
      },
    }
  );
};

const paths: OpenAPIV3.PathsObject = {
  '/api/submissions/sync-draft': {
    post: {
      summary: 'Sync draft submissions to the server.',
      requestBody: {
        description: 'A draft submissions to sync.',
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/DraftSubmission',
            },
          },
        },
      },
      responses: {
        200: {
          description:
            'Successfully synced draft to the server. The client can safely delete its copy and fetch the latest state from the server in another request.',
        },
        401: {
          $ref: '#/components/responses/401',
        },
      },
    },
  },
  '/api/submissions/drafts/page': {
    get: {
      summary: 'Get drafts for the requesting user, paginated.',
      parameters: [
        {
          name: 'skip',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
          },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        200: {
          description: 'Drafts for the requesting user, with pagination metadata.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['content', 'pagination'],
                properties: {
                  content: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/DraftSubmission' },
                  },
                  pagination: {
                    $ref: '#/components/schemas/PaginationMetadata',
                  },
                },
              },
            },
          },
        },
        401: {
          $ref: '#/components/responses/401',
        },
      },
    },
  },
};

export { syncDraft, getDraftsPage, paths };
