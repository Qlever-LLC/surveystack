import boom from '@hapi/boom';
import { Request, Response } from 'express';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import { db } from '../db';
import { sanitize } from './submissionController.js';
import { type ObjectId } from 'mongodb';

type SubmissionStatus = {
  type: string;
  value: {
    at: string;
  };
};

// TODO: replace this type with one generated from the open api spec
type Submission = {
  _id: ObjectId;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  data: any;
  meta: {
    dateCreated: Date;
    dateModified: Date;
    dateSubmitted?: Date;
    isDraft: boolean;
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
  const submission: Submission = await sanitize(req.body);

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

  if (!existingSubmission) {
    await db.collection('submissions').insertOne(submission);
    return res.status(200).send();
  }

  if (!existingSubmission.meta.isDraft) {
    return res.status(200).send();
  }

  if (!isRequestSubmissionLatest(submission, existingSubmission)) {
    return res.status(200).send();
  }

  if (submission.meta.status.some((status) => status.type === 'READY_TO_SUBMIT')) {
    submission.meta.isDraft = false;
    submission.meta.status = submission.meta.status.filter(
      (status) => status.type !== 'READY_TO_SUBMIT'
    );
  }

  await db.collection('submissions').replaceOne({ _id: submission._id }, submission);

  return res.status(200).send();
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
          description: 'Successfully synced draft to the server.',
        },
        401: {
          $ref: '#/components/responses/401',
        },
      },
    },
  },
};

export { syncDraft, paths };
