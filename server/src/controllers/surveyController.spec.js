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
const { cleanupSurvey, getSurveyAndCleanupInfo, deleteArchivedTestSubmissions } = surveyController;

/**
 * creates a mock survey with 3 versions, controls and a submission
 * @param surveyOverrides pass survey props to overwrite
 * @param consumeLibraryId optional question set library id to consume
 * @param consumeLibraryVersion optional versoin of the question set library to be consumed
 * @returns Object containing survey (the survey created), submission (the submission object generated), createSubmission: a fn to create further submissions for this survey
 */
async function mockControlsAndSubmission(surveyOverrides, consumeLibraryId, consumeLibraryVersion) {
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
  survey.lastedVersion = 3;

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
