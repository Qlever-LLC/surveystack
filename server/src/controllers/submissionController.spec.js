import request from 'supertest';
import submissionController, { buildPipeline } from './submissionController';
import {
  createReq,
  createRes,
  createSurvey,
  createUser,
  createGroup,
  createRequestSubmissionMeta,
  createSubmissionMeta,
} from '../testUtils';
import mailService from '../services/mail/mail.service';
import createApp from '../app.js';
import { db } from '../db';
import handleApiCompose from './utils/handleApiCompose';

jest.mock('./utils/handleApiCompose');
jest.mock('../services/mail/mail.service');
jest.mock('../db/helpers.ts');
jest.mock('../services/featureToggle.service.js');

const { ObjectId } = jest.requireActual('mongodb');

import { withSession } from '../db/helpers.ts';
const { withSession: actualWithSession } = jest.requireActual('../db/helpers.ts');
// by default, for each test, setup withSession to behave as normal (that is, use their actual implementation), but also set them up as mocks so their functionality can be overridden in individual tests, spyed on, etc.
beforeEach(() => {
  withSession.mockImplementation(actualWithSession);
});

const { getSubmissionsCsv, getSubmissionPdf, postSubmissionPdf, sendPdfLink } =
  submissionController;

describe('submissionController', () => {
  const handleApiComposeHappyPathImplementation = (submissionEntities) => ({
    results: {
      farmos: [],
      hylo: [],
    },
    entities: submissionEntities,
  });

  describe('syncDraft', () => {
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
      const { createRequestSubmission } = await createSurvey(['string']);
      const draftSubmission = createRequestSubmission({
        _id: ObjectId().toString(),
        meta: createRequestSubmissionMeta({ isDraft: true }),
      });

      return request(app).post('/api/submissions/sync-draft').send(draftSubmission).expect(401);
    });

    it('returns 400 if the submission in the request is not a draft', async () => {
      const { createRequestSubmission } = await createSurvey(['string']);
      const nonDraftSubmission = createRequestSubmission({
        _id: ObjectId().toString(),
        meta: createRequestSubmissionMeta({ isDraft: false, creator: user._id.toString() }),
      });

      return request(app)
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

      return request(app)
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

      return request(app)
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

        return request(app)
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
            meta: createRequestSubmissionMeta({ isDraft: true, creator: user._id.toString() }),
          });

          await request(app)
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
              creator: user._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-02').toISOString() },
                },
              ],
            }),
          });

          await request(app)
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
              creator: user._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-02').toISOString() },
                },
              ],
            }),
          });

          await request(app)
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
              creator: user._id.toString(),
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

          await request(app)
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
              creator: user._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              status: [
                {
                  type: 'READY_TO_SUBMIT',
                  value: { at: new Date('2021-01-02').toISOString() },
                },
              ],
            }),
          });
          handleApiCompose.mockImplementation(handleApiComposeHappyPathImplementation);

          await request(app)
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
              creator: user._id.toString(),
              dateModified: new Date('2021-01-02').toISOString(),
              status: [
                {
                  type: 'READY_TO_DELETE',
                  value: { at: new Date('2021-01-02').toISOString() },
                },
              ],
            }),
          });
          handleApiCompose.mockImplementation(handleApiComposeHappyPathImplementation);

          await request(app)
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
          meta: createRequestSubmissionMeta({ isDraft: true, creator: user._id.toString() }),
        });

        return request(app)
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
          meta: createSubmissionMeta({ isDraft: true, creator: user._id }),
        });
        const requestSubmission = createRequestSubmission({
          _id: submissionId.toString(),
          meta: createRequestSubmissionMeta({ isDraft: true, creator: new ObjectId().toString() }),
        });

        return request(app)
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
              creator: user._id,
              dateModified: new Date('2021-01-01'),
            }),
          });
          const requestSubmission = createRequestSubmission({
            _id: submissionId.toString(),
            meta: createRequestSubmissionMeta({
              isDraft: true,
              creator: user._id.toString(),
              status: [{ type: 'READY_TO_SUBMIT', value: { at: new Date().toISOString() } }],
              dateModified: new Date('2021-01-02').toISOString(),
            }),
          });

          await request(app)
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
            meta: createSubmissionMeta({ isDraft: true, creator: user._id, dateModified }),
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
                    creator: user._id,
                    dateModified: dateModified,
                  }),
                });
                const requestSubmission = createRequestSubmission({
                  _id: submissionId.toString(),
                  meta: createRequestSubmissionMeta({
                    isDraft: true,
                    creator: user._id.toString(),
                    dateModified: new Date('2021-01-02').toISOString(),
                  }),
                });

                await request(app)
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
                    creator: user._id,
                    dateModified: dateModified,
                  }),
                });
                const requestSubmission = createRequestSubmission({
                  _id: submissionId.toString(),
                  meta: createRequestSubmissionMeta({
                    isDraft: true,
                    creator: user._id.toString(),
                    dateModified: new Date('2021-01-02').toISOString(),
                    status: [
                      {
                        type: 'READY_TO_SUBMIT',
                        value: { at: new Date('2021-01-02').toISOString() },
                      },
                    ],
                  }),
                });
                handleApiCompose.mockImplementation(handleApiComposeHappyPathImplementation);

                await request(app)
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
                    creator: user._id,
                    dateModified: dateModified,
                  }),
                });
                const requestSubmission = createRequestSubmission({
                  _id: submissionId.toString(),
                  meta: createRequestSubmissionMeta({
                    isDraft: true,
                    creator: user._id.toString(),
                    dateModified: new Date('2021-01-02').toISOString(),
                    status: [
                      {
                        type: 'READY_TO_DELETE',
                        value: { at: new Date('2021-01-02').toISOString() },
                      },
                    ],
                  }),
                });

                await request(app)
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
                  creator: user._id.toString(),
                  dateModified: new Date('2021-01-02').toISOString(),
                  status: [
                    {
                      type: 'READY_TO_DELETE',
                      value: { at: new Date('2021-01-02').toISOString() },
                    },
                  ],
                }),
              });

              await request(app)
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
                  creator: user._id.toString(),
                  dateModified: new Date('2021-01-02').toISOString(),
                }),
              });

              await request(app)
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
                  creator: user._id.toString(),
                  dateModified: new Date('2021-01-02').toISOString(),
                  status: [
                    {
                      type: 'READY_TO_SUBMIT',
                      value: { at: new Date('2021-01-02').toISOString() },
                    },
                  ],
                }),
              });

              await request(app)
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
                  creator: user._id.toString(),
                  dateModified: new Date('2021-01-02').toISOString(),
                  status: [
                    {
                      type: 'READY_TO_SUBMIT',
                      value: { at: new Date('2021-01-02').toISOString() },
                    },
                  ],
                }),
              });

              await request(app)
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
                  creator: user._id.toString(),
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

              await request(app)
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
                  creator: user._id.toString(),
                  dateModified: new Date('2021-01-02').toISOString(),
                  status: [
                    {
                      type: 'READY_TO_SUBMIT',
                      value: { at: new Date('2021-01-02').toISOString() },
                    },
                  ],
                }),
              });
              handleApiCompose.mockImplementation(handleApiComposeHappyPathImplementation);

              await request(app)
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
                creator: user._id.toString(),
                dateModified: new Date('2021-01-01').toISOString(),
                status: [
                  {
                    type: 'READY_TO_DELETE',
                    value: { at: new Date('2021-01-01').toISOString() },
                  },
                ],
              }),
            });

            await request(app)
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
                creator: user._id.toString(),
                dateModified: new Date('2021-01-01').toISOString(),
                status: [
                  {
                    type: 'READY_TO_SUBMIT',
                    value: { at: new Date('2021-01-01').toISOString() },
                  },
                ],
              }),
            });

            await request(app)
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
                creator: user._id.toString(),
                dateModified: new Date('2021-01-01').toISOString(),
              }),
            });

            await request(app)
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

  describe('getSubmissionsCsv', () => {
    it('returns expected CSV for geojson question type', async () => {
      const { survey, createSubmission } = await createSurvey(['geoJSON']);
      const { submission } = await createSubmission();
      const mockReq = createReq({ query: { showCsvMeta: 'true', survey: survey._id } });
      const mockRes = await createRes();
      await getSubmissionsCsv(mockReq, mockRes);
      const expected =
        '_id,meta.isDraft,meta.dateCreated,meta.dateModified,meta.dateSubmitted,meta.survey.id,meta.survey.name,meta.survey.version,meta.revision,meta.permissions,meta.status,meta.group.id,meta.group.path,meta.specVersion,meta.creator,meta.permanentResults,data.map_1.features.0,data.map_1.type\r\n' +
        `${submission._id},` +
        `false,` +
        `${new Date(submission.meta.dateCreated).toISOString()},` +
        `${new Date(submission.meta.dateModified).toISOString()},` +
        `${new Date(submission.meta.dateSubmitted).toISOString()},` +
        `${submission.meta.survey.id},Mock Survey Name,` +
        `2,1,,,` +
        `${submission.meta.group.id},` +
        `${submission.meta.group.path},4,` +
        `${submission.meta.creator},` +
        `,"{""type"":""Feature"",""geometry"":{""type"":""Polygon"",""coordinates"":[[[-79.39869321685993,43.65614580273717],[-79.39799841596073,43.6460912513611],[-79.37263818314015,43.645085703645464],[-79.3698589795434,43.657653840263464],[-79.39869321685993,43.65614580273717]]]},""properties"":null,""id"":""measureFeature0""}",FeatureCollection`;
      expect(mockRes.send).toHaveBeenCalledWith(expected);
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
      const req = createReq({
        params: { id: 'non-existing-submission-id' },
        query: { base64: '1' },
      });
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
      submission.meta.group = undefined; //make the pdf generation fail by removing the group information
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
