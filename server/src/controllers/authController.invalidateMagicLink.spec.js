import authController from './authController';
const { invalidateMagicLink } = authController;
import { db, COLL_ACCESS_CODES } from '../db';
import { createReq, createRes } from '../testUtils';
import { uniqueId } from 'lodash';

describe('invalidateMagicLink', () => {
  let accessCode, res;

  beforeEach(async () => {
    res = await createRes();
    const codeToInsert = { code: uniqueId().toString() };
    const insertResult = await db.collection(COLL_ACCESS_CODES).insertOne(codeToInsert);
    accessCode = { _id: insertResult.insertedId, ...codeToInsert };
  });

  it('deletes accessCode from DB', async () => {
    await invalidateMagicLink(
      createReq({ query: { invalidateCode: accessCode.invalidateCode } }),
      res
    );
    expect(await db.collection(COLL_ACCESS_CODES).findOne({ _id: accessCode._id })).toBeNull();
  });

  it('leaves other accessCodes in DB', async () => {
    await invalidateMagicLink(createReq({ query: { invalidateCode: 'not-exist' } }), res);
    expect(await db.collection(COLL_ACCESS_CODES).findOne({ _id: accessCode._id })).toMatchObject(
      accessCode
    );
  });

  it('sends ok: true', async () => {
    await invalidateMagicLink(
      createReq({ query: { invalidateCode: accessCode.invalidateCode } }),
      res
    );
    expect(res.send).toHaveBeenCalledWith({ ok: true });
  });

  it('fails silently if access code is not found', async () => {
    await invalidateMagicLink(createReq({ query: { invalidateCode: 'not-exist' } }), res);
    expect(res.send).toHaveBeenCalledWith({ ok: true });
  });
});
