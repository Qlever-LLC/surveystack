import surveyController from './surveyController';
import {
  createReq,
  createRes,
  createSurvey,
  getControlGenerator,
  getSubmissionDataGenerator,
} from '../testUtils';

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

  return { controls, submission };
}

describe('surveyController', () => {
  describe('getSurveyAndCleanupInfo', () => {
    it.todo('returns the survey by the id passed');
    it.todo('returns surveyVersions array of all available version strings');
    it.todo('returns versionsToKeep array of all versions strings not allowed to delete');
    it.todo('returns versionsToDelete array of all versions strings allowed to delete');
    it.todo(
      'returns submissionsVersionCounts object map with keys=version and value=count of submissions referencing that version'
    );
    it.todo(
      'returns libraryConsumersByVersion object map with keys=version and value=count of question set consumer surveys referencing that version'
    );
  });
  describe('cleanupSurvey', () => {
    it.todo('deletes requestedVersionsToDelete versions when auto=false param is passed');
    it.todo('deletes all unused survey versions when auto=true param is passed');
    it.todo('do not delete survey versions when dryRun param is passed');
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
