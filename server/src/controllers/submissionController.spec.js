import request from 'supertest';
import submissionController, { buildPipeline, DEFAULT_LIMIT } from './submissionController';
import {
  testApp,
  createReq,
  createRes,
  createSurvey,
  createUser,
  createGroup,
  createRequestSubmissionMeta,
  createSubmissionMeta,
  createSurveyMeta,
  createSurveyMetaGroup,
} from '../testUtils';
import mailService from '../services/mail/mail.service';
import { db } from '../db';
import handleApiCompose from './utils/handleApiCompose';

jest.mock('./utils/handleApiCompose');
jest.mock('../services/mail/mail.service');
jest.mock('../db/helpers.ts');
jest.mock('../services/featureToggle.service.js');

const { ObjectId } = jest.requireActual('mongodb');

const handleApiComposeHappyPathImplementation = (submissionEntities) => ({
  results: {
    farmos: [],
    hylo: [],
  },
  entities: submissionEntities,
});
import { withSession, withTransaction } from '../db/helpers.ts';
const { withSession: actualWithSession, withTransaction: actualWithTransaction } =
  jest.requireActual('../db/helpers.ts');
beforeEach(() => {
  // by default, for each test, setup withSession and withTransaction to behave as normal (that is, use their actual implementation), but also set them up as mocks so their functionality can be overridden in individual tests, spied on, etc.
  withSession.mockImplementation(actualWithSession);
  withTransaction.mockImplementation(actualWithTransaction);
  // POST /api/submissions returns a 503 if we don't mock handleApiCompose
  handleApiCompose.mockImplementation(handleApiComposeHappyPathImplementation);
});

const { getSubmissionsCsv, postSubmissionPdf } = submissionController;

