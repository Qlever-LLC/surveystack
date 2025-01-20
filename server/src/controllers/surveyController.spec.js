import surveyController from './surveyController';
import {
  createReq,
  createRes,
  createSurvey,
  getControlGenerator,
  getSubmissionDataGenerator,
  createGroup,
  createSuperAdmin,
  createMembership,
} from '../testUtils';
import _ from 'lodash';
import { getDb } from '../db';
import createApp from '../app.js';
import request from 'supertest';

const { ObjectId } = jest.requireActual('mongodb');
const {
  updateSurvey,
  getSurvey,
  getSurveyListPage,
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
  const { survey, createSubmission } = await createSurvey(['string', 'number'], surveyOverrides);
  const { submission: _submission } = await createSubmission();

  const controls = survey.revisions[survey.latestVersion - 1].controls;
  const libraryId = new ObjectId();
  const libraryVersion = 3;
  let groupOverride;
  if (consumeLibraryId) {
    groupOverride = {
      children: [
        getControlGenerator('string')({ libraryId, libraryVersion, libraryIsInherited: true }),
      ],
      isLibraryRoot: true,
      libraryId: consumeLibraryId,
      libraryVersion: consumeLibraryVersion,
    };
  } else {
    groupOverride = {
      children: [
        getControlGenerator('string')({ libraryId, libraryVersion, libraryIsInherited: true }),
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
      returnDocument: 'after',
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
  let librarySurvey, admin, res;

  beforeEach(async () => {
    const group = await createGroup();
    admin = await group.createAdminMember();
    res = await createRes({ user: admin.user });

    const libraryResult = await mockControlsAndSubmission({
      meta: { isLibrary: true, creator: admin.user._id, group: { id: group._id } },
    });
    librarySurvey = libraryResult.survey;
    await mockControlsAndSubmission(undefined, librarySurvey._id, librarySurvey.lastedVersion);
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

    it('returns the latest revision (last array position) if version=latestPublishedOrDraft is passed', async () => {
      const returnedSurvey = await loadSurvey('latestPublishedOrDraft');
      expect(returnedSurvey.revisions.length).toBe(1);
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
          query: { version: 'latestPublishedOrDraft' },
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
          query: { version: 'latestPublishedOrDraft' },
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
    let librarySurvey, createSubmission;
    beforeEach(async () => {
      const libraryResult = await mockControlsAndSubmission({
        meta: { isLibrary: true },
      });
      createSubmission = libraryResult.createSubmission;
      librarySurvey = libraryResult.survey;
      await mockControlsAndSubmission(undefined, librarySurvey._id, librarySurvey.latestVersion);
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
            returnDocument: 'after',
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
            returnDocument: 'after',
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
            returnDocument: 'after',
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
            returnDocument: 'after',
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
      const { survey } = await createSurvey(['instructions', 'string', 'ontology']);
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

describe('get surveys and question set', () => {
  let groupA, surveyPinnedToA, surveyA1, surveyA2, surveyA3;
  beforeEach(async () => {
    const { survey: spa } = await createSurvey([], { name: 'surveyPinnedToA' });
    surveyPinnedToA = spa;
    const { survey: surveyPinnedToB } = await createSurvey([], { name: 'surveyPinnedToB' });

    groupA = await createGroup({ surveys: { pinned: [surveyPinnedToA._id] } });
    const groupB = await createGroup({ surveys: { pinned: [surveyPinnedToB._id] } });

    const { survey: s3 } = await createSurvey([], { name: 'surveyA3' });
    surveyA3 = s3;
    const { survey: s2 } = await createSurvey([], { name: 'surveyA2' });
    surveyA2 = s2;
    const { survey: s1 } = await createSurvey([], { name: 'surveyA1' });
    surveyA1 = s1;
    const { survey: surveyB1 } = await createSurvey([], { name: 'surveyB1' });

    const gA = { id: groupA._id, path: groupA.path };
    const gB = { id: groupB._id, path: groupB.path };

    await getDb()
      .collection('surveys')
      .updateMany(
        {
          _id: {
            $in: [
              ObjectId(surveyPinnedToA._id),
              ObjectId(surveyA3._id),
              ObjectId(surveyA2._id),
              ObjectId(surveyA1._id),
            ],
          },
        },
        { $set: { meta: { group: gA } } }
      );
    await getDb()
      .collection('surveys')
      .updateMany(
        {
          _id: {
            $in: [ObjectId(surveyPinnedToB._id), ObjectId(surveyB1._id)],
          },
        },
        { $set: { meta: { group: gB } } }
      );

    await getDb()
      .collection('surveys')
      .updateOne(
        { _id: ObjectId(surveyA2._id) },
        {
          $set: {
            meta: { isLibrary: true },
          },
        }
      );
  });

  it('get survey from a group', async () => {
    const req = createReq({
      params: {},
      query: {
        groupId: groupA._id,
        isLibrary: 'false',
        skip: 0,
        limit: 10,
        prioPinned: true,
      },
    });
    const res = await createRes();
    await getSurveyListPage(req, res);

    const result = res.send.mock.calls[0][0];
    expect(result.pagination.total).toEqual(3);
    expect(result.content[0]._id).toEqual(surveyA1._id);
    expect(result.content[1]._id).toEqual(surveyA3._id);
    expect(result.pinned[0]._id).toEqual(surveyPinnedToA._id);
  });
  it('get question set (surveys that are library)', async () => {
    const req = createReq({
      params: {},
      query: {
        isLibrary: 'true',
        skip: 0,
        limit: 10,
      },
    });
    const res = await createRes();
    await getSurveyListPage(req, res);

    const result = res.send.mock.calls[0][0];
    expect(result.pagination.total).toEqual(1);
    expect(result.content[0]._id).toEqual(surveyA2._id);
  });
});

describe('get pinned surveys', () => {
  let groupA, subGroupA, groupB, surveyPinnedToA, surveyPinnedToSubA, surveyPinnedToB;

  const app = createApp();
  const token = '1234';
  let authHeaderValue;

  beforeEach(async () => {
    const { survey: spa } = await createSurvey([], { name: 'surveyPinnedToA' });
    surveyPinnedToA = spa;
    const { survey: spsuba } = await createSurvey([], { name: 'surveyPinnedToA' });
    surveyPinnedToSubA = spsuba;
    const { survey: spb } = await createSurvey([], { name: 'surveyPinnedToB' });
    surveyPinnedToB = spb;
    const { survey: surveyPinnedToSubB } = await createSurvey([], { name: 'surveyPinnedToSubB' });

    groupA = await createGroup({ name: 'groupA', surveys: { pinned: [surveyPinnedToA._id] } });
    subGroupA = await groupA.createSubGroup(
      { name: 'subGroupA' },
      { surveys: { pinned: [surveyPinnedToSubA._id] } }
    );
    groupB = await createGroup({
      name: 'groupB',
      surveys: { pinned: [surveyPinnedToB._id] },
    });
    const subGroupB = await groupB.createSubGroup(
      { name: 'subGroupB' },
      { surveys: { pinned: [surveyPinnedToSubB._id] } }
    );

    const { survey: surveyA1 } = await createSurvey([], { name: 'surveyA1' });
    const { survey: surveyA2 } = await createSurvey([], { name: 'surveyA2' });
    const { survey: surveySubA1 } = await createSurvey([], { name: 'surveySubA1' });
    const { survey: surveyB1 } = await createSurvey([], { name: 'surveyB1' });

    const gA = { id: groupA._id, path: groupA.path };
    const gSubA = { id: subGroupA._id, path: subGroupA.path };
    const gB = { id: groupB._id, path: groupB.path };
    const gSubB = { id: subGroupB._id, path: subGroupB.path };

    await getDb()
      .collection('surveys')
      .updateMany(
        {
          _id: {
            $in: [ObjectId(surveyPinnedToA._id), ObjectId(surveyA2._id), ObjectId(surveyA1._id)],
          },
        },
        { $set: { meta: { group: gA } } }
      );
    await getDb()
      .collection('surveys')
      .updateMany(
        {
          _id: {
            $in: [ObjectId(surveyPinnedToSubA._id), ObjectId(surveySubA1._id)],
          },
        },
        { $set: { meta: { group: gSubA } } }
      );
    await getDb()
      .collection('surveys')
      .updateMany(
        {
          _id: {
            $in: [ObjectId(surveyPinnedToB._id), ObjectId(surveyB1._id)],
          },
        },
        { $set: { meta: { group: gB } } }
      );
    await getDb()
      .collection('surveys')
      .updateMany(
        {
          _id: {
            $in: [ObjectId(surveyPinnedToSubB._id)],
          },
        },
        { $set: { meta: { group: gSubB } } }
      );
  });

  it('user get pinned survey from root group but not sub-group', async () => {
    const { user: user } = await groupA.createUserMember({
      userOverrides: { token },
    });

    authHeaderValue = `${user.email} ${token}`;

    const res = await request(app)
      .get('/api/surveys/pinned?getOnlyNonArchive=true')
      .set('Authorization', authHeaderValue)
      .expect(200);

    const result = res.body;

    expect(result.pinned.length).toEqual(1);

    expect(result.pinned).toContainEqual({
      group_id: groupA._id.toString(),
      group_name: 'groupA',
      pinned: [surveyPinnedToA._id.toString()],
    });
  });
  it('admin get pinned survey from root group and sub-group', async () => {
    const { user: admin } = await groupA.createAdminMember({
      userOverrides: { token },
    });

    authHeaderValue = `${admin.email} ${token}`;

    const res = await request(app)
      .get('/api/surveys/pinned?getOnlyNonArchive=true')
      .set('Authorization', authHeaderValue)
      .expect(200);

    const result = res.body;

    expect(result.pinned.length).toEqual(2);

    expect(result.pinned).toContainEqual({
      group_id: groupA._id.toString(),
      group_name: 'groupA',
      pinned: [surveyPinnedToA._id.toString()],
    });
    expect(result.pinned).toContainEqual({
      group_id: subGroupA._id.toString(),
      group_name: 'subGroupA',
      pinned: [surveyPinnedToSubA._id.toString()],
    });
  });
  it('you are admin in groupA and user in groupB, so you get pinned survey from groupA, subGroupA and groupB only', async () => {
    const { user: tester } = await groupA.createAdminMember({
      userOverrides: { token },
    });
    await createMembership({
      user: tester,
      group: groupB._id,
      role: 'user',
    });

    authHeaderValue = `${tester.email} ${token}`;

    const res = await request(app)
      .get('/api/surveys/pinned?getOnlyNonArchive=true')
      .set('Authorization', authHeaderValue)
      .expect(200);

    const result = res.body;

    expect(result.pinned.length).toEqual(3);

    expect(result.pinned).toContainEqual({
      group_id: groupB._id.toString(),
      group_name: 'groupB',
      pinned: [surveyPinnedToB._id.toString()],
    });
    expect(result.pinned).toContainEqual({
      group_id: groupA._id.toString(),
      group_name: 'groupA',
      pinned: [surveyPinnedToA._id.toString()],
    });
    expect(result.pinned).toContainEqual({
      group_id: subGroupA._id.toString(),
      group_name: 'subGroupA',
      pinned: [surveyPinnedToSubA._id.toString()],
    });
  });
});
