import request from 'supertest';
import submissionController, { buildPipeline } from './submissionController';
import {
  createReq,
  createRes,
  createSurvey,
  createUser,
  createGroup,
  getControlGenerator,
  getSubmissionDataGenerator,
  createSubmissionMeta,
} from '../testUtils';
import mailService from '../services/mail/mail.service';
import createApp from '../app.js';
const { ObjectId } = jest.requireActual('mongodb');

jest.mock('../services/mail/mail.service');

const {
  getSubmissionsCsv,
  prepareSubmissionsToQSLs,
  getSubmissionPdf,
  postSubmissionPdf,
  sendPdfLink,
} = submissionController;

describe('submissionController', () => {
  describe('syncDrafts', () => {
    const app = createApp();
    const token = '1234';

    let authHeaderValue;
    let group;
    let user;

    beforeEach(async () => {
      group = await createGroup();
      ({ user } = await group.createUserMember({
        userOverrides: { token },
      }));
      authHeaderValue = `${user.email} ${token}`;
    });

    it('returns 401 if the request is not authenticated', async () => {
      const { createSubmissionDoc } = await createSurvey(['string']);
      const draftSubmission = createSubmissionDoc({
        _id: ObjectId().toString(),
        meta: createSubmissionMeta({ isDraft: true }),
      });

      return request(app).post('/api/submissions/sync-drafts').send([draftSubmission]).expect(401);
    });

    it('returns 400 if any of the submissions in the request are not drafts', async () => {
      const { createSubmissionDoc } = await createSurvey(['string']);
      const draftSubmission = createSubmissionDoc({
        _id: ObjectId().toString(),
        meta: createSubmissionMeta({ isDraft: true, creator: user._id }),
      });
      const nonDraftSubmission = createSubmissionDoc({
        _id: ObjectId().toString(),
        meta: createSubmissionMeta({ isDraft: false, creator: user._id }),
      });

      return request(app)
        .post('/api/submissions/sync-drafts')
        .set('Authorization', authHeaderValue)
        .send([draftSubmission, nonDraftSubmission])
        .expect(400);
    });

    it('returns 401 if the requesting user is not the owner of all the submissions in the request', async () => {
      const { createSubmissionDoc } = await createSurvey(['string']);
      const submissionOwnedByRequestingUser = createSubmissionDoc({
        _id: ObjectId().toString(),
        meta: createSubmissionMeta({
          isDraft: true,
          creator: user._id,
        }),
      });
      const submissionNotOwnedByRequestingUser = createSubmissionDoc({
        _id: ObjectId().toString(),
        meta: createSubmissionMeta({ isDraft: true }),
      });

      return request(app)
        .post('/api/submissions/sync-drafts')
        .set('Authorization', authHeaderValue)
        .send([submissionOwnedByRequestingUser, submissionNotOwnedByRequestingUser])
        .expect(401);
    });

    // TODO: is there any authorization to do around whether a user is allowed to submit to a survey?

    describe('when the draft being synced is not in the database yet', () => {
      it.todo('returns 200 and puts the draft in the database');
    });

    describe('when a version of the draft being synced is already in the database', () => {
      it.todo('');
    });
  });

  describe('getSubmissionsCsv', () => {
    it('returns expected CSV for geojson question type', async () => {
      const { survey, createSubmission } = await createSurvey(['geoJSON']);
      const { submission } = await createSubmission();
      const mockReq = createReq({ query: { showCsvMeta: 'true', survey: survey._id } });
      const mockRes = await createRes();
      await getSubmissionsCsv(mockReq, mockRes);
      const expected =
        '_id,meta.isDraft,meta.dateCreated,meta.dateModified,meta.dateSubmitted,meta.survey.id,meta.survey.name,meta.survey.version,meta.revision,meta.permissions,meta.status.0.type,meta.status.0.value.at,meta.group.id,meta.group.path,meta.specVersion,meta.creator,meta.permanentResults,data.map_1.features.0,data.map_1.type\r\n' +
        `${submission._id},` +
        `false,` +
        `${new Date(submission.meta.dateCreated).toISOString()},` +
        `${new Date(submission.meta.dateModified).toISOString()},` +
        `${new Date(submission.meta.dateSubmitted).toISOString()},` +
        `${submission.meta.survey.id},Mock Survey Name,` +
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
    async function mockControlsAndSubmission() {
      const { survey, createSubmission } = await createSurvey(['string', 'number']);
      const { submission: _submission } = await createSubmission();

      const controls = survey.revisions[survey.latestVersion - 1].controls;
      const libraryId = new ObjectId();
      const libraryVersion = 3;
      const groupOverride = {
        children: [
          getControlGenerator('string')({ libraryId, libraryVersion, libraryIsInherited: true }),
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
            options: { ...getControlGenerator('string')().options, redacted: true },
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
            getSubmissionDataGenerator('group')(getSubmissionDataGenerator('string')())
          ),
          ...getSubmissionDataGenerator('group')(getSubmissionDataGenerator('string')(), 2),
          ...getSubmissionDataGenerator('group')(getSubmissionDataGenerator('string')(), 3),
        },
      };

      submission.data.group_3.text_1.meta.permissions = ['admin'];

      return { controls, submission };
    }

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

  describe('getSubmissionPdf', () => {
    let submission;

    beforeEach(async () => {
      const { createSubmission } = await createSurvey(['instructions', 'string', 'ontology']);
      const { submission: _submission } = await createSubmission();
      submission = _submission;
    });

    it('should return PDF base64 when `base64=1` if success', async () => {
      await createUser({ _id: submission.meta.creator });
      const req = createReq({ params: { id: submission._id }, query: { base64: '1' } });
      const res = await createRes({
        user: { _id: submission.meta.creator, permissions: [] },
      });
      await getSubmissionPdf(req, res);

      expect(res.attachment).toHaveBeenCalledWith(expect.stringContaining('Mock Survey Name'));
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining('data:application/pdf;base64,')
      );
    });

    it('should return PDF buffer when `base64=0` if success', async () => {
      await createUser({ _id: submission.meta.creator });
      const req = createReq({ params: { id: submission._id } });
      const res = await createRes({
        user: { _id: submission.meta.creator, permissions: [] },
      });
      await getSubmissionPdf(req, res);

      expect(res.attachment).toHaveBeenCalledWith(expect.stringContaining('Mock Survey Name'));
      expect(res.send).toHaveBeenCalledWith(expect.anything());
    });

    it('should throw error if not found submission', async () => {
      const req = createReq({ params: { id: 'non-exist-id' }, query: { base64: '1' } });
      const res = await createRes({
        user: { _id: 'mock-user-id', permissions: [] },
      });

      await expect(getSubmissionPdf(req, res)).rejects.toThrow(/non-exist-id/);
    });

    it('should throw error if PDF generate failed', async () => {
      const req = createReq({ params: { id: submission._id }, query: { base64: '1' } });
      const res = await createRes({
        user: { _id: submission.meta.creator, permissions: [] },
      });

      await expect(getSubmissionPdf(req, res)).rejects.toThrow();
    });
  });

  describe('postSubmissionPdf', () => {
    it('should return PDF base64 when `base64=1` if success', async () => {
      const { survey, createSubmission } = await createSurvey([
        'instructions',
        'string',
        'ontology',
      ]);
      const { submission } = await createSubmission();
      await createUser({ _id: submission.meta.creator });
      const req = createReq({ body: { survey, submission }, query: { base64: '1' } });
      const res = await createRes({
        user: { _id: submission.meta.creator, permissions: [] },
      });
      await postSubmissionPdf(req, res);

      expect(res.attachment).toHaveBeenCalledWith(expect.stringContaining('Mock Survey Name'));
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining('data:application/pdf;base64,')
      );
    });

    it('should throw error if PDF generate failed', async () => {
      const { survey, createSubmission } = await createSurvey([
        'instructions',
        'string',
        'ontology',
      ]);
      const { submission } = await createSubmission();
      const req = createReq({ body: { survey, submission }, query: { base64: '1' } });
      const res = await createRes({
        user: { _id: submission.meta.creator, permissions: [] },
      });

      await expect(postSubmissionPdf(req, res)).rejects.toThrow();
    });
  });

  describe('sendPdfLink', () => {
    let survey, submission;

    beforeEach(async () => {
      const { survey: _survey, createSubmission } = await createSurvey(['string']);
      const { submission: _submission } = await createSubmission();
      survey = _survey;
      submission = _submission;
    });

    it('should send email correctly if success', async () => {
      const req = createReq({ params: { id: submission._id } });
      const res = await createRes({
        user: { _id: submission.meta.creator, email: 'user-email', permissions: [] },
      });
      await sendPdfLink(req, res);

      expect(mailService.sendLink).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@surveystack.io',
          to: 'user-email',
          subject: 'Survey report - Mock Survey Name',
          link: expect.stringContaining(`/api/submissions/${submission._id}/pdf`),
        })
      );
    });

    // TODO: - Uncomment if we do subscribe option later
    // it("should send email to both of survey creator and submission submitter if they're different", async () => {
    //   await createUser({ _id: survey.meta.creator, email: 'survey-creator-email' });
    //   const req = createReq({ params: { id: submission._id } });
    //   const res = await createRes({
    //     user: {
    //       _id: submission.meta.creator,
    //       email: 'submission-submitter-email',
    //       permissions: [],
    //     },
    //   });
    //   await sendPdfLink(req, res);

    //   expect(mailService.sendLink).toHaveBeenCalledTimes(2);
    // });

    it('should send email only once if survey creator and submission submitter are same', async () => {
      const req = createReq({ params: { id: submission._id } });
      const res = await createRes({
        user: { _id: survey.meta.creator, email: 'survey-creator-email', permissions: [] },
      });
      await sendPdfLink(req, res);

      expect(mailService.sendLink).toHaveBeenCalledTimes(1);
    });

    it('should throw error if not found submission', async () => {
      const req = createReq({ params: { id: 'non-exist-id' }, query: { base64: '1' } });
      const res = await createRes({
        user: { _id: 'mock-user-id', permissions: [] },
      });

      await expect(sendPdfLink(req, res)).rejects.toThrow(/non-exist-id/);
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
