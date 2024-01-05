import getSubmissionDataGenerator from './dataGenerators';
const { ObjectId } = jest.requireActual('mongodb');
const { getDb } = jest.requireActual('../../db');

const createSubmissionMeta =
  ({ isDraft = false, creator = new ObjectId() } = {}) =>
  (survey) => {
    const now = new Date();
    return {
      isDraft,
      dateCreated: now,
      dateModified: now,
      dateSubmitted: now,
      survey: {
        id: survey._id,
        name: survey.name,
        version: 2,
      },
      revision: 1,
      permissions: [],
      status: [
        {
          type: 'READY_TO_SUBMIT',
          value: { at: now },
        },
      ],
      group: survey.meta.group,
      specVersion: 4,
      creator,
      permanentResults: [],
    };
  };

const createSubmissionData = (survey) => {
  let data = {};

  const controls = survey.revisions
    .find((revision) => revision.version === survey.latestVersion)
    .controls.map((control) => control.type);

  controls.forEach((ctrl, index) => {
    const dataGenerator = getSubmissionDataGenerator(ctrl);
    if (typeof dataGenerator === 'function') {
      data = { ...data, ...dataGenerator({}, index + 1) };
    }
  });

  return data;
};

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

    submission.meta.dateCreated = submission.meta.dateCreated.toISOString();
    submission.meta.dateModified = submission.meta.dateModified.toISOString();
    submission.meta.dateSubmitted = submission.meta.dateSubmitted.toISOString();

    return {
      submission,
    };
  };

export {
  createSubmissionMeta,
  createSubmissionData,
  createSubmissionDocFor,
  createSubmissionWith,
  getSubmissionDataGenerator,
};
