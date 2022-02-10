import { ObjectId } from 'mongodb';
import resourceController from './resourceController';
import { db } from '../db';
import { createReq } from '../testUtils';
jest.mock('../services/featureToggle.service');

const { getResource, getUploadURL, commitResource, deleteResource, col } = resourceController;

function mockRes() {
  return {
    data: null,
    s: null,
    status: function (s) {
      this.s = s;
      return this;
    },
    send: function (r) {
      this.data = r;
      return this;
    },
    locals: {
      auth: {
        user: {
          _id: new ObjectId(),
        },
      },
    },
  };
}

describe.skip('resourceController', () => {
  let signedUrl, resourceId;

  beforeEach(async () => {
    const req = createReq({
      body: {
        resourceName: 'testimage.png',
        contentLength: 1234,
        contentType: 'image/png',
      },
    });

    let res = mockRes();
    await getUploadURL(req, res);
    signedUrl = res.data.signedUrl;
    resourceId = res.data.resourceId;
  });

  describe('getUploadURL', () => {
    it('returns an url', async () => {
      expect(signedUrl).toContain('https://');
    });
    it('creates a pending resource entry in db', async () => {
      const resource = await db.collection(col).findOne({ _id: resourceId });
      expect(resource).not.toBeNull();
      expect(resource.state).toBe('pending');
    });
  });

  describe('commitResource', () => {
    it('updates the resource state to committed', async () => {
      const req = createReq({
        params: { id: resourceId },
      });
      let res = mockRes();
      await commitResource(req, res);
      expect(res.data.message).toBe('OK');
      await getResource(req, res);
      expect(res.data.state).toBe('committed');
    });
    it('returns not found error for a random resourceid', async () => {
      const req = createReq({
        params: { id: new ObjectId() },
      });
      let res = mockRes();
      await commitResource(req, res);
      expect(res.s).toBe(404);
    });
  });

  describe('getResource', () => {
    it('return one resource for the given resourceId', async () => {
      const req = createReq({
        params: { id: resourceId },
      });
      let res = mockRes();
      await commitResource(req, res);
      await getResource(req, res);
      expect(res.data._id).toStrictEqual(resourceId);
    });
    it('returns not found error for a random resourceId', async () => {
      const req = createReq({
        params: { id: new ObjectId() },
      });
      let res = mockRes();
      await getResource(req, res);
      expect(res.s).toBe(404);
    });
  });
  describe('deleteResource', () => {
    it('deletes a resource by existing id with ok result', async () => {
      const req = createReq({
        params: { id: resourceId },
      });
      let res = mockRes();
      await deleteResource(req, res);
      expect(res.data.message).toBe('OK');
      await getResource(req, res);
      expect(res.s).toBe(404);
    });
    it('throws error if id is not existing', async () => {
      const req = createReq({
        params: { id: new ObjectId() },
      });
      let res = mockRes();
      await deleteResource(req, res);
      expect(res.s).toBe(404);
    });
  });
});
