import surveyController from './surveyController';
import {
  createReq,
  createRes,
  createSurvey,
  getControlGenerator,
  getSubmissionDataGenerator,
  createGroup,
  createSuperAdmin,
} from '../testUtils';
import _ from 'lodash';
import { db, getDb } from '../db';

const { ObjectId } = jest.requireActual('mongodb');
const {
  updateSurvey,
  getSurvey,
  cleanupSurvey,
  getSurveyAndCleanupInfo,
  deleteArchivedTestSubmissions,
  getSurveyPdf,
} = surveyController;

/**
 * creates a mock survey with 3 versions, controls and a submission
 * @param surveyOverrides pass survey props to overwrite
 * @param consumeLibraryId optional question set library id to consume
 * @param consumeLibraryVersion optional version of the question set library to be consumed
 * @param addDraftVersion optional adds a draft revision to the created survey
 * @returns Object containing survey (the survey created), submission (the submission object generated), createSubmission: a fn to create further submissions for this survey
 */
async function mockControlsAndSubmission(
  surveyOverrides,
  consumeLibraryId,
  consumeLibraryVersion,
  addDraftVersion = false
) {
  const { survey, createSubmission } = await createSurvey(['text', 'number'], surveyOverrides);
  const { submission: _submission } = await createSubmission();

  const controls = survey.revisions[survey.latestVersion - 1].controls;
  const libraryId = new ObjectId();
  const libraryVersion = 3;
  let groupOverride;
  if (consumeLibraryId) {
    groupOverride = {
      children: [
        getControlGenerator('text')({ libraryId, libraryVersion, libraryIsInherited: true }),
      ],
      isLibraryRoot: true,
      libraryId: consumeLibraryId,
      libraryVersion: consumeLibraryVersion,
    };
  } else {
    groupOverride = {
      children: [
        getControlGenerator('text')({ libraryId, libraryVersion, libraryIsInherited: true }),
      ],
    };
  }
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

  //add third version
  const newRevision = _.cloneDeep(survey.revisions[survey.latestVersion - 1]);
  newRevision.version = 3;
  survey.revisions.push(newRevision);
  survey.latestVersion = 3;

  if (addDraftVersion) {
    const draftRevision = _.cloneDeep(survey.revisions[survey.latestVersion - 1]);
    draftRevision.version = 4;
    survey.revisions.push(draftRevision);
  }

  await getDb().collection('surveys').findOneAndUpdate(
    { _id: survey._id },
    { $set: survey },
    {
      returnOriginal: false,
    }
  );

  return { survey, submission, createSubmission };
}

describe('surveyController access role for getSurveyAndCleanupInfo()', () => {
  it("random user doesn't have access", async () => {
    const group = await createGroup();
    const user = await group.createUserMember();
    const admin = await group.createAdminMember();
    const res = await createRes({ user: user.user });

    const libraryResult = await mockControlsAndSubmission({
      meta: { isLibrary: true, creator: admin.user._id, group: { id: group._id } },
    });
    const librarySurvey = libraryResult.survey;
    await expect(getSurveyAndCleanupInfo(librarySurvey._id, res)).rejects.toThrow(
      `You are not authorized to update survey: ${librarySurvey._id}`
    );
  });
  it('user who is the creator has access', async () => {
    const group = await createGroup();
    const user = await group.createUserMember();
    const res = await createRes({ user: user.user });

    const libraryResult = await mockControlsAndSubmission({
      meta: { isLibrary: true, creator: user.user._id, group: { id: group._id } },
    });
    const librarySurvey = libraryResult.survey;
    const result = await getSurveyAndCleanupInfo(librarySurvey._id, res);
    expect(result.survey._id).toStrictEqual(librarySurvey._id);
  });
  it('group admin who does not belong to the group does not have access', async () => {
    const group1 = await createGroup();
    const admin1 = await group1.createAdminMember();
    const group2 = await createGroup();
    const admin2 = await group2.createAdminMember();
    const res = await createRes({ user: admin2.user });

    const libraryResult = await mockControlsAndSubmission({
      meta: { isLibrary: true, creator: admin1.user._id, group: { id: group1._id } },
    });
    const librarySurvey = libraryResult.survey;
    await expect(getSurveyAndCleanupInfo(librarySurvey._id, res)).rejects.toThrow(
      `You are not authorized to update survey: ${librarySurvey._id}`
    );
  });
  it('group admin group has access without being the creator', async () => {
    const group = await createGroup();
    const admin1 = await group.createAdminMember();
    const admin2 = await group.createAdminMember();
    const res = await createRes({ user: admin2.user });

    const libraryResult = await mockControlsAndSubmission({
      meta: { isLibrary: true, creator: admin1.user._id, group: { id: group._id } },
    });
    const librarySurvey = libraryResult.survey;
    const result = await getSurveyAndCleanupInfo(librarySurvey._id, res);
    expect(result.survey._id).toStrictEqual(librarySurvey._id);
  });
  it('super admin has access without being the creator', async () => {
    const group = await createGroup();
    const admin = await group.createAdminMember();
    const superAdmin = await createSuperAdmin();
    const res = await createRes({ user: superAdmin });

    const libraryResult = await mockControlsAndSubmission({
      meta: { isLibrary: true, creator: admin.user._id, group: { id: group._id } },
    });
    const librarySurvey = libraryResult.survey;
    const result = await getSurveyAndCleanupInfo(librarySurvey._id, res);
    expect(result.survey._id).toStrictEqual(librarySurvey._id);
  });
});

