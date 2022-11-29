import submissionController, { buildPipeline } from './submissionController';
import {
  createReq,
  createRes,
  createSurvey,
  getControlGenerator,
  getSubmissionDataGenerator,
} from '../testUtils';
const { ObjectId } = jest.requireActual('mongodb');

const { getSubmissionsCsv, prepareSubmissionsToQSLs } = submissionController;

async function mockControlsAndSubmission() {
  const { survey, createSubmission } = await createSurvey(['text', 'number']);
  const { submission: _submission } = await createSubmission();

  const controls = survey.revisions[survey.latestVersion - 1].controls;
  const libraryId = new ObjectId();
  const libraryVersion = 3;
  const groupOverride = {
    children: [
      getControlGenerator('text')({ libraryId, libraryVersion, libraryIsInherited: true }),
    ],
    isLibraryRoot: true,
    libraryId,
    libraryVersion,
  };
  controls.push(
    getControlGenerator('page')({
      children: [getControlGenerator('group')(groupOverride)],
    }),
    getControlGenerator('group')(
      {
        ...groupOverride,
        options: { ...getControlGenerator('text')().options, redacted: true },
      },
      2
    ),
    getControlGenerator('group')(groupOverride, 3)
  );

  const submission = {
    ..._submission,
    data: {
      ..._submission.data,
      ...getSubmissionDataGenerator('page')(
        getSubmissionDataGenerator('group')(getSubmissionDataGenerator('text')())
      ),
      ...getSubmissionDataGenerator('group')(getSubmissionDataGenerator('text')(), 2),
      ...getSubmissionDataGenerator('group')(getSubmissionDataGenerator('text')(), 3),
    },
  };

  submission.data.group_3.text_1.meta.permissions = ['admin'];

  return { controls, submission };
}

describe('submissionController', () => {
  describe('getSubmissionsCsv', () => {
    it('returns expected CSV for geojson question type', async () => {
      const { survey, createSubmission } = await createSurvey('geoJSON');
      const { submission } = await createSubmission();
      const mockReq = createReq({ query: { showCsvMeta: 'true', survey: survey._id } });
      const mockRes = await createRes();
      await getSubmissionsCsv(mockReq, mockRes);
      const expected =
        '_id,meta.dateCreated,meta.dateModified,meta.dateSubmitted,meta.survey.id,meta.survey.version,meta.revision,meta.permissions,meta.status.0.type,meta.status.0.value.at,meta.group.id,meta.group.path,meta.specVersion,meta.creator,meta.permanentResults,data.map_1.features.0,data.map_1.type\r\n' +
        `${submission._id},` +
        `${submission.meta.dateCreated.toISOString()},` +
        `${submission.meta.dateModified.toISOString()},` +
        `${submission.meta.dateSubmitted.toISOString()},` +
        `${submission.meta.survey.id},` +
        `2,1,,READY_TO_SUBMIT,` +
        `${submission.meta.status[0].value.at.toISOString()},` +
        `${submission.meta.group.id},` +
        `${submission.meta.group.path},4,` +
        `${submission.meta.creator},` +
        `,"{""type"":""Feature"",""geometry"":{""type"":""Polygon"",""coordinates"":[[[-79.39869321685993,43.65614580273717],[-79.39799841596073,43.6460912513611],[-79.37263818314015,43.645085703645464],[-79.3698589795434,43.657653840263464],[-79.39869321685993,43.65614580273717]]]},""properties"":null,""id"":""measureFeature0""}",FeatureCollection`;
      expect(mockRes.send).toHaveBeenCalledWith(expected);
    });
  });

  describe('prepareSubmissionsToQSLs', () => {
    it('returns no submission for empty params', async () => {
      const controls = [];
      const submission = {};
      const QSLSubmissions = await prepareSubmissionsToQSLs(controls, submission);
      expect(QSLSubmissions.length).toBe(0);
    });

    it('returns one submission for each used question set library in controls', async () => {
      const { controls, submission } = await mockControlsAndSubmission();
      const QSLSubmissions = await prepareSubmissionsToQSLs(controls, submission);
      expect(QSLSubmissions.length).toBe(2);
    });

    it('keeps private data marked with permissions=admin for all child submissions', async () => {
      const { controls, submission } = await mockControlsAndSubmission();
      const QSLSubmissions = await prepareSubmissionsToQSLs(controls, submission);
      expect(QSLSubmissions[1].data.text_1.meta.permissions).toStrictEqual(['admin']);
    });
  });
});

describe('buildPipeline', () => {
  // TODO add tests for the rest of the operations ( $match, $redact, $project)

  it('adds default $sort operation to pipeline', async () => {
    const pipeline = await buildPipeline(createReq({ query: {} }), await createRes());
    expect(pipeline).toContainEqual({ $sort: { _id: -1 } });
  });

  it('adds $sort operation from query parameter', async () => {
    const pipeline = await buildPipeline(
      createReq({ query: { sort: JSON.stringify({ 'meta.dateCreated': -1 }) } }),
      await createRes()
    );
    expect(pipeline).toContainEqual({ $sort: { 'meta.dateCreated': -1 } });
  });
  it('skips sort operation when `?unsorted=true`', async () => {
    const pipeline = await buildPipeline(
      createReq({ query: { unsorted: 'true' } }),
      await createRes()
    );
    expect(pipeline).not.toContainEqual(expect.objectContaining({ $sort: expect.anything() }));
  });
  it('skips sort operation when `query.sort` is set but `query.unsorted="true"`', async () => {
    const pipeline = await buildPipeline(
      createReq({ query: { unsorted: 'true', sort: JSON.stringify({ _id: 1 }) } }),
      await createRes()
    );
    expect(pipeline).not.toContainEqual(expect.objectContaining({ $sort: expect.anything() }));
  });
});
