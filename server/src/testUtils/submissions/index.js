import request from 'supertest';
import getSubmissionDataGenerator from './dataGenerators';
const { ObjectId } = jest.requireActual('mongodb');
const { getDb } = jest.requireActual('../../db');
import { testApp } from '../testApp';

const createSubmissionMeta =
  (
    {
      isDraft = false,
      isDeletedDraft = false,
      creator = new ObjectId(),
      dateModified = new Date(),
      specVersion = 4,
      archived = false,
      archivedReason = undefined,
      status = [],
      group,
    } = {},
    { omitIsDraft = false, omitIsDeletedDraft = false } = {}
  ) =>
  (survey) => {
    return {
      ...(omitIsDraft ? {} : { isDraft }),
      ...(omitIsDeletedDraft ? {} : { isDeletedDraft }),
      dateCreated: new Date(),
      dateModified,
      dateSubmitted: new Date(),
      survey: {
        id: survey._id,
        name: survey.name,
        version: 2,
      },
      revision: 1,
      archived,
      ...(archivedReason === undefined ? {} : { archivedReason }),
      permissions: [],
      status,
      group: group ?? survey.meta.group,
      specVersion,
      creator,
      permanentResults: [],
    };
  };

const createRequestSubmissionMeta =
  (
    {
      isDraft = false,
      isDeletedDraft = false,
      creator = new ObjectId().toString(),
      dateModified = new Date().toISOString(),
      dateSubmitted = null,
      specVersion = 4,
      archived = false,
      archivedReason = undefined,
      status = [],
      group,
    } = {},
    { omitIsDraft = false, omitIsDeletedDraft = false } = {}
  ) =>
  (survey) => {
    return {
      ...(omitIsDraft ? {} : { isDraft }),
      ...(omitIsDeletedDraft ? {} : { isDeletedDraft }),
      dateCreated: new Date().toISOString(),
      dateModified,
      dateSubmitted,
      survey: {
        id: survey._id.toString(),
        name: survey.name,
        version: 2,
      },
      revision: 1,
      archived,
      ...(archivedReason === undefined ? {} : { archivedReason }),
      permissions: [],
      status,
      group: group ?? {
        id: survey.meta.group.id.toString(),
        path: survey.meta.group.path,
      },
      specVersion,
      creator,
      permanentResults: [],
    };
  };

const createSubmissionData = (survey, inRequestFormat = false) => {
  let data = {};

  const controls = survey.revisions
    .find((revision) => revision.version === survey.latestVersion)
    .controls.map((control) => control.type);

  controls.forEach((ctrl, index) => {
    const dataGenerator = getSubmissionDataGenerator(ctrl);
    if (typeof dataGenerator === 'function') {
      data = { ...data, ...dataGenerator({}, index + 1, inRequestFormat) };
    }
  });

  return data;
};

const createRequestSubmissionFor =
  (survey) =>
  ({
    _id,
    data = createSubmissionData(survey, true),
    meta = createRequestSubmissionMeta(),
  } = {}) => ({
    ...(_id ? { _id } : {}),
    meta: meta(survey),
    data,
  });

const createSubmissionDocFor =
  (survey) =>
  ({ _id, data = createSubmissionData(survey), meta = createSubmissionMeta() } = {}) => ({
    ...(_id ? { _id } : {}),
    meta: meta(survey),
    data,
  });

const createSubmissionWith =
  (createSubmissionDoc) =>
  async (overrides = {}) => {
    const submissionDoc = createSubmissionDoc(overrides);
    const insertResult = await getDb().collection('submissions').insertOne(submissionDoc);
    const submission = { _id: insertResult.insertedId, ...submissionDoc };

    return {
      submission,
    };
  };

const createPostSubmission =
  (createRequestSubmission) =>
  ({ creator = null, authHeaderValue, group, submissionId } = {}) => {
    const requestSubmission = createRequestSubmission({
      _id: submissionId ?? ObjectId().toString(),
      meta: createRequestSubmissionMeta({
        isDraft: true,
        creator,
        status: [
          {
            type: 'READY_TO_SUBMIT',
            value: { at: new Date('2021-01-01').toISOString() },
          },
        ],
        group,
      }),
    });

    return request(testApp)
      .post('/api/submissions')
      .set({
        ...(authHeaderValue ? { Authorization: authHeaderValue } : {}),
      })
      .send(requestSubmission)
      .then((response) => {
        if (response.status === 503) {
          throw new Error(
            'You must mock handleApiCompose to use this function. See submissionController.spec.js for an example.'
          );
        }
        expect(response.status).toBe(200);
        return response;
      });
  };

export {
  createRequestSubmissionMeta,
  createSubmissionMeta,
  createSubmissionData,
  createRequestSubmissionFor,
  createSubmissionDocFor,
  createSubmissionWith,
  getSubmissionDataGenerator,
  createPostSubmission,
};
