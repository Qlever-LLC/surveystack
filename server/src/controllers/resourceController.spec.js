import { ObjectId } from 'mongodb';
import resourceController from './resourceController';
import { connectDatabase, db } from '../db';

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
  //TODO mock db or cleanup test entries after tests
  beforeAll(async () => {
    await connectDatabase();
  });

  let signedUrl, resourceId;

  describe('getUploadURL', () => {
    it('returns an url', async () => {
      const req = {
        body: {
          resourceName: 'testimage.png',
          contentLength: 1234,
          contentType: 'image/png',
        },
      };
      let res = mockRes();
      await getUploadURL(req, res);
      signedUrl = res.data.signedUrl;
      resourceId = res.data.resourceId;
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
      let req = {
        params: { id: resourceId },
      };
      let res = mockRes();
      await commitResource(req, res);
      expect(res.data.message).toBe('OK');
    });
  });

  describe('getResource', () => {
    it('sends an empty array for a random resourceId', async () => {
      let req = {
        query: { id: new ObjectId() },
      };
      let res = mockRes();
      await getResource(req, res);
      expect(res.data).toStrictEqual([]);
    });
    it('return one resource for the given resourceId', async () => {
      let req = {
        query: { id: resourceId },
      };
      let res = mockRes();
      await getResource(req, res);
      expect(res.data).toHaveLength(1);
    });
  });
  describe('deleteResource', () => {
    it('deletes a resource by existing id with ok result', async () => {
      let req = {
        params: { id: resourceId },
      };
      let res = mockRes();
      await deleteResource(req, res);
      expect(res.data.message).toBe('OK');
    });
    it('throws error if id is not existing', async () => {
      let req = {
        params: { id: new ObjectId() },
      };
      let res = mockRes();
      await deleteResource(req, res);
      expect(res.s).toBe(404);
    });
  });
});