describe('submissionController', () => {
  describe('syncDraft', () => {
    const token = '1234';
    let authHeaderValue;
    let group;
    let memberUser;
    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token },
      }));
      authHeaderValue = `${memberUser.email} ${token}`;
    });

    it('returns 401 if the request is not authenticated', async () => {
      const { createRequestSubmission } = await createSurvey(['string']);
      const draftSubmission = createRequestSubmission({
        _id: ObjectId().toString(),
        meta: createRequestSubmissionMeta({ isDraft: true }),
      });

      return request(testApp).post('/api/submissions/sync-draft').send(draftSubmission).expect(401);
    });

    it('returns 400 if the submission in the request is not a draft', async () => {
      const { createRequestSubmission } = await createSurvey(['string']);
      const nonDraftSubmission = createRequestSubmission({
        _id: ObjectId().toString(),
        meta: createRequestSubmissionMeta({ isDraft: false, creator: memberUser._id.toString() }),
      });

      return request(testApp)
        .post('/api/submissions/sync-draft')
        .set('Authorization', authHeaderValue)
        .send(nonDraftSubmission)
        .expect(400);
    });

    it('returns 400 if the submission in the request has a null creator', async () => {
      const { createRequestSubmission } = await createSurvey(['string']);
      const nullCreatorSubmission = createRequestSubmission({
        _id: ObjectId().toString(),
        meta: createRequestSubmissionMeta({
          isDraft: true,
          creator: null,
        }),
      });

      return request(testApp)
        .post('/api/submissions/sync-draft')
        .set('Authorization', authHeaderValue)
        .send(nullCreatorSubmission)
        .expect(400);
    });

    it('returns 400 if the submission in the request does not have a creator', async () => {
      const { createRequestSubmission } = await createSurvey(['string']);
      const requestSubmission = createRequestSubmission({
        _id: ObjectId().toString(),
        meta: createRequestSubmissionMeta({
          isDraft: true,
        }),
      });
      delete requestSubmission.meta.creator;

      return request(testApp)
        .post('/api/submissions/sync-draft')
        .set('Authorization', authHeaderValue)
        .send(requestSubmission)
        .expect(400);
    });

    describe('when the draft being synced is not in the database yet', () => {
      it('returns 401 if the requesting user is not the owner of the submission in the request', async () => {
        const { createRequestSubmission } = await createSurvey(['string']);
        const submissionNotOwnedByRequestingUser = createRequestSubmission({
          _id: ObjectId().toString(),
          meta: createRequestSubmissionMeta({ isDraft: true }),
        });

        return request(testApp)
          .post('/api/submissions/sync-draft')
          .set('Authorization', authHeaderValue)
          .send(submissionNotOwnedByRequestingUser)
          .expect(401);
      });

      describe('when the draft in the request has no meta.status', () => {
        it('returns 200 and puts the draft in the database', async () => {
          const { createRequestSubmission } = await createSurvey(['string']);
          const draftSubmission = createRequestSubmission({
            _id: ObjectId().toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
            }),
          });

          await request(testApp)
            .post('/api/submissions/sync-draft')
            .set('Authorization', authHeaderValue)
            .send(draftSubmission)
            .expect(200);

          const submission = await db
            .collection('submissions')
            .findOne({ _id: ObjectId(draftSubmission._id) });
          expect(submission).not.toBeNull();
        });
      });

      describe('when the draft in the request has meta.status READY_TO_SUBMIT', () => {
        it("when survey doesn't exist, updates the submission, sets UNAUTHORIZED_TO_SUBMIT status, removes READY_TO_SUBMIT status, keeps isDraft true, and returns 200", async () => {
          const submissionId = ObjectId();
          const { createRequestSubmission, survey } = await createSurvey(['string']);
          await db.collection('surveys').deleteOne({ _id: survey._id });
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-02').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions/sync-draft')
            .set('Authorization', authHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
          expect(submission.meta.dateModified.toISOString()).toEqual(
            requestSubmission.meta.dateModified
          );
          expect(submission.meta.status).not.toContainEqual(
            expect.objectContaining({ type: 'READY_TO_SUBMIT' })
          );
          expect(submission.meta.status).toContainEqual(
            expect.objectContaining({ type: 'UNAUTHORIZED_TO_SUBMIT' })
          );
          expect(submission.meta.isDraft).toBe(true);
        });

        it('when survey.meta.submissions is "group" and requesting user is not a member of the group, inserts the submissions in the db, sets UNAUTHORIZED_TO_SUBMIT status, keeps isDraft true, and returns 200', async () => {
          const submissionId = ObjectId();
          const { createRequestSubmission, survey } = await createSurvey(['string']);
          await db
            .collection('surveys')
            .updateOne({ _id: survey._id }, { $set: { 'meta.submissions': 'group' } });
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-02').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions/sync-draft')
            .set('Authorization', authHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
          expect(submission.meta.dateModified.toISOString()).toEqual(
            requestSubmission.meta.dateModified
          );
          expect(submission.meta.status).not.toContainEqual(
            expect.objectContaining({ type: 'READY_TO_SUBMIT' })
          );
          expect(submission.meta.status).toContainEqual(
            expect.objectContaining({ type: 'UNAUTHORIZED_TO_SUBMIT' })
          );
          expect(submission.meta.isDraft).toBe(true);
        });

        it('when handleApiCompose fails, it sets FAILED_TO_SUBMIT status, keeps isDraft true, inserts the submission in the database, and returns 200', async () => {
          const submissionId = ObjectId();
          const { createRequestSubmission } = await createSurvey(['string']);
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-02').toISOString() },
                },
              ],
            }),
          });
          handleApiCompose.mockRejectedValueOnce({});

          await request(testApp)
            .post('/api/submissions/sync-draft')
            .set('Authorization', authHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
          expect(submission.meta.dateModified.toISOString()).toEqual(
            requestSubmission.meta.dateModified
          );
          expect(submission.meta.status).not.toContainEqual(
            expect.objectContaining({ type: 'READY_TO_SUBMIT' })
          );
          expect(submission.meta.status).toContainEqual(
            expect.objectContaining({ type: 'FAILED_TO_SUBMIT' })
          );
          expect(submission.meta.isDraft).toBe(true);
        });

        it('runs handleApiCompose, inserts the request submission into the db, removing READY_TO_SUBMIT and setting isDraft to false, and returns 200 when authorized', async () => {
          const submissionId = ObjectId();
          const { createRequestSubmission } = await createSurvey(['string']);
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-02').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions/sync-draft')
            .set('Authorization', authHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
          expect(submission.meta.dateModified.toISOString()).toEqual(
            requestSubmission.meta.dateModified
          );
          expect(submission.meta.status).not.toContainEqual(
            expect.objectContaining({ type: 'READY_TO_SUBMIT' })
          );
          expect(submission.meta.isDraft).toBe(false);
        });
      });

      describe('when the draft in the request has meta.status READY_TO_DELETE', () => {
        it('returns 200, and saves nothing to the database', async () => {
          const submissionId = ObjectId();
          const { createRequestSubmission } = await createSurvey(['string']);
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              status: [
                {
                  type: 'READY_TO_DELETE',
                  value: { at: new Date('2021-01-02').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions/sync-draft')
            .set('Authorization', authHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).toBeNull();
        });
      });
    });

    describe('when a version of the draft being synced is already in the database (the submission in the request shares an id with a submission in the database)', () => {
      it('returns 401 when the requesting user is not the owner of the submission in the database', async () => {
        const submissionId = new ObjectId();
        const { createRequestSubmission, createSubmission } = await createSurvey(['string']);
        await createSubmission({
          _id: submissionId,
          meta: createSubmissionMeta({ isDraft: true, creator: new ObjectId() }),
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({ isDraft: true, creator: memberUser._id.toString() }),
        });

        return request(testApp)
          .post('/api/submissions/sync-draft')
          .set('Authorization', authHeaderValue)
          .send(requestSubmission)
          .expect(401);
      });

      it('returns 401 when the requesting user is not the owner of the submission in the request', async () => {
        const submissionId = new ObjectId();
        const { createRequestSubmission, createSubmission } = await createSurvey(['string']);
        await createSubmission({
          _id: submissionId,
          meta: createSubmissionMeta({ isDraft: true, creator: memberUser._id }),
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({ isDraft: true, creator: new ObjectId().toString() }),
        });

        return request(testApp)
          .post('/api/submissions/sync-draft')
          .set('Authorization', authHeaderValue)
          .send(requestSubmission)
          .expect(401);
      });

      describe('when the database copy is not a draft (already submitted)', () => {
        it('returns 200 and discards the draft in the request, even if it is newer and has meta.status READY_TO_SUBMIT', async () => {
          const submissionId = new ObjectId();
          const { createRequestSubmission, createSubmission } = await createSurvey(['string']);
          const { submission: databaseSubmission } = await createSubmission({
            _id: submissionId,
            meta: createSubmissionMeta({
              isDraft: false,
              creator: memberUser._id,
              dateModified: new Date('2021-01-01'),
            }),
          });
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
              status: [{ type: 'READY_TO_SUBMIT', value: { at: new Date().toISOString() } }],
              dateModified: new Date('2021-01-02').toISOString(),
            }),
          });

          await request(testApp)
            .post('/api/submissions/sync-draft')
            .set('Authorization', authHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
          expect(submission.meta.isDraft).toBe(false);
          expect(submission.meta.dateModified).toEqual(databaseSubmission.meta.dateModified);
        });
      });

      describe('when the database copy is a draft', () => {
        const setupDraftInDatabase = async (dateModified) => {
          const submissionId = new ObjectId();
          const { createRequestSubmission, createSubmission, survey } = await createSurvey([
            'string',
          ]);
          const { submission: databaseSubmission } = await createSubmission({
            _id: submissionId,
            meta: createSubmissionMeta({ isDraft: true, creator: memberUser._id, dateModified }),
          });

          return {
            survey,
            submissionId,
            createRequestSubmission,
            databaseSubmission,
          };
        };
        describe('when the submission in the request has more recent changes than the submission in the database', () => {
          describe('when the database copy has isDeletedDraft true', () => {
            describe('when the request submission has no meta.status', () => {
              it('updates the database (un-deletes) using the request submission and returns 200', async () => {
                const submissionId = new ObjectId();
                const dateModified = new Date('2021-01-01');
                const { createRequestSubmission, createSubmission } = await createSurvey([
                  'string',
                ]);
                await createSubmission({
                  _id: submissionId,
                  meta: createSubmissionMeta({
                    isDraft: true,
                    isDeletedDraft: true,
                    creator: memberUser._id,
                    dateModified: dateModified,
                  }),
                });
                const requestSubmission = createRequestSubmission({
                  _id: submissionId.toString(),
                  meta: createRequestSubmissionMeta({
                    isDraft: true,
                    creator: memberUser._id.toString(),
                    dateModified: new Date('2021-01-02').toISOString(),
                  }),
                });

                await request(testApp)
                  .post('/api/submissions/sync-draft')
                  .set('Authorization', authHeaderValue)
                  .send(requestSubmission)
                  .expect(200);

                const submission = await db
                  .collection('submissions')
                  .findOne({ _id: submissionId });
                expect(submission).not.toBeNull();
                expect(submission.meta.dateModified.toISOString()).toEqual(
                  requestSubmission.meta.dateModified
                );
                expect(submission.meta.isDeletedDraft).toBe(false);
              });
            });

            describe('when the request submission has meta.status READY_TO_SUBMIT', () => {
              it('updates the database (un-deletes) using the request submission and returns 200', async () => {
                const submissionId = new ObjectId();
                const dateModified = new Date('2021-01-01');
                const { createRequestSubmission, createSubmission } = await createSurvey([
                  'string',
                ]);
                await createSubmission({
                  _id: submissionId,
                  meta: createSubmissionMeta({
                    isDraft: true,
                    isDeletedDraft: true,
                    creator: memberUser._id,
                    dateModified: dateModified,
                  }),
                });
                const requestSubmission = createRequestSubmission({
                  _id: submissionId.toString(),
                  meta: createRequestSubmissionMeta({
                    isDraft: true,
                    creator: memberUser._id.toString(),
                    dateModified: new Date('2021-01-02').toISOString(),
                    status: [
                      {
                        type: 'READY_TO_SUBMIT',
                        value: { at: new Date('2021-01-02').toISOString() },
                      },
                    ],
                  }),
                });

                await request(testApp)
                  .post('/api/submissions/sync-draft')
                  .set('Authorization', authHeaderValue)
                  .send(requestSubmission)
                  .expect(200);

                const submission = await db
                  .collection('submissions')
                  .findOne({ _id: submissionId });
                expect(submission).not.toBeNull();
                expect(submission.meta.dateModified.toISOString()).toEqual(
                  requestSubmission.meta.dateModified
                );
                expect(submission.meta.isDeletedDraft).toBe(false);
                expect(submission.meta.isDraft).toBe(false);
                expect(submission.meta.status).not.toContainEqual(
                  expect.objectContaining({ type: 'READY_TO_SUBMIT' })
                );
              });
            });

            describe('when the request submission has meta.status READY_TO_DELETE', () => {
              it('updates the database using the request submission and returns 200, leaving the draft deleted but updating dateModified', async () => {
                const submissionId = new ObjectId();
                const dateModified = new Date('2021-01-01');
                const { createRequestSubmission, createSubmission } = await createSurvey([
                  'string',
                ]);
                await createSubmission({
                  _id: submissionId,
                  meta: createSubmissionMeta({
                    isDraft: true,
                    isDeletedDraft: true,
                    creator: memberUser._id,
                    dateModified: dateModified,
                  }),
                });
                const requestSubmission = createRequestSubmission({
                  _id: submissionId.toString(),
                  meta: createRequestSubmissionMeta({
                    isDraft: true,
                    creator: memberUser._id.toString(),
                    dateModified: new Date('2021-01-02').toISOString(),
                    status: [
                      {
                        type: 'READY_TO_DELETE',
                        value: { at: new Date('2021-01-02').toISOString() },
                      },
                    ],
                  }),
                });

                await request(testApp)
                  .post('/api/submissions/sync-draft')
                  .set('Authorization', authHeaderValue)
                  .send(requestSubmission)
                  .expect(200);

                const submission = await db
                  .collection('submissions')
                  .findOne({ _id: submissionId });
                expect(submission).not.toBeNull();
                expect(submission.meta.dateModified.toISOString()).toEqual(
                  requestSubmission.meta.dateModified
                );
                expect(submission.meta.isDeletedDraft).toBe(true);
              });
            });
          });

          describe('when the request submission has meta.status READY_TO_DELETE', () => {
            it('returns 200, updates the submission in the database to be "soft deleted", removing READY_TO_DELETE, setting isDeletedDraft to true, and keeping isDraft true,', async () => {
              const { submissionId, createRequestSubmission } = await setupDraftInDatabase(
                new Date('2021-01-01')
              );
              const requestSubmission = createRequestSubmission({
                _id: submissionId.toString(),
                meta: createRequestSubmissionMeta({
                  isDraft: true,
                  creator: memberUser._id.toString(),
                  dateModified: new Date('2021-01-02').toISOString(),
                  status: [
                    {
                      type: 'READY_TO_DELETE',
                      value: { at: new Date('2021-01-02').toISOString() },
                    },
                  ],
                }),
              });

              await request(testApp)
                .post('/api/submissions/sync-draft')
                .set('Authorization', authHeaderValue)
                .send(requestSubmission)
                .expect(200);

              const submission = await db.collection('submissions').findOne({ _id: submissionId });
              expect(submission).not.toBeNull();
              expect(submission.meta.dateModified.toISOString()).toEqual(
                requestSubmission.meta.dateModified
              );
              expect(submission.meta.status).not.toContainEqual(
                expect.objectContaining({ type: 'READY_TO_DELETE' })
              );
              expect(submission.meta.isDraft).toBe(true);
              expect(submission.meta.isDeletedDraft).toBe(true);
            });
          });

          describe('when the request submission has no meta.status', () => {
            it('updates the database using the request submission and returns 200', async () => {
              const { submissionId, createRequestSubmission } = await setupDraftInDatabase(
                new Date('2021-01-01')
              );
              const requestSubmission = createRequestSubmission({
                _id: submissionId.toString(),
                meta: createRequestSubmissionMeta({
                  isDraft: true,
                  creator: memberUser._id.toString(),
                  dateModified: new Date('2021-01-02').toISOString(),
                }),
              });

              await request(testApp)
                .post('/api/submissions/sync-draft')
                .set('Authorization', authHeaderValue)
                .send(requestSubmission)
                .expect(200);

              const submission = await db.collection('submissions').findOne({ _id: submissionId });
              expect(submission).not.toBeNull();
              expect(submission.meta.dateModified.toISOString()).toEqual(
                requestSubmission.meta.dateModified
              );
            });
          });

          describe('when the request submission has meta.status READY_TO_SUBMIT', () => {
            it("when survey doesn't exist, updates the submission, sets UNAUTHORIZED_TO_SUBMIT status, removes READY_TO_SUBMIT status, keeps isDraft true, and returns 200", async () => {
              const { submissionId, createRequestSubmission, survey } = await setupDraftInDatabase(
                new Date('2021-01-01')
              );
              await db.collection('surveys').deleteOne({ _id: survey._id });
              const requestSubmission = createRequestSubmission({
                _id: submissionId.toString(),
                meta: createRequestSubmissionMeta({
                  isDraft: true,
                  creator: memberUser._id.toString(),
                  dateModified: new Date('2021-01-02').toISOString(),
                  status: [
                    {
                      type: 'READY_TO_SUBMIT',
                      value: { at: new Date('2021-01-02').toISOString() },
                    },
                  ],
                }),
              });

              await request(testApp)
                .post('/api/submissions/sync-draft')
                .set('Authorization', authHeaderValue)
                .send(requestSubmission)
                .expect(200);

              const submission = await db.collection('submissions').findOne({ _id: submissionId });
              expect(submission).not.toBeNull();
              expect(submission.meta.dateModified.toISOString()).toEqual(
                requestSubmission.meta.dateModified
              );
              expect(submission.meta.status).not.toContainEqual(
                expect.objectContaining({ type: 'READY_TO_SUBMIT' })
              );
              expect(submission.meta.status).toContainEqual(
                expect.objectContaining({ type: 'UNAUTHORIZED_TO_SUBMIT' })
              );
              expect(submission.meta.isDraft).toBe(true);
            });

            it('when survey.meta.submissions is "group" and requesting user is not a member of the group, sets UNAUTHORIZED_TO_SUBMIT status, keeps isDraft true, and returns 200', async () => {
              const { submissionId, createRequestSubmission, survey } = await setupDraftInDatabase(
                new Date('2021-01-01')
              );
              await db
                .collection('surveys')
                .updateOne({ _id: survey._id }, { $set: { 'meta.submissions': 'group' } });
              const requestSubmission = createRequestSubmission({
                _id: submissionId.toString(),
                meta: createRequestSubmissionMeta({
                  isDraft: true,
                  creator: memberUser._id.toString(),
                  dateModified: new Date('2021-01-02').toISOString(),
                  status: [
                    {
                      type: 'READY_TO_SUBMIT',
                      value: { at: new Date('2021-01-02').toISOString() },
                    },
                  ],
                }),
              });

              await request(testApp)
                .post('/api/submissions/sync-draft')
                .set('Authorization', authHeaderValue)
                .send(requestSubmission)
                .expect(200);

              const submission = await db.collection('submissions').findOne({ _id: submissionId });
              expect(submission).not.toBeNull();
              expect(submission.meta.dateModified.toISOString()).toEqual(
                requestSubmission.meta.dateModified
              );
              expect(submission.meta.status).not.toContainEqual(
                expect.objectContaining({ type: 'READY_TO_SUBMIT' })
              );
              expect(submission.meta.status).toContainEqual(
                expect.objectContaining({ type: 'UNAUTHORIZED_TO_SUBMIT' })
              );
              expect(submission.meta.isDraft).toBe(true);
            });

            it('when handleApiCompose fails, it sets FAILED_TO_SUBMIT status, keeps isDraft true, updates the submission in the database, and returns 200', async () => {
              const { submissionId, createRequestSubmission } = await setupDraftInDatabase(
                new Date('2021-01-01')
              );
              const requestSubmission = createRequestSubmission({
                _id: submissionId.toString(),
                meta: createRequestSubmissionMeta({
                  isDraft: true,
                  creator: memberUser._id.toString(),
                  dateModified: new Date('2021-01-02').toISOString(),
                  status: [
                    {
                      type: 'READY_TO_SUBMIT',
                      value: { at: new Date('2021-01-02').toISOString() },
                    },
                  ],
                }),
              });
              handleApiCompose.mockRejectedValueOnce({});

              await request(testApp)
                .post('/api/submissions/sync-draft')
                .set('Authorization', authHeaderValue)
                .send(requestSubmission)
                .expect(200);

              const submission = await db.collection('submissions').findOne({ _id: submissionId });
              expect(submission).not.toBeNull();
              expect(submission.meta.dateModified.toISOString()).toEqual(
                requestSubmission.meta.dateModified
              );
              expect(submission.meta.status).not.toContainEqual(
                expect.objectContaining({ type: 'READY_TO_SUBMIT' })
              );
              expect(submission.meta.status).toContainEqual(
                expect.objectContaining({ type: 'FAILED_TO_SUBMIT' })
              );
              expect(submission.meta.isDraft).toBe(true);
            });

            it('runs handleApiCompose, updates the database using the request submission, removing READY_TO_SUBMIT and setting isDraft to false, and returns 200 when authorized', async () => {
              const { submissionId, createRequestSubmission } = await setupDraftInDatabase(
                new Date('2021-01-01')
              );
              const requestSubmission = createRequestSubmission({
                _id: submissionId.toString(),
                meta: createRequestSubmissionMeta({
                  isDraft: true,
                  creator: memberUser._id.toString(),
                  dateModified: new Date('2021-01-02').toISOString(),
                  status: [
                    {
                      type: 'READY_TO_SUBMIT',
                      value: { at: new Date('2021-01-02').toISOString() },
                    },
                  ],
                }),
              });

              await request(testApp)
                .post('/api/submissions/sync-draft')
                .set('Authorization', authHeaderValue)
                .send(requestSubmission)
                .expect(200);

              const submission = await db.collection('submissions').findOne({ _id: submissionId });
              expect(submission).not.toBeNull();
              expect(submission.meta.dateModified.toISOString()).toEqual(
                requestSubmission.meta.dateModified
              );
              expect(submission.meta.status).not.toContainEqual(
                expect.objectContaining({ type: 'READY_TO_SUBMIT' })
              );
              expect(submission.meta.isDraft).toBe(false);
            });
          });
        });

        describe('when the submission in the database has more recent changes than the submission in the request (or a tie)', () => {
          let submissionId;
          let createRequestSubmission;
          let databaseSubmission;
          beforeEach(async () => {
            ({ submissionId, createRequestSubmission, databaseSubmission } =
              await setupDraftInDatabase(new Date('2021-01-02')));
          });

          it('when the request submission has meta.status READY_TO_DELETE, returns 200 and does not update the database', async () => {
            const requestSubmission = createRequestSubmission({
              _id: submissionId.toString(),
              meta: createRequestSubmissionMeta({
                isDraft: true,
                creator: memberUser._id.toString(),
                dateModified: new Date('2021-01-01').toISOString(),
                status: [
                  {
                    type: 'READY_TO_DELETE',
                    value: { at: new Date('2021-01-01').toISOString() },
                  },
                ],
              }),
            });

            await request(testApp)
              .post('/api/submissions/sync-draft')
              .set('Authorization', authHeaderValue)
              .send(requestSubmission)
              .expect(200);

            const submission = await db.collection('submissions').findOne({ _id: submissionId });
            expect(submission).not.toBeNull();
            expect(submission.meta.dateModified).toEqual(databaseSubmission.meta.dateModified);
          });

          it('when the request submission has meta.status READY_TO_SUBMIT, returns 200 and does not update the database', async () => {
            const requestSubmission = createRequestSubmission({
              _id: submissionId.toString(),
              meta: createRequestSubmissionMeta({
                isDraft: true,
                creator: memberUser._id.toString(),
                dateModified: new Date('2021-01-01').toISOString(),
                status: [
                  {
                    type: 'READY_TO_SUBMIT',
                    value: { at: new Date('2021-01-01').toISOString() },
                  },
                ],
              }),
            });

            await request(testApp)
              .post('/api/submissions/sync-draft')
              .set('Authorization', authHeaderValue)
              .send(requestSubmission)
              .expect(200);

            const submission = await db.collection('submissions').findOne({ _id: submissionId });
            expect(submission).not.toBeNull();
            expect(submission.meta.dateModified).toEqual(databaseSubmission.meta.dateModified);
          });

          it('when no meta.status is present on the request submission, returns 200 and does not update the database', async () => {
            const requestSubmission = createRequestSubmission({
              _id: submissionId.toString(),
              meta: createRequestSubmissionMeta({
                isDraft: true,
                creator: memberUser._id.toString(),
                dateModified: new Date('2021-01-01').toISOString(),
              }),
            });

            await request(testApp)
              .post('/api/submissions/sync-draft')
              .set('Authorization', authHeaderValue)
              .send(requestSubmission)
              .expect(200);

            const submission = await db.collection('submissions').findOne({ _id: submissionId });
            expect(submission).not.toBeNull();
            expect(submission.meta.dateModified).toEqual(databaseSubmission.meta.dateModified);
          });
        });
      });
    });
  });

  describe('getDraftsPage', () => {
    const token = '1234';
    let authHeaderValue;
    let group;
    let memberUser;
    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token },
      }));
      authHeaderValue = `${memberUser.email} ${token}`;
    });

    it('returns 401 when the request is not authenticated', async () => {
      await request(testApp).get('/api/submissions/drafts/page').send().expect(401);
    });

    describe('when authenticated', () => {
      it('returns 200 with empty array and pagination metadata when user has no drafts', async () => {
        const response = await request(testApp)
          .get('/api/submissions/drafts/page')
          .set('Authorization', authHeaderValue)
          .send()
          .expect(200);

        expect(response.body.content).toHaveLength(0);
        expect(response.body.pagination).toEqual({
          total: 0,
          skip: 0,
          limit: DEFAULT_LIMIT,
        });
      });

      it('returns drafts belonging to the requesting user but does not return other things (see details in test body).', async () => {
        const { createSubmission } = await createSurvey(['string']);
        // Should return...
        // draft belonging to the requesting user
        const draftBelongingToRequestingUserId = new ObjectId();
        await createSubmission({
          _id: draftBelongingToRequestingUserId,
          meta: createSubmissionMeta({
            isDraft: true,
            isDeletedDraft: false,
            creator: memberUser._id,
          }),
        });

        // Should not return...
        // deleted draft belonging to the requesting user
        const deletedDraftBelongingToRequestingUserId = new ObjectId();
        await createSubmission({
          _id: deletedDraftBelongingToRequestingUserId,
          meta: createSubmissionMeta({
            isDraft: true,
            isDeletedDraft: true,
            creator: memberUser._id,
          }),
        });
        // submitted submissions belonging to the requesting user
        const submittedSubmissionBelongToTheRequestingUserId = new ObjectId();
        await createSubmission({
          _id: submittedSubmissionBelongToTheRequestingUserId,
          meta: createSubmissionMeta({
            isDraft: false,
            isDeletedDraft: false,
            creator: memberUser._id,
          }),
        });
        // drafts NOT belonging to requesting user
        const draftNotBelongingToRequestingUserId = new ObjectId();
        await createSubmission({
          _id: draftNotBelongingToRequestingUserId,
          meta: createSubmissionMeta({
            isDraft: true,
            isDeletedDraft: false,
            creator: new ObjectId(),
          }),
        });

        const response = await request(testApp)
          .get('/api/submissions/drafts/page')
          .set('Authorization', authHeaderValue)
          .send()
          .expect(200);

        expect(response.body.content).toContainEqual(
          expect.objectContaining({ _id: draftBelongingToRequestingUserId.toString() })
        );
        expect(response.body.content).not.toContainEqual(
          expect.objectContaining({
            _id: submittedSubmissionBelongToTheRequestingUserId.toString(),
          })
        );
        expect(response.body.content).not.toContainEqual(
          expect.objectContaining({ _id: deletedDraftBelongingToRequestingUserId.toString() })
        );
        expect(response.body.content).not.toContainEqual(
          expect.objectContaining({ _id: draftNotBelongingToRequestingUserId.toString() })
        );
      });

      it('paginates correctly (limits according to query param, show different results between pages, and sorts by most recetly modified first)', async () => {
        const { createSubmission } = await createSurvey(['string']);
        const { submission: draftCreatedFirst } = await createSubmission({
          _id: new ObjectId(),
          meta: createSubmissionMeta({
            isDraft: true,
            isDeletedDraft: false,
            creator: memberUser._id,
            dateModified: new Date('2021-01-02').toISOString(),
          }),
        });
        const { submission: draftCreatedSecond } = await createSubmission({
          _id: new ObjectId(),
          meta: createSubmissionMeta({
            isDraft: true,
            isDeletedDraft: false,
            creator: memberUser._id,
            dateModified: new Date('2021-01-03').toISOString(),
          }),
        });

        const pageOneResponse = await request(testApp)
          .get('/api/submissions/drafts/page?limit=1&skip=0')
          .set('Authorization', authHeaderValue)
          .send()
          .expect(200);
        const pageTwoResponse = await request(testApp)
          .get('/api/submissions/drafts/page?limit=1&skip=1')
          .set('Authorization', authHeaderValue)
          .send()
          .expect(200);

        expect(pageOneResponse.body.content).toContainEqual(
          expect.objectContaining({ _id: draftCreatedSecond._id.toString() })
        );
        expect(pageOneResponse.body.content).toHaveLength(1);
        expect(pageTwoResponse.body.content).toContainEqual(
          expect.objectContaining({ _id: draftCreatedFirst._id.toString() })
        );
        expect(pageTwoResponse.body.content).toHaveLength(1);
      });
    });
  });

  describe('getSubmissions', () => {
    const token = '1234';
    let authHeaderValue;
    let group;
    let memberUser;
    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token },
      }));
      authHeaderValue = `${memberUser.email} ${token}`;
    });

    it('does not return drafts', async () => {
      const { createSubmission } = await createSurvey(['string']);
      const [{ submission }, { submission: draft }] = await Promise.all([
        createSubmission({
          _id: new ObjectId(),
          meta: createSubmissionMeta({ isDraft: false, creator: memberUser._id }),
        }),
        createSubmission({
          _id: new ObjectId(),
          meta: createSubmissionMeta({ isDraft: true, creator: memberUser._id }),
        }),
      ]);

      const response = await request(testApp)
        .get('/api/submissions')
        .set('Authorization', authHeaderValue)
        .send()
        .expect(200);

      expect(response.body).toContainEqual(
        expect.objectContaining({ _id: submission._id.toString() })
      );
      expect(response.body).not.toContainEqual(
        expect.objectContaining({ _id: draft._id.toString() })
      );
    });
  });

  describe('getSubmission', () => {
    const token = '1234';
    let group;
    let memberUser;
    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token },
      }));
    });

    it('returns 404 when the submission is a draft', async () => {
      const { createSubmission } = await createSurvey(['string']);
      const { submission } = await createSubmission({
        _id: new ObjectId(),
        meta: createSubmissionMeta({ isDraft: true, creator: memberUser._id }),
      });

      await request(testApp)
        .get(`/api/submissions/${submission._id.toString()}`)
        .send()
        .expect(404);
    });
  });

  describe('getSubmissionsPage', () => {
    const token = '1234';
    let authHeaderValue;
    let group;
    let memberUser;
    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token },
      }));
      authHeaderValue = `${memberUser.email} ${token}`;
    });

    it('does not return drafts', async () => {
      const { createSubmission } = await createSurvey(['string']);
      const [{ submission }, { submission: draft }] = await Promise.all([
        createSubmission({
          _id: new ObjectId(),
          meta: createSubmissionMeta({ isDraft: false, creator: memberUser._id }),
        }),
        createSubmission({
          _id: new ObjectId(),
          meta: createSubmissionMeta({ isDraft: true, creator: memberUser._id }),
        }),
      ]);

      const response = await request(testApp)
        .get('/api/submissions/page')
        .set('Authorization', authHeaderValue)
        .send()
        .expect(200);

      expect(response.body.content).toContainEqual(
        expect.objectContaining({ _id: submission._id.toString() })
      );
      expect(response.body.content).not.toContainEqual(
        expect.objectContaining({ _id: draft._id.toString() })
      );
    });
  });

  describe('createSubmission', () => {
    const memberToken = 'member-token';
    const adminToken = 'admin-token';
    let memberAuthHeaderValue;
    let adminAuthHeaderValue;
    let group;
    let memberUser;
    let adminUser;
    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token: memberToken },
      }));
      ({ user: adminUser } = await group.createAdminMember({
        userOverrides: { token: adminToken },
      }));
      memberAuthHeaderValue = `${memberUser.email} ${memberToken}`;
      adminAuthHeaderValue = `${adminUser.email} ${adminToken}`;
    });

    it('migrates submissions with specVersion 3 to specVersion 4 before creating', async () => {
      const submissionId = ObjectId();
      const { createRequestSubmission } = await createSurvey(['string']);
      const meta = createRequestSubmissionMeta({
        creator: memberUser._id.toString(),
        specVersion: 3,
        status: [
          {
            type: 'READY_TO_SUBMIT',
            value: { at: new Date('2021-01-01').toISOString() },
          },
        ],
      });
      delete meta.isDraft;
      delete meta.isDeletedDraft;
      const requestSubmission = createRequestSubmission({
        _id: submissionId.toString(),
        meta,
      });

      await request(testApp)
        .post('/api/submissions')
        .set('Authorization', memberAuthHeaderValue)
        .send(requestSubmission)
        .expect(200);

      const submission = await db.collection('submissions').findOne({ _id: submissionId });
      expect(submission).not.toBeNull();
      expect(submission.meta.specVersion).toBe(4);
    });

    it('migrates submission from the builder with specVersion 3 to specVersion 4 before creating', async () => {
      const submissionId = ObjectId();
      const { createRequestSubmission } = await createSurvey(['string']);
      const meta = createRequestSubmissionMeta({
        creator: memberUser._id.toString(),
        specVersion: 3,
        archived: true,
        archivedReason: 'SUBMISSION_FROM_BUILDER',
      });
      delete meta.isDraft;
      delete meta.isDeletedDraft;
      const requestSubmission = createRequestSubmission({
        _id: submissionId.toString(),
        meta,
      });

      await request(testApp)
        .post('/api/submissions')
        .set('Authorization', memberAuthHeaderValue)
        .send(requestSubmission)
        .expect(200);

      const submission = await db.collection('submissions').findOne({ _id: submissionId });
      expect(submission).not.toBeNull();
      expect(submission.meta.specVersion).toBe(4);
    });

    describe('when an existing submission with the same id exists in the database', () => {
      it('when the existing submission is already submitted (isDraft=false), the request is rejected', async () => {
        const { createSubmission, createRequestSubmission } = await createSurvey(['string']);
        const { submission: existingSubmission } = await createSubmission({
          _id: new ObjectId(),
          meta: createSubmissionMeta({
            isDraft: false,
            isDeletedDraft: false,
            creator: memberUser._id,
            dateModified: new Date('2021-01-01').toISOString(),
          }),
        });
        const requestSubmission = createRequestSubmission({
          _id: existingSubmission._id,
          meta: createRequestSubmissionMeta({
            isDraft: true,
            creator: memberUser._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
            status: [
              {
                type: 'READY_TO_SUBMIT',
                value: { at: new Date('2021-01-02').toISOString() },
              },
            ],
          }),
        });

        await request(testApp)
          .post('/api/submissions')
          .set('Authorization', memberAuthHeaderValue)
          .send(requestSubmission)
          .expect(409);

        const submission = await db
          .collection('submissions')
          .findOne({ _id: existingSubmission._id });
        expect(submission).not.toBeNull();
        expect(submission.meta.dateModified).toEqual(existingSubmission.meta.dateModified);
      });

      describe('when the existing submission is a draft and the submission in the request is READY_TO_SUBMIT', () => {
        it('it updates the submission to be "submitted"', async () => {
          const { createSubmission, createRequestSubmission } = await createSurvey(['string']);
          const { submission: existingSubmission } = await createSubmission({
            _id: new ObjectId(),
            meta: createSubmissionMeta({
              isDraft: true,
              isDeletedDraft: false,
              creator: memberUser._id,
              dateModified: new Date('2021-01-01').toISOString(),
            }),
          });
          const requestSubmission = createRequestSubmission({
            _id: existingSubmission._id,
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-02').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', memberAuthHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db
            .collection('submissions')
            .findOne({ _id: existingSubmission._id });
          expect(submission).not.toBeNull();
          expect(submission.meta.status).not.toContainEqual(
            expect.objectContaining({ type: 'READY_TO_SUBMIT' })
          );
          expect(submission.meta.isDraft).toBe(false);
          expect(submission.meta.dateModified.toISOString()).toEqual(
            requestSubmission.meta.dateModified
          );
        });

        it('returns 401 if the requesting user is not the owner of the existing draft', async () => {
          const { createSubmission, createRequestSubmission } = await createSurvey(['string']);
          const { submission: existingSubmission } = await createSubmission({
            _id: new ObjectId(),
            meta: createSubmissionMeta({
              isDraft: true,
              isDeletedDraft: false,
              creator: new ObjectId(),
              dateModified: new Date('2021-01-01').toISOString(),
            }),
          });
          const requestSubmission = createRequestSubmission({
            _id: existingSubmission._id,
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-02').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', memberAuthHeaderValue)
            .send(requestSubmission)
            .expect(401);

          const submission = await db
            .collection('submissions')
            .findOne({ _id: existingSubmission._id });
          expect(submission).not.toBeNull();
          expect(submission.meta.dateModified).toEqual(existingSubmission.meta.dateModified);
        });
      });
    });

    describe('when the request submission is a draft (isDraft=true)', () => {
      it('returns 200 and saves submission to database, removing READY_TO_SUBMIT status and settings isDraft to false', async () => {
        const submissionId = ObjectId();
        const { createRequestSubmission } = await createSurvey(['string']);
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            isDraft: true,
            creator: memberUser._id.toString(),
            status: [
              {
                type: 'READY_TO_SUBMIT',
                value: { at: new Date('2021-01-01').toISOString() },
              },
            ],
          }),
        });

        await request(testApp)
          .post('/api/submissions')
          .set('Authorization', memberAuthHeaderValue)
          .send(requestSubmission)
          .expect(200);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(submission).not.toBeNull();
        expect(submission.meta.status).not.toContainEqual(
          expect.objectContaining({ type: 'READY_TO_SUBMIT' })
        );
        expect(submission.meta.isDraft).toBe(false);
      });

      it('rejects the request if the submission does not have a READY_TO_SUBMIT status', async () => {
        const submissionId = ObjectId();
        const { createRequestSubmission } = await createSurvey(['string']);
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            isDraft: true,
            creator: memberUser._id.toString(),
            status: [],
          }),
        });

        await request(testApp)
          .post('/api/submissions')
          .set('Authorization', memberAuthHeaderValue)
          .send(requestSubmission)
          .expect(422);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(submission).toBeNull();
      });

      describe('when survey.meta.submissions is "public"', () => {
        let createRequestSubmission;
        let submissionId;
        beforeEach(async () => {
          submissionId = ObjectId();
          ({ createRequestSubmission } = await createSurvey(['string'], {
            meta: createSurveyMeta({ submissions: 'public' }),
          }));
        });

        it('and the requesting user is not logged in, OK', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: null,
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
            }),
          });

          await request(testApp).post('/api/submissions').send(requestSubmission).expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
        });

        it('and the requesting user is logged in, OK', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', memberAuthHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
        });
      });

      describe('when survey.meta.submissions is "group"', () => {
        let createRequestSubmission;
        let submissionId;
        beforeEach(async () => {
          submissionId = ObjectId();
          ({ createRequestSubmission } = await createSurvey(['string'], {
            meta: createSurveyMeta({
              submissions: 'group',
              group: createSurveyMetaGroup({ id: group._id, path: group.path }),
            }),
          }));
        });

        it('and the requesting user is not logged in, 401', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: null,
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
            }),
          });

          await request(testApp).post('/api/submissions').send(requestSubmission).expect(401);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).toBeNull();
        });

        it('and requesting user is not a member of the group, 401', async () => {
          const anotherGroup = await createGroup();
          const anotherGroupUserToken = 'another-group-user-token';
          const { user: anotherGroupUser } = await anotherGroup.createUserMember({
            userOverrides: { token: anotherGroupUserToken },
          });
          const anotherGroupUserAuthHeaderValue = `${anotherGroupUser.email} ${anotherGroupUserToken}`;
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: anotherGroupUser._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', anotherGroupUserAuthHeaderValue)
            .send(requestSubmission)
            .expect(401);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).toBeNull();
        });

        it('and requesting user is a member of the group but not an admin, OK', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', memberAuthHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
        });

        it('and requesting user is an admin of the group, OK', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: adminUser._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', adminAuthHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
        });

        it('and the request submission has a different group than the survey, 401', async () => {
          const subGroup = await group.createSubGroup({ name: 'subGroup' });
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: adminUser._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
              group: { id: subGroup._id.toString(), path: subGroup.path },
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', adminAuthHeaderValue)
            .send(requestSubmission)
            .expect(401);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).toBeNull();
        });
      });

      describe('when survey.meta.submissions is "groupAndDescendants"', () => {
        let createRequestSubmission;
        let submissionId;
        let subGroupMember;
        let subGroupAdmin;
        let subGroupMemberAuthHeaderValue;
        let subGroupAdminAuthHeaderValue;
        let subGroup;
        beforeEach(async () => {
          const subGroupMemberToken = 'sub-group-member-token';
          const subGroupAdminToken = 'sub-group-admin-token';
          subGroup = await group.createSubGroup({ name: 'subGroup' });
          ({ user: subGroupMember } = await subGroup.createUserMember({
            userOverrides: { token: subGroupMemberToken },
          }));
          ({ user: subGroupAdmin } = await subGroup.createAdminMember({
            userOverrides: { token: subGroupAdminToken },
          }));
          subGroupMemberAuthHeaderValue = `${subGroupMember.email} ${subGroupMemberToken}`;
          subGroupAdminAuthHeaderValue = `${subGroupAdmin.email} ${subGroupAdminToken}`;
          submissionId = ObjectId();
          ({ createRequestSubmission } = await createSurvey(['string'], {
            meta: createSurveyMeta({
              submissions: 'groupAndDescendants',
              group: createSurveyMetaGroup({ id: group._id, path: group.path }),
            }),
          }));
        });

        it('and the requesting user is not logged in, 401', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: null,
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
            }),
          });

          await request(testApp).post('/api/submissions').send(requestSubmission).expect(401);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).toBeNull();
        });

        it('and the requesting user is not a member of the group or its descendants, 401', async () => {
          const anotherGroup = await createGroup();
          const anotherGroupUserToken = 'another-group-user-token';
          const { user: anotherGroupUser } = await anotherGroup.createUserMember({
            userOverrides: { token: anotherGroupUserToken },
          });
          const anotherGroupUserAuthHeaderValue = `${anotherGroupUser.email} ${anotherGroupUserToken}`;
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: anotherGroupUser._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', anotherGroupUserAuthHeaderValue)
            .send(requestSubmission)
            .expect(401);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).toBeNull();
        });

        it('and the requesting user is a member of a descendant group but not an admin, and is submitting to the descendant group, OK', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: subGroupMember._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
              group: { id: subGroup._id.toString(), path: subGroup.path },
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', subGroupMemberAuthHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
        });

        it('and the requesting user is a member of a descendant group but not an admin, and is submitting to an ancestor group they do not belong to, 401', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: subGroupMember._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', subGroupMemberAuthHeaderValue)
            .send(requestSubmission)
            .expect(401);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).toBeNull();
        });

        it('and the requesting user is an admin of a descendant group, and is submitting to an ancestor group they do not belong to, 401', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: subGroupAdmin._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', subGroupAdminAuthHeaderValue)
            .send(requestSubmission)
            .expect(401);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).toBeNull();
        });

        it('and the requesting user is an admin of a descendant group, and is submitting to the descendant group, OK', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: subGroupAdmin._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
              group: { id: subGroup._id.toString(), path: subGroup.path },
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', subGroupAdminAuthHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
        });

        it('and the requesting user is a member of the survey group but not an admin, and is submitting to the survey group, OK', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', memberAuthHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
        });

        it('and the requesting user is a member of the survey group but not an admin, and is submitting to a descendant group, 401', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: memberUser._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
              group: { id: subGroup._id.toString(), path: subGroup.path },
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', memberAuthHeaderValue)
            .send(requestSubmission)
            .expect(401);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).toBeNull();
        });

        it('and the requesting user is an admin of the survey group, and is submitting to the survey group, OK', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: adminUser._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', adminAuthHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
        });

        it('and the requesting user is an admin of the survey group, and is submitting to a descendant group, OK', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: adminUser._id.toString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-01').toISOString() },
                },
              ],
              group: { id: subGroup._id.toString(), path: subGroup.path },
            }),
          });

          await request(testApp)
            .post('/api/submissions')
            .set('Authorization', adminAuthHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(submission).not.toBeNull();
        });
      });
    });
  });

  describe('updateSubmission', () => {
    const memberToken = 'member-token';
    const adminToken = 'admin-token';
    let memberUser;
    let adminUser;
    let memberAuthHeaderValue;
    let adminAuthHeaderValue;
    let group;
    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token: memberToken },
      }));
      ({ user: adminUser } = await group.createAdminMember({
        userOverrides: { token: adminToken },
      }));
      memberAuthHeaderValue = `${memberUser.email} ${memberToken}`;
      adminAuthHeaderValue = `${adminUser.email} ${adminToken}`;
    });

    it('removes READY_TO_SUBMIT status from the submission before updating it, and returns 200', async () => {
      const submissionId = ObjectId();
      const { createRequestSubmission, createSubmission } = await createSurvey(['string']);
      await createSubmission({
        _id: submissionId,
        meta: createSubmissionMeta({ isDraft: false, creator: memberUser._id }),
      });
      const requestSubmission = createRequestSubmission({
        _id: submissionId.toString(),
        meta: createRequestSubmissionMeta({
          isDraft: false,
          creator: memberUser._id.toString(),
          dateModified: new Date('2021-01-01').toISOString(),
          status: [
            {
              type: 'READY_TO_SUBMIT',
              value: { at: new Date('2021-01-01').toISOString() },
            },
          ],
        }),
      });

      await request(testApp)
        .put(`/api/submissions/${submissionId.toString()}`)
        .set('Authorization', memberAuthHeaderValue)
        .send(requestSubmission)
        .expect(200);

      const submission = await db.collection('submissions').findOne({ _id: submissionId });
      expect(submission).not.toBeNull();
      expect(submission.meta.dateModified.toISOString()).toEqual(
        requestSubmission.meta.dateModified
      );
      expect(submission.meta.status).not.toContainEqual(
        expect.objectContaining({ type: 'READY_TO_SUBMIT' })
      );
    });

    it('migrates submissions with specVersion 3 to specVersion 4 before updating', async () => {
      const submissionId = ObjectId();
      const { createRequestSubmission, createSubmission } = await createSurvey(['string']);
      const submissionMeta = createSubmissionMeta(
        { creator: memberUser._id, specVersion: 3 },
        { omitIsDeletedDraft: true, omitIsDraft: true }
      );
      const { submission: createdSubmission } = await createSubmission({
        _id: submissionId,
        meta: submissionMeta,
      });
      const requestSubmissionMeta = createRequestSubmissionMeta(
        {
          creator: memberUser._id.toString(),
          dateModified: new Date('2021-01-01').toISOString(),
          dateSubmitted: createdSubmission.meta.dateSubmitted,
          specVersion: 3,
        },
        { omitIsDeletedDraft: true, omitIsDraft: true }
      );
      const requestSubmission = createRequestSubmission({
        _id: submissionId.toString(),
        meta: requestSubmissionMeta,
      });

      await request(testApp)
        .put(`/api/submissions/${submissionId.toString()}`)
        .set('Authorization', memberAuthHeaderValue)
        .send(requestSubmission)
        .expect(200);

      const submission = await db.collection('submissions').findOne({ _id: submissionId });
      expect(submission).not.toBeNull();
      expect(submission.meta.dateModified.toISOString()).toEqual(
        requestSubmission.meta.dateModified
      );
      expect(submission.meta.specVersion).toBe(4);
    });

    it('rejects the request when the submission is a draft', async () => {
      const submissionId = ObjectId();
      const { createRequestSubmission, createSubmission } = await createSurvey(['string']);
      const { submission: existingSubmission } = await createSubmission({
        _id: submissionId,
        meta: createSubmissionMeta({
          creator: memberUser._id,
          isDraft: false,
          dateModified: new Date('2024-01-01'),
        }),
      });
      const requestSubmission = createRequestSubmission({
        _id: submissionId.toString(),
        meta: createRequestSubmissionMeta({
          creator: memberUser._id.toString(),
          isDraft: true,
          dateModified: new Date('2024-01-02'),
        }),
      });

      await request(testApp)
        .put(`/api/submissions/${submissionId.toString()}`)
        .set('Authorization', memberAuthHeaderValue)
        .send(requestSubmission)
        .expect(422);

      const submission = await db.collection('submissions').findOne({ _id: submissionId });
      expect(submission).not.toBeNull();
      expect(submission.meta.dateModified).toEqual(existingSubmission.meta.dateModified);
    });

    it('rejects the request when the existing submission in the db is a draft', async () => {
      const submissionId = ObjectId();
      const { createRequestSubmission, createSubmission } = await createSurvey(['string']);
      const { submission: existingSubmission } = await createSubmission({
        _id: submissionId,
        meta: createSubmissionMeta({
          creator: memberUser._id,
          isDraft: true,
          dateModified: new Date('2024-01-01'),
        }),
      });
      const requestSubmission = createRequestSubmission({
        _id: submissionId.toString(),
        meta: createRequestSubmissionMeta({
          creator: memberUser._id.toString(),
          isDraft: false,
          dateModified: new Date('2024-01-02'),
        }),
      });

      await request(testApp)
        .put(`/api/submissions/${submissionId.toString()}`)
        .set('Authorization', memberAuthHeaderValue)
        .send(requestSubmission)
        .expect(409);

      const submission = await db.collection('submissions').findOne({ _id: submissionId });
      expect(submission).not.toBeNull();
      expect(submission.meta.dateModified).toEqual(existingSubmission.meta.dateModified);
    });

    describe('when survey.meta.submissions is "public"', () => {
      let createRequestSubmission;
      let postSubmission;
      let submissionId;
      let createSubmissionDoc;
      beforeEach(async () => {
        submissionId = ObjectId();
        ({ postSubmission, createRequestSubmission, createSubmissionDoc } = await createSurvey(
          ['string'],
          {
            meta: createSurveyMeta({
              submissions: 'public',
              group: createSurveyMetaGroup({ id: group._id, path: group.path }),
            }),
          }
        ));
      });

      it('and the requesting user is not logged in, 401', async () => {
        await postSubmission({
          submissionId: submissionId.toString(),
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: null,
            dateModified: new Date('2021-01-02').toISOString(),
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .send(requestSubmission)
          .expect(401);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).not.toEqual(
          submission.meta.dateModified.toISOString()
        );
      });

      it('and the requesting user is a member of the submission group but not the creator, 401', async () => {
        await postSubmission({
          submissionId: submissionId.toString(),
          creator: adminUser._id.toString(),
          authHeaderValue: adminAuthHeaderValue,
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: memberUser._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .set('Authorization', memberAuthHeaderValue)
          .send(requestSubmission)
          .expect(401);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).not.toEqual(
          submission.meta.dateModified.toISOString()
        );
      });

      it('and the requesting user is the creator, OK', async () => {
        await postSubmission({
          submissionId: submissionId.toString(),
          creator: memberUser._id.toString(),
          authHeaderValue: memberAuthHeaderValue,
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: memberUser._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .set('Authorization', memberAuthHeaderValue)
          .send(requestSubmission)
          .expect(200);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).toEqual(
          submission.meta.dateModified.toISOString()
        );
      });

      it('and the requesting user is an admin of the submission group, OK', async () => {
        await postSubmission({
          submissionId: submissionId.toString(),
          creator: memberUser._id.toString(),
          authHeaderValue: memberAuthHeaderValue,
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: memberUser._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .set('Authorization', adminAuthHeaderValue)
          .send(requestSubmission)
          .expect(200);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).toEqual(
          submission.meta.dateModified.toISOString()
        );
      });

      // The app used to allow submitting to a different group than the survey group, but this is no longer allowed.
      // However, the app still needs to allow resubmitting existing submissions in this state, as long as the group isn't being changed.
      it('and the request submission has a different group than the survey, but the group is not being changed, OK', async () => {
        const anotherGroup = await createGroup();
        const submissionDoc = createSubmissionDoc({
          _id: submissionId,
          meta: createSubmissionMeta({
            group: { id: anotherGroup._id, path: anotherGroup.path },
            creator: memberUser._id,
          }),
        });
        await db.collection('submissions').insertOne(submissionDoc);
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: memberUser._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
            group: { id: anotherGroup._id.toString(), path: anotherGroup.path },
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .set('Authorization', memberAuthHeaderValue)
          .send(requestSubmission)
          .expect(200);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).toEqual(
          submission.meta.dateModified.toISOString()
        );
      });
    });

    describe('when survey.meta.submissions is "group"', () => {
      let createRequestSubmission;
      let postSubmission;
      let submissionId;
      beforeEach(async () => {
        submissionId = ObjectId();
        ({ postSubmission, createRequestSubmission } = await createSurvey(['string'], {
          meta: createSurveyMeta({
            submissions: 'group',
            group: createSurveyMetaGroup({ id: group._id, path: group.path }),
          }),
        }));
      });

      it('and the requesting user is not logged in, 401', async () => {
        await postSubmission({
          submissionId: submissionId.toString(),
          creator: memberUser._id.toString(),
          authHeaderValue: memberAuthHeaderValue,
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: null,
            dateModified: new Date('2021-01-02').toISOString(),
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .send(requestSubmission)
          .expect(401);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).not.toEqual(
          submission.meta.dateModified.toISOString()
        );
      });

      it('and the requesting user is not a member of the group and not the creator, 401', async () => {
        const anotherGroup = await createGroup();
        const anotherGroupUserToken = 'another-group-user-token';
        const { user: anotherGroupUser } = await anotherGroup.createUserMember({
          userOverrides: { token: anotherGroupUserToken },
        });
        const anotherGroupUserAuthHeaderValue = `${anotherGroupUser.email} ${anotherGroupUserToken}`;
        await postSubmission({
          submissionId: submissionId.toString(),
          creator: memberUser._id.toString(),
          authHeaderValue: memberAuthHeaderValue,
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: anotherGroupUser._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .set('Authorization', anotherGroupUserAuthHeaderValue)
          .send(requestSubmission)
          .expect(401);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).not.toEqual(
          submission.meta.dateModified.toISOString()
        );
      });

      it('and the requesting user is a member of the submission group but not the creator, 401', async () => {
        await postSubmission({
          submissionId: submissionId.toString(),
          creator: adminUser._id.toString(),
          authHeaderValue: adminAuthHeaderValue,
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: adminUser._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .set('Authorization', memberAuthHeaderValue)
          .send(requestSubmission)
          .expect(401);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).not.toEqual(
          submission.meta.dateModified.toISOString()
        );
      });

      it('and the requesting user is the creator, OK', async () => {
        await postSubmission({
          submissionId: submissionId.toString(),
          creator: memberUser._id.toString(),
          authHeaderValue: memberAuthHeaderValue,
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: memberUser._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .set('Authorization', memberAuthHeaderValue)
          .send(requestSubmission)
          .expect(200);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).toEqual(
          submission.meta.dateModified.toISOString()
        );
      });

      it('and the requesting user is an admin of the submission group, OK', async () => {
        await postSubmission({
          submissionId: submissionId.toString(),
          creator: memberUser._id.toString(),
          authHeaderValue: memberAuthHeaderValue,
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: memberUser._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .set('Authorization', adminAuthHeaderValue)
          .send(requestSubmission)
          .expect(200);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).toEqual(
          submission.meta.dateModified.toISOString()
        );
      });

      it('and the request submission has a different group than the survey, 401', async () => {
        const subGroup = await group.createSubGroup({ name: 'subGroup' });
        await postSubmission({
          submissionId: submissionId.toString(),
          creator: adminUser._id.toString(),
          authHeaderValue: adminAuthHeaderValue,
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: adminUser._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
            group: { id: subGroup._id.toString(), path: subGroup.path },
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .set('Authorization', adminAuthHeaderValue)
          .send(requestSubmission)
          .expect(401);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).not.toEqual(
          submission.meta.dateModified.toISOString()
        );
      });
    });

    describe('when survey.meta.submissions is "groupAndDescendants"', () => {
      let createRequestSubmission;
      let postSubmission;
      let createSubmissionDoc;
      let submissionId;
      let subGroupMember;
      let subGroupAdmin;
      let subGroupMemberAuthHeaderValue;
      let subGroupAdminAuthHeaderValue;
      let subGroup;
      beforeEach(async () => {
        const subGroupMemberToken = 'sub-group-member-token';
        const subGroupAdminToken = 'sub-group-admin-token';
        subGroup = await group.createSubGroup({ name: 'subGroup' });
        ({ user: subGroupMember } = await subGroup.createUserMember({
          userOverrides: { token: subGroupMemberToken },
        }));
        ({ user: subGroupAdmin } = await subGroup.createAdminMember({
          userOverrides: { token: subGroupAdminToken },
        }));
        subGroupMemberAuthHeaderValue = `${subGroupMember.email} ${subGroupMemberToken}`;
        subGroupAdminAuthHeaderValue = `${subGroupAdmin.email} ${subGroupAdminToken}`;
        submissionId = ObjectId();
        ({ postSubmission, createRequestSubmission, createSubmissionDoc } = await createSurvey(
          ['string'],
          {
            meta: createSurveyMeta({
              submissions: 'groupAndDescendants',
              group: createSurveyMetaGroup({ id: group._id, path: group.path }),
            }),
          }
        ));
      });

      describe('and the existing submission is in a group that the requesting user is not a member of', () => {
        beforeEach(async () => {
          const submissionDoc = createSubmissionDoc({
            _id: submissionId,
            meta: createSubmissionMeta({
              group: { id: group._id, path: group.path },
              creator: subGroupMember._id,
            }),
          });
          await db.collection('submissions').insertOne(submissionDoc);
        });

        it('if the requesting user is the creator, 401', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              creator: subGroupMember._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
            }),
          });

          await request(testApp)
            .put(`/api/submissions/${submissionId.toString()}`)
            .set('Authorization', subGroupMemberAuthHeaderValue)
            .send(requestSubmission)
            .expect(401);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(requestSubmission.meta.dateModified).not.toEqual(
            submission.meta.dateModified.toISOString()
          );
        });

        it('if the requesting user is not the creator, 401', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              creator: subGroupAdmin._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
            }),
          });

          await request(testApp)
            .put(`/api/submissions/${submissionId.toString()}`)
            .set('Authorization', subGroupAdminAuthHeaderValue)
            .send(requestSubmission)
            .expect(401);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(requestSubmission.meta.dateModified).not.toEqual(
            submission.meta.dateModified.toISOString()
          );
        });
      });

      describe('and the existing submission is in a group that the requesting user is a member of', () => {
        beforeEach(async () => {
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: subGroupMember._id.toString(),
            authHeaderValue: subGroupMemberAuthHeaderValue,
            group: { id: subGroup._id.toString(), path: subGroup.path },
          });
        });

        it('if the requesting user is the creator, OK', async () => {
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              creator: subGroupMember._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              group: { id: subGroup._id.toString(), path: subGroup.path },
            }),
          });

          await request(testApp)
            .put(`/api/submissions/${submissionId.toString()}`)
            .set('Authorization', subGroupMemberAuthHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(requestSubmission.meta.dateModified).toEqual(
            submission.meta.dateModified.toISOString()
          );
        });

        it('if the requesting user is not the creator, 401', async () => {
          const subGroupMember2Token = 'sub-group-member-2-token';
          const subGroupMember2 = await subGroup.createUserMember({
            userOverrides: { token: subGroupMember2Token },
          });
          const subGroupMember2AuthHeaderValue = `${subGroupMember2.email} ${subGroupMember2Token}`;
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              creator: subGroupMember._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              group: { id: subGroup._id.toString(), path: subGroup.path },
            }),
          });

          await request(testApp)
            .put(`/api/submissions/${submissionId.toString()}`)
            .set('Authorization', subGroupMember2AuthHeaderValue)
            .send(requestSubmission)
            .expect(401);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(requestSubmission.meta.dateModified).not.toEqual(
            submission.meta.dateModified.toISOString()
          );
        });
      });

      describe('and the existing submission is in a group that the requesting user is an admin of', () => {
        it('OK', async () => {
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: subGroupMember._id.toString(),
            authHeaderValue: subGroupMemberAuthHeaderValue,
            group: { id: subGroup._id.toString(), path: subGroup.path },
          });
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              creator: subGroupMember._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              group: { id: subGroup._id.toString(), path: subGroup.path },
            }),
          });

          await request(testApp)
            .put(`/api/submissions/${submissionId.toString()}`)
            .set('Authorization', subGroupAdminAuthHeaderValue)
            .send(requestSubmission)
            .expect(200);

          const submission = await db.collection('submissions').findOne({ _id: submissionId });
          expect(requestSubmission.meta.dateModified).toEqual(
            submission.meta.dateModified.toISOString()
          );
        });
      });

      it('and the requesting user is not logged in, 401', async () => {
        await postSubmission({
          submissionId: submissionId.toString(),
          creator: subGroupMember._id.toString(),
          authHeaderValue: subGroupMemberAuthHeaderValue,
          group: { id: subGroup._id.toString(), path: subGroup.path },
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: subGroupMember._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
            group: { id: subGroup._id.toString(), path: subGroup.path },
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .send(requestSubmission)
          .expect(401);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).not.toEqual(
          submission.meta.dateModified.toISOString()
        );
      });

      it('and the requesting user is not a member of the group or its descendants, 401', async () => {
        const anotherGroup = await createGroup();
        const anotherGroupUserToken = 'another-group-user-token';
        const { user: anotherGroupUser } = await anotherGroup.createAdminMember({
          userOverrides: { token: anotherGroupUserToken },
        });
        const anotherGroupUserAuthHeaderValue = `${anotherGroupUser.email} ${anotherGroupUserToken}`;
        await postSubmission({
          submissionId: submissionId.toString(),
          creator: subGroupMember._id.toString(),
          authHeaderValue: subGroupMemberAuthHeaderValue,
          group: { id: subGroup._id.toString(), path: subGroup.path },
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: subGroupMember._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
            group: { id: anotherGroup._id.toString(), path: anotherGroup.path },
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .set('Authorization', anotherGroupUserAuthHeaderValue)
          .send(requestSubmission)
          .expect(401);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).not.toEqual(
          submission.meta.dateModified.toISOString()
        );
      });

      it('and the requesting user is not a member of the group or its descendants but is the creator, 401', async () => {
        const anotherGroup = await createGroup();
        const anotherGroupUserToken = 'another-group-user-token';
        const { user: anotherGroupUser } = await anotherGroup.createAdminMember({
          userOverrides: { token: anotherGroupUserToken },
        });
        const anotherGroupUserAuthHeaderValue = `${anotherGroupUser.email} ${anotherGroupUserToken}`;
        const submissionDoc = createSubmissionDoc({
          _id: submissionId,
          meta: createSubmissionMeta({
            group: { id: subGroup._id, path: subGroup.path },
            creator: anotherGroupUser._id,
          }),
        });
        await db.collection('submissions').insertOne(submissionDoc);
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: anotherGroupUser._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
            group: { id: subGroup._id.toString(), path: subGroup.path },
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .set('Authorization', anotherGroupUserAuthHeaderValue)
          .send(requestSubmission)
          .expect(401);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).not.toEqual(
          submission.meta.dateModified.toISOString()
        );
      });

      it('and the request submission has a group outside of the survey group and its descendants, 401', async () => {
        const anotherGroup = await createGroup({ name: 'Another Group' });
        await postSubmission({
          submissionId: submissionId.toString(),
          creator: subGroupMember._id.toString(),
          authHeaderValue: subGroupMemberAuthHeaderValue,
          group: { id: subGroup._id.toString(), path: subGroup.path },
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({
            creator: subGroupMember._id.toString(),
            dateModified: new Date('2021-01-02').toISOString(),
            group: { id: anotherGroup._id.toString(), path: anotherGroup.path },
          }),
        });

        await request(testApp)
          .put(`/api/submissions/${submissionId.toString()}`)
          .set('Authorization', subGroupMemberAuthHeaderValue)
          .send(requestSubmission)
          .expect(401);

        const submission = await db.collection('submissions').findOne({ _id: submissionId });
        expect(requestSubmission.meta.dateModified).not.toEqual(
          submission.meta.dateModified.toISOString()
        );
      });
    });
  });

  describe('getSubmissionsCsv', () => {
    describe('controller tests', () => {
      it('returns expected CSV for geojson question type', async () => {
        const { survey, createSubmission } = await createSurvey(['geoJSON']);
        const { submission } = await createSubmission();
        const mockReq = createReq({ query: { showCsvMeta: 'true', survey: survey._id } });
        const mockRes = await createRes();
        await getSubmissionsCsv(mockReq, mockRes);
        const expected =
          ',,,,,,,,,,,,,,,,,,Map 1,Map 1\r\n,,,,,,,,,,,,,,,,,,,\r\n,,,,,,,,,,,,,,,,,,map_1,map_1\r\n,,,,,,,,,,,,,,,,,,,\r\n_id,meta.isDraft,meta.isDeletedDraft,meta.dateCreated,meta.dateModified,meta.dateSubmitted,meta.survey.id,meta.survey.name,meta.survey.version,meta.revision,meta.archived,meta.permissions,meta.status,meta.group.id,meta.group.path,meta.specVersion,meta.creator,meta.permanentResults,data.map_1.features.0,data.map_1.type\r\n' +
          `${submission._id},` +
          `false,` +
          `false,` +
          `${new Date(submission.meta.dateCreated).toISOString()},` +
          `${new Date(submission.meta.dateModified).toISOString()},` +
          `${new Date(submission.meta.dateSubmitted).toISOString()},` +
          `${submission.meta.survey.id},Mock Survey Name,` +
          `2,1,false,,,` +
          `${submission.meta.group.id},` +
          `${submission.meta.group.path},4,` +
          `${submission.meta.creator},` +
          `,"{""type"":""Feature"",""geometry"":{""type"":""Polygon"",""coordinates"":[[[-79.39869321685993,43.65614580273717],[-79.39799841596073,43.6460912513611],[-79.37263818314015,43.645085703645464],[-79.3698589795434,43.657653840263464],[-79.39869321685993,43.65614580273717]]]},""properties"":null,""id"":""measureFeature0""}",FeatureCollection`;
        expect(mockRes.send).toHaveBeenCalledWith(expected);
      });
    });

    describe('endpoint tests', () => {
      const token = '1234';
      let authHeaderValue;
      let group;
      let memberUser;
      beforeEach(async () => {
        group = await createGroup();
        ({ user: memberUser } = await group.createUserMember({
          userOverrides: { token },
        }));
        authHeaderValue = `${memberUser.email} ${token}`;
      });

      it('does not return drafts', async () => {
        const { createSubmission, survey } = await createSurvey(['string']);
        const [{ submission }, { submission: draft }] = await Promise.all([
          createSubmission({
            _id: new ObjectId(),
            meta: createSubmissionMeta({ isDraft: false, creator: memberUser._id }),
          }),
          createSubmission({
            _id: new ObjectId(),
            meta: createSubmissionMeta({ isDraft: true, creator: memberUser._id }),
          }),
        ]);

        const response = await request(testApp)
          .get(`/api/submissions/csv?showCsvMeta=true&survey=${survey._id}`)
          .set('Authorization', authHeaderValue)
          .send()
          .expect(200);

        expect(response.text).toContain(submission._id.toString());
        expect(response.text).not.toContain(draft._id.toString());
      });
    });
  });

  describe('getSubmissionPdf', () => {
    const token = '1234';
    let authHeaderValue;
    let group;
    let memberUser;
    let createSubmission;

    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token },
      }));
      authHeaderValue = `${memberUser.email} ${token}`;
      ({ createSubmission } = await createSurvey(['instructions', 'string', 'ontology']));
    });

    it('should return 409 if the submission is a draft', async () => {
      const { submission } = await createSubmission({
        _id: new ObjectId(),
        meta: createSubmissionMeta({ creator: memberUser._id, isDraft: true }),
      });

      await request(testApp)
        .get(`/api/submissions/${submission._id}/pdf?base64=1`)
        .set('Authorization', authHeaderValue)
        .send()
        .expect(409);
    });

    it('should return PDF base64 when `base64=1` if success', async () => {
      const { submission } = await createSubmission({
        _id: new ObjectId(),
        meta: createSubmissionMeta({ creator: memberUser._id }),
      });

      const response = await request(testApp)
        .get(`/api/submissions/${submission._id}/pdf?base64=1`)
        .set('Authorization', authHeaderValue)
        .send()
        .expect(200);

      expect(response.type).toEqual('application/pdf');
      expect(response._body.toString('utf-8', 0, 'data:application/pdf;base64'.length)).toEqual(
        'data:application/pdf;base64'
      );
      expect(response.headers).toHaveProperty(
        'content-disposition',
        expect.stringContaining('attachment; filename="Mock Survey Name')
      );
    });

    it('should return PDF buffer when `base64=0` if success', async () => {
      const { submission } = await createSubmission({
        _id: new ObjectId(),
        meta: createSubmissionMeta({ creator: memberUser._id }),
      });

      const response = await request(testApp)
        .get(`/api/submissions/${submission._id}/pdf?base64=0`)
        .set('Authorization', authHeaderValue)
        .send()
        .expect(200);

      expect(response.type).toEqual('application/pdf');
      expect(response._body.toString('utf-8', 0, 'data:application/pdf;base64'.length)).not.toEqual(
        'data:application/pdf;base64'
      );
      expect(response.headers).toHaveProperty(
        'content-disposition',
        expect.stringContaining('attachment; filename="Mock Survey Name')
      );
    });

    it('returns 404 when a submission with the specified id does not exist', async () => {
      await request(testApp)
        .get(`/api/submissions/${new ObjectId()}/pdf?base64=1`)
        .set('Authorization', authHeaderValue)
        .send()
        .expect(404);
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
      submission.meta.group = undefined; //make the pdf generation fail by removing the group information
      const req = createReq({ body: { survey, submission }, query: { base64: '1' } });
      const res = await createRes({
        user: { _id: submission.meta.creator, permissions: [] },
      });

      await expect(postSubmissionPdf(req, res)).rejects.toThrow();
    });
  });

  describe('sendPdfLink', () => {
    const token = '1234';
    let authHeaderValue;
    let group;
    let memberUser;
    let createSubmission;

    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token },
      }));
      authHeaderValue = `${memberUser.email} ${token}`;
      ({ createSubmission } = await createSurvey(['string']));
    });

    it('returns 409 when the submission is a draft', async () => {
      const { submission } = await createSubmission({
        meta: createSubmissionMeta({ isDraft: true }),
      });

      await request(testApp)
        .post(`/api/submissions/${submission._id}/send-email`)
        .set('Authorization', authHeaderValue)
        .send()
        .expect(409);
    });

    it('should send email correctly if success', async () => {
      const { submission } = await createSubmission();

      await request(testApp)
        .post(`/api/submissions/${submission._id}/send-email`)
        .set('Authorization', authHeaderValue)
        .send()
        .expect(200);

      expect(mailService.sendLink).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@surveystack.io',
          to: memberUser.email,
          subject: 'Survey report - Mock Survey Name',
          link: expect.stringContaining(`/api/submissions/${submission._id}/pdf`),
        })
      );
      expect(mailService.sendLink).toHaveBeenCalledTimes(1);
    });

    it('should throw error if not found submission', async () => {
      await request(testApp)
        .post(`/api/submissions/${new ObjectId()}/send-email`)
        .set('Authorization', authHeaderValue)
        .send()
        .expect(404);

      expect(mailService.sendLink).not.toHaveBeenCalled();
    });
  });

  describe('archiveSubmissions', () => {
    const memberToken = 'member-token';
    const adminToken = 'admin-token';
    let memberAuthHeaderValue;
    let adminAuthHeaderValue;
    let group;
    let memberUser;
    let adminUser;
    let createSubmission;
    let postSubmission;

    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token: memberToken },
      }));
      ({ user: adminUser } = await group.createAdminMember({
        userOverrides: { token: adminToken },
      }));
      memberAuthHeaderValue = `${memberUser.email} ${memberToken}`;
      adminAuthHeaderValue = `${adminUser.email} ${adminToken}`;
      ({ createSubmission, postSubmission } = await createSurvey(['string'], {
        meta: createSurveyMeta({
          group: createSurveyMetaGroup({ id: group._id, path: group.path }),
        }),
      }));
    });

    describe('/submissions/:id/archive', () => {
      it('returns 409 if the existing submission is a draft', async () => {
        const { createSubmission } = await createSurvey(['string']);
        const { submission: existingSubmission } = await createSubmission({
          _id: new ObjectId(),
          meta: createSubmissionMeta({
            isDraft: true,
            isDeletedDraft: false,
            creator: memberUser._id,
          }),
        });

        await request(testApp)
          .post(`/api/submissions/${existingSubmission._id}/archive`)
          .set('Authorization', memberAuthHeaderValue)
          .send()
          .expect(409);

        const submission = await db
          .collection('submissions')
          .findOne({ _id: existingSubmission._id });
        expect(submission).not.toBeNull();
        expect(submission.meta.archived).toBe(false);
      });

      describe('when the submission is in a group that the requesting user is a member of', () => {
        it('and the requesting user is the creator, OK', async () => {
          const submissionId = new ObjectId();
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });

          await request(testApp)
            .post(`/api/submissions/${submissionId.toString()}/archive`)
            .set('Authorization', memberAuthHeaderValue)
            .send()
            .expect(200);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          expect(existingSubmission).toHaveProperty('meta.archived', true);
        });

        it('and the requesting user is an admin of the group, OK', async () => {
          const submissionId = new ObjectId();
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });

          await request(testApp)
            .post(`/api/submissions/${submissionId.toString()}/archive`)
            .set('Authorization', adminAuthHeaderValue)
            .send()
            .expect(200);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          expect(existingSubmission).toHaveProperty('meta.archived', true);
        });

        it('and the requesting user is not the creator, 401', async () => {
          const submissionId = new ObjectId();
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: adminUser._id,
            authHeaderValue: adminAuthHeaderValue,
          });

          await request(testApp)
            .post(`/api/submissions/${submissionId.toString()}/archive`)
            .set('Authorization', memberAuthHeaderValue)
            .send()
            .expect(401);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          expect(existingSubmission).toHaveProperty('meta.archived', false);
        });
      });

      describe('when the submission is in a group that the requesting user is not a member of', () => {
        it('and the requesting user is the creator, OK', async () => {
          const submissionId = new ObjectId();
          const anotherGroup = await createGroup();
          await createSubmission({
            _id: submissionId,
            meta: createSubmissionMeta({
              creator: memberUser._id,
              group: { id: anotherGroup._id, path: anotherGroup.path },
            }),
          });

          await request(testApp)
            .post(`/api/submissions/${submissionId.toString()}/archive`)
            .set('Authorization', memberAuthHeaderValue)
            .send()
            .expect(200);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          expect(existingSubmission).toHaveProperty('meta.archived', true);
        });

        it('and the requesting user is not the creator, 401', async () => {
          const submissionId = new ObjectId();
          const anotherGroup = await createGroup();
          await createSubmission({
            _id: submissionId,
            meta: createSubmissionMeta({
              creator: adminUser._id,
              group: { id: anotherGroup._id, path: anotherGroup.path },
            }),
          });

          await request(testApp)
            .post(`/api/submissions/${submissionId.toString()}/archive`)
            .set('Authorization', memberAuthHeaderValue)
            .send()
            .expect(401);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          expect(existingSubmission).toHaveProperty('meta.archived', false);
        });
      });
    });

    describe('/submissions/:id/bulk-archive', () => {
      it('returns 409 if any of the existing submissions are drafts', async () => {
        const { createSubmission } = await createSurvey(['string']);
        const { submission: existingDraft } = await createSubmission({
          _id: new ObjectId(),
          meta: createSubmissionMeta({
            isDraft: true,
            isDeletedDraft: false,
            creator: memberUser._id,
          }),
        });
        const { submission: existingSubmission } = await createSubmission({
          _id: new ObjectId(),
          meta: createSubmissionMeta({
            isDraft: false,
            isDeletedDraft: false,
            creator: memberUser._id,
          }),
        });

        await request(testApp)
          .post(`/api/submissions/bulk-archive`)
          .set('Authorization', memberAuthHeaderValue)
          .send({ ids: [existingDraft._id, existingSubmission._id] })
          .expect(409);

        const submission = await db
          .collection('submissions')
          .findOne({ _id: existingSubmission._id });
        const draft = await db.collection('submissions').findOne({ _id: existingDraft._id });
        expect(submission).not.toBeNull();
        expect(draft).not.toBeNull();
        expect(submission.meta.archived).toBe(false);
        expect(draft.meta.archived).toBe(false);
      });

      describe('when the submission is in a group that the requesting user is a member of', () => {
        it('and the requesting user is the creator, OK', async () => {
          const submissionId = new ObjectId();
          const submissionId2 = new ObjectId();
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });
          await postSubmission({
            submissionId: submissionId2.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });

          await request(testApp)
            .post('/api/submissions/bulk-archive')
            .set('Authorization', memberAuthHeaderValue)
            .send({ ids: [submissionId.toString(), submissionId2.toString()] })
            .expect(200);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          const existingSubmission2 = await db
            .collection('submissions')
            .findOne({ _id: submissionId2 });
          expect(existingSubmission).toHaveProperty('meta.archived', true);
          expect(existingSubmission2).toHaveProperty('meta.archived', true);
        });

        it('and the requesting user is an admin of the group, OK', async () => {
          const submissionId = new ObjectId();
          const submissionId2 = new ObjectId();
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });
          await postSubmission({
            submissionId: submissionId2.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });

          await request(testApp)
            .post('/api/submissions/bulk-archive')
            .set('Authorization', adminAuthHeaderValue)
            .send({ ids: [submissionId.toString(), submissionId2.toString()] })
            .expect(200);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          const existingSubmission2 = await db
            .collection('submissions')
            .findOne({ _id: submissionId2 });
          expect(existingSubmission).toHaveProperty('meta.archived', true);
          expect(existingSubmission2).toHaveProperty('meta.archived', true);
        });

        it('and the requesting user is not the creator of all submissions, 401 and archive nothing', async () => {
          const submissionId = new ObjectId();
          const submissionId2 = new ObjectId();
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });
          await postSubmission({
            submissionId: submissionId2.toString(),
            creator: adminUser._id,
            authHeaderValue: adminAuthHeaderValue,
          });

          await request(testApp)
            .post('/api/submissions/bulk-archive')
            .set('Authorization', memberAuthHeaderValue)
            .send({ ids: [submissionId.toString(), submissionId2.toString()] })
            .expect(401);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          const existingSubmission2 = await db
            .collection('submissions')
            .findOne({ _id: submissionId2 });
          expect(existingSubmission).toHaveProperty('meta.archived', false);
          expect(existingSubmission2).toHaveProperty('meta.archived', false);
        });
      });

      describe('when the submission is in a group that the requesting user is not a member of', () => {
        it('and the requesting user is the creator, OK', async () => {
          const submissionId = new ObjectId();
          const submissionId2 = new ObjectId();
          const anotherGroup = await createGroup();
          await createSubmission({
            _id: submissionId,
            meta: createSubmissionMeta({
              creator: memberUser._id,
              group: { id: anotherGroup._id, path: anotherGroup.path },
            }),
          });
          await createSubmission({
            _id: submissionId2,
            meta: createSubmissionMeta({
              creator: memberUser._id,
              group: { id: anotherGroup._id, path: anotherGroup.path },
            }),
          });

          await request(testApp)
            .post('/api/submissions/bulk-archive')
            .set('Authorization', memberAuthHeaderValue)
            .send({ ids: [submissionId.toString(), submissionId2.toString()] })
            .expect(200);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          const existingSubmission2 = await db
            .collection('submissions')
            .findOne({ _id: submissionId2 });
          expect(existingSubmission).toHaveProperty('meta.archived', true);
          expect(existingSubmission2).toHaveProperty('meta.archived', true);
        });

        it('and the requesting user is not the creator of all submissions, 401 and archive nothing', async () => {
          const submissionId = new ObjectId();
          const submissionId2 = new ObjectId();
          const anotherGroup = await createGroup();
          await createSubmission({
            _id: submissionId,
            meta: createSubmissionMeta({
              creator: memberUser._id,
              group: { id: anotherGroup._id, path: anotherGroup.path },
            }),
          });
          await createSubmission({
            _id: submissionId2,
            meta: createSubmissionMeta({
              creator: adminUser._id,
              group: { id: anotherGroup._id, path: anotherGroup.path },
            }),
          });

          await request(testApp)
            .post('/api/submissions/bulk-archive')
            .set('Authorization', memberAuthHeaderValue)
            .send({ ids: [submissionId.toString(), submissionId2.toString()] })
            .expect(401);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          const existingSubmission2 = await db
            .collection('submissions')
            .findOne({ _id: submissionId2 });
          expect(existingSubmission).toHaveProperty('meta.archived', false);
          expect(existingSubmission2).toHaveProperty('meta.archived', false);
        });
      });
    });
  });

  describe('reassignSubmission', () => {
    const token = '1234';
    let authHeaderValue;
    let group;
    let memberUser;
    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token },
      }));
      authHeaderValue = `${memberUser.email} ${token}`;
    });

    it('returns 409 if the existing submission is a draft', async () => {
      const { createSubmission } = await createSurvey(['string']);
      const { submission: existingSubmission } = await createSubmission({
        _id: new ObjectId(),
        meta: createSubmissionMeta({
          isDraft: true,
          isDeletedDraft: false,
          creator: memberUser._id,
        }),
      });

      await request(testApp)
        .post(`/api/submissions/${existingSubmission._id}/reassign`)
        .set('Authorization', authHeaderValue)
        .send({ group: new ObjectId().toString() })
        .expect(409);

      const submission = await db
        .collection('submissions')
        .findOne({ _id: existingSubmission._id });
      const archivedSubmission = await db
        .collection('submissions')
        .findOne({ 'meta.original': existingSubmission._id });
      expect(archivedSubmission).toBeNull();
      expect(submission).not.toBeNull();
      expect(submission.meta.archived).toBe(false);
    });
  });

  describe('bulkReassignSubmissions', () => {
    const token = '1234';
    let authHeaderValue;
    let group;
    let memberUser;
    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token },
      }));
      authHeaderValue = `${memberUser.email} ${token}`;
    });

    it('returns 409 if any of the existing submissions are drafts', async () => {
      const { createSubmission } = await createSurvey(['string']);
      const { submission: existingDraft } = await createSubmission({
        _id: new ObjectId(),
        meta: createSubmissionMeta({
          isDraft: true,
          isDeletedDraft: false,
          creator: memberUser._id,
        }),
      });
      const { submission: existingSubmission } = await createSubmission({
        _id: new ObjectId(),
        meta: createSubmissionMeta({
          isDraft: false,
          isDeletedDraft: false,
          creator: memberUser._id,
        }),
      });

      await request(testApp)
        .post(`/api/submissions/bulk-reassign`)
        .set('Authorization', authHeaderValue)
        .send({
          ids: [existingDraft._id, existingSubmission._id],
          creator: new ObjectId().toString(),
        })
        .expect(409);

      const submission = await db
        .collection('submissions')
        .findOne({ _id: existingSubmission._id });
      const draft = await db.collection('submissions').findOne({ _id: existingSubmission._id });
      const archivedSubmission = await db
        .collection('submissions')
        .findOne({ 'meta.original': existingSubmission._id });
      const archivedDraft = await db
        .collection('submissions')
        .findOne({ 'meta.original': existingSubmission._id });
      expect(archivedSubmission).toBeNull();
      expect(archivedDraft).toBeNull();
      expect(submission).not.toBeNull();
      expect(draft).not.toBeNull();
      expect(submission.meta.archived).toBe(false);
      expect(draft.meta.archived).toBe(false);
    });
  });

  describe('deleteSubmissions', () => {
    const memberToken = 'member-token';
    const adminToken = 'admin-token';
    let memberAuthHeaderValue;
    let adminAuthHeaderValue;
    let group;
    let memberUser;
    let adminUser;
    let createSubmission;
    let postSubmission;

    beforeEach(async () => {
      group = await createGroup();
      ({ user: memberUser } = await group.createUserMember({
        userOverrides: { token: memberToken },
      }));
      ({ user: adminUser } = await group.createAdminMember({
        userOverrides: { token: adminToken },
      }));
      memberAuthHeaderValue = `${memberUser.email} ${memberToken}`;
      adminAuthHeaderValue = `${adminUser.email} ${adminToken}`;
      ({ createSubmission, postSubmission } = await createSurvey(['string'], {
        meta: createSurveyMeta({
          group: createSurveyMetaGroup({ id: group._id, path: group.path }),
        }),
      }));
    });

    describe('DELETE /api/submissions/:id', () => {
      it('returns 409 when the submission is a draft', async () => {
        const { submission } = await createSubmission({
          meta: createSubmissionMeta({
            creator: memberUser._id,
            isDraft: true,
          }),
        });

        await request(testApp)
          .delete(`/api/submissions/${submission._id}`)
          .set('Authorization', memberAuthHeaderValue)
          .send()
          .expect(409);

        const existingSubmission = await db
          .collection('submissions')
          .findOne({ _id: submission._id });
        expect(existingSubmission).not.toBeNull();
      });

      describe('when the submission is in a group that the requesting user is a member of', () => {
        it('and the requesting user is the creator, OK', async () => {
          const submissionId = new ObjectId();
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });

          await request(testApp)
            .delete(`/api/submissions/${submissionId.toString()}`)
            .set('Authorization', memberAuthHeaderValue)
            .send()
            .expect(200);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          expect(existingSubmission).toBeNull();
        });

        it('and the requesting user is an admin of the group, OK', async () => {
          const submissionId = new ObjectId();
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });

          await request(testApp)
            .delete(`/api/submissions/${submissionId.toString()}`)
            .set('Authorization', adminAuthHeaderValue)
            .send()
            .expect(200);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          expect(existingSubmission).toBeNull();
        });

        it('and the requesting user is not the creator, 401', async () => {
          const submissionId = new ObjectId();
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: adminUser._id,
            authHeaderValue: adminAuthHeaderValue,
          });

          await request(testApp)
            .delete(`/api/submissions/${submissionId.toString()}`)
            .set('Authorization', memberAuthHeaderValue)
            .send()
            .expect(401);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          expect(existingSubmission).not.toBeNull();
        });
      });

      describe('when the submission is in a group that the requesting user is not a member of', () => {
        it('and the requesting user is the creator, OK', async () => {
          const submissionId = new ObjectId();
          const anotherGroup = await createGroup();
          await createSubmission({
            _id: submissionId,
            meta: createSubmissionMeta({
              creator: memberUser._id,
              group: { id: anotherGroup._id, path: anotherGroup.path },
            }),
          });

          await request(testApp)
            .delete(`/api/submissions/${submissionId.toString()}`)
            .set('Authorization', memberAuthHeaderValue)
            .send()
            .expect(200);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          expect(existingSubmission).toBeNull();
        });

        it('and the requesting user is not the creator, 401', async () => {
          const submissionId = new ObjectId();
          const anotherGroup = await createGroup();
          await createSubmission({
            _id: submissionId,
            meta: createSubmissionMeta({
              creator: adminUser._id,
              group: { id: anotherGroup._id, path: anotherGroup.path },
            }),
          });

          await request(testApp)
            .delete(`/api/submissions/${submissionId.toString()}`)
            .set('Authorization', memberAuthHeaderValue)
            .send()
            .expect(401);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          expect(existingSubmission).not.toBeNull();
        });
      });
    });

    describe('DELETE /api/submissions/bulk-delete', () => {
      it('returns 409 when any of the submissions are drafts', async () => {
        const { submission: draft } = await createSubmission({
          meta: createSubmissionMeta({
            creator: memberUser._id,
            isDraft: true,
          }),
        });
        const { submission } = await createSubmission({
          meta: createSubmissionMeta({
            creator: memberUser._id,
            isDraft: false,
          }),
        });

        await request(testApp)
          .post('/api/submissions/bulk-delete')
          .set('Authorization', memberAuthHeaderValue)
          .send({ ids: [submission._id, draft._id] })
          .expect(409);

        const existingSubmission = await db
          .collection('submissions')
          .findOne({ _id: submission._id });
        const existingDraft = await db.collection('submissions').findOne({ _id: draft._id });
        expect(existingSubmission).not.toBeNull();
        expect(existingDraft).not.toBeNull();
      });

      describe('when the submission is in a group that the requesting user is a member of', () => {
        it('and the requesting user is the creator, OK', async () => {
          const submissionId = new ObjectId();
          const submissionId2 = new ObjectId();
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });
          await postSubmission({
            submissionId: submissionId2.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });

          await request(testApp)
            .post('/api/submissions/bulk-delete')
            .set('Authorization', memberAuthHeaderValue)
            .send({ ids: [submissionId.toString(), submissionId2.toString()] })
            .expect(200);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          const existingSubmission2 = await db
            .collection('submissions')
            .findOne({ _id: submissionId2 });
          expect(existingSubmission).toBeNull();
          expect(existingSubmission2).toBeNull();
        });

        it('and the requesting user is an admin of the group, OK', async () => {
          const submissionId = new ObjectId();
          const submissionId2 = new ObjectId();
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });
          await postSubmission({
            submissionId: submissionId2.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });

          await request(testApp)
            .post('/api/submissions/bulk-delete')
            .set('Authorization', adminAuthHeaderValue)
            .send({ ids: [submissionId.toString(), submissionId2.toString()] })
            .expect(200);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          const existingSubmission2 = await db
            .collection('submissions')
            .findOne({ _id: submissionId2 });
          expect(existingSubmission).toBeNull();
          expect(existingSubmission2).toBeNull();
        });

        it('and the requesting user is not the creator of all submissions, 401 and delete nothing', async () => {
          const submissionId = new ObjectId();
          const submissionId2 = new ObjectId();
          await postSubmission({
            submissionId: submissionId.toString(),
            creator: memberUser._id,
            authHeaderValue: memberAuthHeaderValue,
          });
          await postSubmission({
            submissionId: submissionId2.toString(),
            creator: adminUser._id,
            authHeaderValue: adminAuthHeaderValue,
          });

          await request(testApp)
            .post('/api/submissions/bulk-delete')
            .set('Authorization', memberAuthHeaderValue)
            .send({ ids: [submissionId.toString(), submissionId2.toString()] })
            .expect(401);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          const existingSubmission2 = await db
            .collection('submissions')
            .findOne({ _id: submissionId2 });
          expect(existingSubmission).not.toBeNull();
          expect(existingSubmission2).not.toBeNull();
        });
      });

      describe('when the submission is in a group that the requesting user is not a member of', () => {
        it('and the requesting user is the creator, OK', async () => {
          const submissionId = new ObjectId();
          const submissionId2 = new ObjectId();
          const anotherGroup = await createGroup();
          await createSubmission({
            _id: submissionId,
            meta: createSubmissionMeta({
              creator: memberUser._id,
              group: { id: anotherGroup._id, path: anotherGroup.path },
            }),
          });
          await createSubmission({
            _id: submissionId2,
            meta: createSubmissionMeta({
              creator: memberUser._id,
              group: { id: anotherGroup._id, path: anotherGroup.path },
            }),
          });

          await request(testApp)
            .post('/api/submissions/bulk-delete')
            .set('Authorization', memberAuthHeaderValue)
            .send({ ids: [submissionId.toString(), submissionId2.toString()] })
            .expect(200);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          const existingSubmission2 = await db
            .collection('submissions')
            .findOne({ _id: submissionId2 });
          expect(existingSubmission).toBeNull();
          expect(existingSubmission2).toBeNull();
        });

        it('and the requesting user is not the creator of all submissions, 401 and delete nothing', async () => {
          const submissionId = new ObjectId();
          const submissionId2 = new ObjectId();
          const anotherGroup = await createGroup();
          await createSubmission({
            _id: submissionId,
            meta: createSubmissionMeta({
              creator: memberUser._id,
              group: { id: anotherGroup._id, path: anotherGroup.path },
            }),
          });
          await createSubmission({
            _id: submissionId2,
            meta: createSubmissionMeta({
              creator: adminUser._id,
              group: { id: anotherGroup._id, path: anotherGroup.path },
            }),
          });

          await request(testApp)
            .post('/api/submissions/bulk-delete')
            .set('Authorization', memberAuthHeaderValue)
            .send({ ids: [submissionId.toString(), submissionId2.toString()] })
            .expect(401);

          const existingSubmission = await db
            .collection('submissions')
            .findOne({ _id: submissionId });
          const existingSubmission2 = await db
            .collection('submissions')
            .findOne({ _id: submissionId2 });
          expect(existingSubmission).not.toBeNull();
          expect(existingSubmission2).not.toBeNull();
        });
      });
    });
  });
});

describe('buildPipeline', () => {
  // TODO add tests for the rest of the operations ( $match, $redact, $project)
  it('does not include submissions with isDraft=true by default', async () => {
    const pipeline = await buildPipeline(createReq({ query: {} }), await createRes());
    expect(pipeline).toContainEqual({ $match: { 'meta.isDraft': false } });
  });

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
