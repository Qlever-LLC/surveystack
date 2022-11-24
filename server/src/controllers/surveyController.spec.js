import surveyController from './surveyController';
import {
  createReq,
  createRes,
  createSurvey,
  getControlGenerator,
  getSubmissionDataGenerator,
} from '../testUtils';
import _ from 'lodash';
import { db, getDb } from '../db';

const { ObjectId } = jest.requireActual('mongodb');
const { cleanupSurvey, getSurveyAndCleanupInfo } = surveyController;

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

  return { survey, submission };
}

describe('surveyController', () => {
  describe('getSurveyAndCleanupInfo', () => {
    it('returns the survey by the id passed', async () => {
      const { survey, submission } = await mockControlsAndSubmission();
      const result = await getSurveyAndCleanupInfo(survey._id, survey.meta.creator);
      expect(result.survey._id).toStrictEqual(survey._id);
    });

    it('returns surveyVersions array of all available version strings', async () => {
      const { survey, submission } = await mockControlsAndSubmission();
      const result = await getSurveyAndCleanupInfo(survey._id, survey.meta.creator);
      expect(result.surveyVersions.length).toBe(survey.revisions.length);
      expect(result.surveyVersions).toStrictEqual(survey.revisions.map((r) => String(r.version)));
    });
    it('returns versionsToKeep array of all versions strings not allowed to delete', async () => {
      const { survey, submission } = await mockControlsAndSubmission();
      const result = await getSurveyAndCleanupInfo(survey._id, survey.meta.creator);
      expect(result.versionsToKeep).toStrictEqual(['2']);
    });
    it('returns versionsToDelete array of all versions strings allowed to delete', async () => {
      const { survey, submission } = await mockControlsAndSubmission();
      const result = await getSurveyAndCleanupInfo(survey._id, survey.meta.creator);
      expect(result.versionsToDelete).toStrictEqual(['1', '3']);
    });
    it('returns submissionsVersionCounts object map with keys=version and value=count of submissions referencing that version', async () => {
      const { survey, submission } = await mockControlsAndSubmission();
      const result = await getSurveyAndCleanupInfo(survey._id, survey.meta.creator);
      expect(result.submissionsVersionCounts).toStrictEqual({ 2: 1 });
    });
    it('returns libraryConsumersByVersion object map with keys=version and value=count of question set consumer surveys referencing that version', async () => {
      const { survey, submission } = await mockControlsAndSubmission();
      const result = await getSurveyAndCleanupInfo(survey._id, survey.meta.creator);
      //TODO add question set consumer survey and test for that ref
      expect(result.libraryConsumersByVersion).toStrictEqual({});
    });
  });
  describe('cleanupSurvey', () => {
    it('deletes only requestedVersionsToDelete versions when auto=false param is passed', async () => {
      const { survey, submission } = await mockControlsAndSubmission();
      const req = createReq({
        params: { id: survey._id },
        query: { versions: ['1'], auto: false },
      });
      const res = await createRes({ user: { _id: survey.meta.creator, permissions: [] } });
      await cleanupSurvey(req, res);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedVersions: ['1'],
          keptVersions: ['2'], //Hint: not contains '3' even if '3' is not deleted too. Reason:  we didn't request to delete '3'
        })
      );
    });
    it('deletes all unused survey versions when auto=true param is passed', async () => {
      const { survey, submission } = await mockControlsAndSubmission();
      const req = createReq({
        params: { id: survey._id },
        query: { versions: [], auto: true },
      });
      //TODO add a third, unreferenced version to survey, expect that version 1 and 3 are deleted
      const res = await createRes({ user: { _id: survey.meta.creator, permissions: [] } });
      await cleanupSurvey(req, res);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedVersions: ['1', '3'],
          keptVersions: ['2'],
        })
      );
    });
    it('do not delete survey versions when dryRun param is passed', async () => {
      const { survey, submission } = await mockControlsAndSubmission();
      const req = createReq({
        params: { id: survey._id },
        query: { versions: [], auto: true, dryRun: true },
      });
      //TODO add a third, unreferenced version to survey, expect that version 1 and 3 are deleted
      const res = await createRes({ user: { _id: survey.meta.creator, permissions: [] } });
      await cleanupSurvey(req, res);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          updated: {},
        })
      );
    });
  });
  describe('deleteArchivedTestSubmissions', () => {
    it.todo(
      'deletes all archived submissions with reasons of SUBMISSION_FROM_BUILDER or TEST_DATA'
    );
    it.todo(
      'does not delete archived submissions with reasons other than SUBMISSION_FROM_BUILDER or TEST_DATA'
    );
    it.todo('does not delete unarchived submissions');
  });
});