describe('surveyController', () => {
  let librarySurvey,
    librarySurveySubmission,
    consumerSurvey,
    consumerSubmission,
    createSubmission,
    admin,
    res;

  beforeEach(async () => {
    const group = await createGroup();
    admin = await group.createAdminMember();
    res = await createRes({ user: admin.user });

    const libraryResult = await mockControlsAndSubmission({
      meta: { isLibrary: true, creator: admin.user._id, group: { id: group._id } },
    });
    createSubmission = libraryResult.createSubmission;
    librarySurvey = libraryResult.survey;
    librarySurveySubmission = libraryResult.submission;
    const consumerResult = await mockControlsAndSubmission(
      undefined,
      librarySurvey._id,
      librarySurvey.lastedVersion
    );
    consumerSurvey = consumerResult.survey;
    consumerSubmission = consumerResult.submission;
  });

  describe('getSurvey', () => {
    let surveyStored;
    beforeEach(async () => {
      surveyStored = (await mockControlsAndSubmission(undefined, undefined, undefined, true))
        .survey;
    });

    async function loadSurvey(version) {
      const query = version ? { version } : undefined;
      const req = createReq({
        params: { id: surveyStored._id },
        query: query,
      });
      const res = await createRes({
        user: { _id: surveyStored.meta.creator, permissions: [] },
      });
      await getSurvey(req, res);
      return res.send.mock.calls[0][0];
    }

    it('returns the revision with version=survey.latestVersion if version param is not passed', async () => {
      const returnedSurvey = await loadSurvey(undefined);
      expect(returnedSurvey.revisions[returnedSurvey.revisions.length - 1].version).toBe(
        surveyStored.latestVersion
      );
    });

    it('returns the revision with version=survey.latestVersion if version=latest is passed', async () => {
      const returnedSurvey = await loadSurvey('latest');
      expect(returnedSurvey.revisions[returnedSurvey.revisions.length - 1].version).toBe(
        surveyStored.latestVersion
      );
    });

    it('returns the latest published revision and a draft version (if existing) if version=latestPublishedAndDraft is passed', async () => {
      const returnedSurvey = await loadSurvey('latestPublishedAndDraft');
      expect(returnedSurvey.revisions.length).toBe(2);
      expect(returnedSurvey.revisions[returnedSurvey.revisions.length - 2].version).toBe(3);
      expect(returnedSurvey.revisions[returnedSurvey.revisions.length - 1].version).toBe(4);
    });

    it('returns all revisions if version=all is passed', async () => {
      const returnedSurvey = await loadSurvey('all');
      expect(returnedSurvey.revisions.length).toBe(4);
      expect(returnedSurvey.revisions[returnedSurvey.revisions.length - 1].version).toBe(4);
    });

    it('returns the revision requested by param version=[version number]', async () => {
      let returnedSurvey = await loadSurvey(1);
      expect(returnedSurvey.revisions.length).toBe(1);
      expect(returnedSurvey.revisions[0].version).toBe(1);
      returnedSurvey = await loadSurvey('2');
      expect(returnedSurvey.revisions.length).toBe(1);
      expect(returnedSurvey.revisions[0].version).toBe(2);
      returnedSurvey = await loadSurvey('3');
      expect(returnedSurvey.revisions.length).toBe(1);
      expect(returnedSurvey.revisions[0].version).toBe(3);
      returnedSurvey = await loadSurvey('4');
      expect(returnedSurvey.revisions.length).toBe(1);
      expect(returnedSurvey.revisions[0].version).toBe(4);
    });
  });

  describe('update', () => {
    let surveyStored, surveyToBeUpdated;
    beforeEach(async () => {
      //create survey
      surveyStored = (await mockControlsAndSubmission()).survey;
      //prepare updated survey
      surveyToBeUpdated = _.cloneDeep(surveyStored);
      const newRevision = _.cloneDeep(
        surveyToBeUpdated.revisions[surveyToBeUpdated.latestVersion - 1]
      );
      newRevision.version = 4;
      surveyToBeUpdated.revisions.push(newRevision);
      surveyToBeUpdated.latestVersion = 4;
    });

    describe('updateSurvey', () => {
      it('updates survey name, latestVersion and meta info', async () => {
        surveyToBeUpdated.name = 'updated survey name';
        surveyToBeUpdated.latestVersion = 4;

        const req = createReq({
          params: { id: surveyToBeUpdated._id },
          body: surveyToBeUpdated,
        });
        const res = await createRes({
          user: { _id: surveyToBeUpdated.meta.creator, permissions: [] },
        });
        await updateSurvey(req, res);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            value: expect.objectContaining({
              name: 'updated survey name',
              latestVersion: 4,
            }),
          })
        );
      });
      it('updates survey resources', async () => {
        const resource = {
          id: new ObjectId(),
          label: 'Mock Resource Name',
          name: 'survey_reference_1',
          type: 'SURVEY_REFERENCE',
          location: 'REMOTE',
          content: {
            id: new ObjectId(),
            version: 1,
            path: 'data.node_1.property_2',
          },
        };
        surveyToBeUpdated.resources = [resource];
        const req = createReq({
          params: { id: surveyToBeUpdated._id },
          body: surveyToBeUpdated,
        });
        const res = await createRes({
          user: { _id: surveyToBeUpdated.meta.creator, permissions: [] },
        });
        await updateSurvey(req, res);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            value: expect.objectContaining({
              resources: [resource],
            }),
          })
        );
      });
      it('adds latest revision in revisions array and keeps the rest of the revision history', async () => {
        //fetch a reduced survey like builder does it
        const req1 = createReq({
          params: { id: surveyStored._id },
          query: { version: 'latestPublishedAndDraft' },
        });
        const res1 = await createRes({
          user: { _id: surveyStored.meta.creator, permissions: [] },
        });
        await getSurvey(req1, res1);
        const reducedSurvey = res1.send.mock.calls[0][0];
        //add a draft version
        reducedSurvey.revisions.push({
          version: surveyStored.latestVersion + 1,
          controls: [],
        });
        //update the survey
        const req = createReq({
          params: { id: reducedSurvey._id },
          body: reducedSurvey,
        });
        const res = await createRes({
          user: { _id: reducedSurvey.meta.creator, permissions: [] },
        });
        await updateSurvey(req, res);
        const updatedSurvey = res1.send.mock.calls[0][0];
        //expect the survey to have the 3 original revisions plus the new draft revision
        expect(updatedSurvey.revisions).toHaveLength(4);
        //expect the highest revision to be the draft with version 4
        expect(updatedSurvey.revisions[updatedSurvey.revisions.length - 1].version).toBe(4);
      });
      it('updates latest revision in revisions array and keeps the rest of the revision history', async () => {
        //fetch a reduced survey like builder does it
        const req1 = createReq({
          params: { id: surveyStored._id },
          query: { version: 'latestPublishedAndDraft' },
        });
        const res1 = await createRes({
          user: { _id: surveyStored.meta.creator, permissions: [] },
        });
        await getSurvey(req1, res1);
        const reducedSurvey = res1.send.mock.calls[0][0];
        //add a draft version
        reducedSurvey.revisions[reducedSurvey.revisions.length - 1].controls[0].name =
          'updated_control_name';
        //update the survey
        const req = createReq({
          params: { id: reducedSurvey._id },
          body: reducedSurvey,
        });
        const res = await createRes({
          user: { _id: reducedSurvey.meta.creator, permissions: [] },
        });
        await updateSurvey(req, res);
        const updatedSurvey = res1.send.mock.calls[0][0];
        //expect the survey to still have 3 revisions
        expect(updatedSurvey.revisions).toHaveLength(3);
        //expect the highest revision to be the draft with version 4
        expect(updatedSurvey.revisions[updatedSurvey.revisions.length - 1].controls[0].name).toBe(
          'updated_control_name'
        );
      });
    });
  });

  describe('cleanup', () => {
    let librarySurvey,
      librarySurveySubmission,
      consumerSurvey,
      consumerSubmission,
      createSubmission;
    beforeEach(async () => {
      const libraryResult = await mockControlsAndSubmission({
        meta: { isLibrary: true },
      });
      createSubmission = libraryResult.createSubmission;
      librarySurvey = libraryResult.survey;
      librarySurveySubmission = libraryResult.submission;
      const consumerResult = await mockControlsAndSubmission(
        undefined,
        librarySurvey._id,
        librarySurvey.latestVersion
      );
      consumerSurvey = consumerResult.survey;
      consumerSubmission = consumerResult.submission;
    });
    describe('getSurveyAndCleanupInfo', () => {
      it('returns the survey by the id passed', async () => {
        const result = await getSurveyAndCleanupInfo(librarySurvey._id, res);
        expect(result.survey._id).toStrictEqual(librarySurvey._id);
      });
      it('returns surveyVersions array of all available version strings', async () => {
        const result = await getSurveyAndCleanupInfo(librarySurvey._id, res);
        expect(result.surveyVersions.length).toBe(librarySurvey.revisions.length);
        expect(result.surveyVersions).toStrictEqual(
          librarySurvey.revisions.map((r) => String(r.version))
        );
      });
      it('returns versionsToKeep array of all versions strings not allowed to delete', async () => {
        const result = await getSurveyAndCleanupInfo(librarySurvey._id, res);
        expect(result.versionsToKeep).toStrictEqual(['2', '3']);
      });
      it('returns versionsToDelete array of all versions strings allowed to delete', async () => {
        const result = await getSurveyAndCleanupInfo(librarySurvey._id, res);
        expect(result.versionsToDelete).toStrictEqual(['1']);
      });
      it('returns versionsToDelete array of all versions excluding drafts', async () => {
        const draftRevision = _.cloneDeep(librarySurvey.revisions[librarySurvey.latestVersion - 1]);
        draftRevision.version = 4;
        librarySurvey.revisions.push(draftRevision);
        await getDb().collection('surveys').findOneAndUpdate(
          { _id: librarySurvey._id },
          { $set: librarySurvey },
          {
            returnOriginal: false,
          }
        );
        const result = await getSurveyAndCleanupInfo(librarySurvey._id, res);
        expect(result.versionsToDelete).toStrictEqual(['1']);
      });
      it('returns submissionsVersionCounts object map with keys=version and value=count of submissions referencing that version', async () => {
        const result = await getSurveyAndCleanupInfo(librarySurvey._id, res);
        expect(result.submissionsVersionCounts).toStrictEqual({ 2: 1 });
      });
      it('returns libraryConsumersByVersion object map with keys=version and value=count of question set consumer surveys referencing that version', async () => {
        const result = await getSurveyAndCleanupInfo(librarySurvey._id, res);
        expect(result.libraryConsumersByVersion).toStrictEqual({ 3: 3 });
      });
      it('returns submissionsVersionCounts object map with keys=version and value=count of submissions referencing that version', async () => {
        const result = await getSurveyAndCleanupInfo(librarySurvey._id, res);
        expect(result.submissionsVersionCounts).toStrictEqual({ 2: 1 });
      });
    });
    describe('cleanupSurvey', () => {
      it('deletes only requestedVersionsToDelete versions when auto=false param is passed', async () => {
        const req = createReq({
          params: { id: librarySurvey._id },
          query: { versions: ['1'], auto: false },
        });
        const res = await createRes({ user: { _id: librarySurvey.meta.creator, permissions: [] } });
        await cleanupSurvey(req, res);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            deletedVersions: ['1'],
            keptVersions: ['2', '3'], //Hint: not contains '3' even if '3' is not deleted too. Reason:  we didn't request to delete '3'
          })
        );
      });
      it('deletes all unused survey versions when auto=true param is passed', async () => {
        const req = createReq({
          params: { id: librarySurvey._id },
          query: { versions: [], auto: true },
        });
        const res = await createRes({ user: { _id: librarySurvey.meta.creator, permissions: [] } });
        await cleanupSurvey(req, res);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            deletedVersions: ['1'],
            keptVersions: ['2', '3'],
          })
        );
      });
      it('do not delete survey versions when dryRun param is passed', async () => {
        const req = createReq({
          params: { id: librarySurvey._id },
          query: { versions: [], auto: true, dryRun: true },
        });
        const res = await createRes({ user: { _id: librarySurvey.meta.creator, permissions: [] } });
        await cleanupSurvey(req, res);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            updated: {},
          })
        );
      });
    });
    describe('deleteArchivedTestSubmissions', () => {
      it('deletes all archived submissions with reasons of SUBMISSION_FROM_BUILDER or TEST_DATA', async () => {
        const { submission: submissionToDel } = await createSubmission();
        submissionToDel.meta.archived = true;
        submissionToDel.meta.archivedReason = 'SUBMISSION_FROM_BUILDER';
        await getDb().collection('submissions').findOneAndUpdate(
          { _id: submissionToDel._id },
          { $set: submissionToDel },
          {
            returnOriginal: false,
          }
        );

        const deleteCount = await deleteArchivedTestSubmissions(
          librarySurvey._id,
          librarySurvey.revisions.map((r) => r.version)
        );
        expect(deleteCount).toBe(1);
      });
      it('does not delete archived submissions with reasons other than SUBMISSION_FROM_BUILDER or TEST_DATA', async () => {
        const { submission: submissionToDel } = await createSubmission();
        submissionToDel.meta.archived = true;
        submissionToDel.meta.archivedReason = 'ANY_REASON';
        await getDb().collection('submissions').findOneAndUpdate(
          { _id: submissionToDel._id },
          { $set: submissionToDel },
          {
            returnOriginal: false,
          }
        );

        const deleteCount = await deleteArchivedTestSubmissions(
          librarySurvey._id,
          librarySurvey.revisions.map((r) => r.version)
        );
        expect(deleteCount).toBe(0);
      });
      it('does not delete unarchived submissions', async () => {
        const { submission: submissionToDel } = await createSubmission();
        submissionToDel.meta.archived = false;
        submissionToDel.meta.archivedReason = 'ANY_REASON';
        await getDb().collection('submissions').findOneAndUpdate(
          { _id: submissionToDel._id },
          { $set: submissionToDel },
          {
            returnOriginal: false,
          }
        );

        const deleteCount = await deleteArchivedTestSubmissions(
          librarySurvey._id,
          librarySurvey.revisions.map((r) => r.version)
        );
        expect(deleteCount).toBe(0);
      });
    });
  });

  describe('getSurveyPdf', () => {
    it('should return PDF base64 if success', async () => {
      const { survey } = await createSurvey(['instructions', 'text', 'ontology']);
      const req = createReq({ params: { id: survey._id } });
      const res = await createRes({
        user: { _id: survey.meta.creator, permissions: [] },
      });
      await getSurveyPdf(req, res);

      expect(res.attachment).toHaveBeenCalledWith('Mock Survey Name - SurveyStack.pdf');
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining('data:application/pdf;base64,')
      );
    });
  });
});
