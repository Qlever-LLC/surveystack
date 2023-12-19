import request from 'supertest';
import createApp from '../app.js';
import { getDb } from '../db';
import { createGroup, createScript, createSuperAdmin, createMembership } from '../testUtils';
import { ObjectId } from 'mongodb';

const app = createApp();

describe('Script Endpoints', () => {
  let script;
  let group;
  beforeEach(async () => {
    group = await createGroup();
    script = await createScript({
      group: {
        id: group._id,
        path: group.path,
      },
    });
  });

  describe('GET /api/scripts', () => {
    it('returns a 200 with all scripts', (done) => {
      request(app)
        .get('/api/scripts')
        .send()
        .end((err, res) => {
          expect(res.status).toBe(200);
          expect(res.body).toContainEqual(
            expect.objectContaining({
              _id: String(script._id),
            })
          );
          done();
        });
    });
  });

  describe('DELETE /api/scripts/:id', () => {
    it('returns a 401 and does not delete the script when the requesting user is not a super admin', async () => {
      const { user: groupAdminUser } = await group.createAdminMember({
        userOverrides: { token: '1234' },
      });

      await request(app)
        .delete(`/api/scripts/${script._id}`)
        .set('Authorization', `${groupAdminUser.email} 1234`)
        .send()
        .expect(401);

      const deletedScript = await getDb()
        .collection('scripts')
        .findOne({ _id: new ObjectId(script._id) });

      expect(deletedScript).not.toBeNull();
    });

    it('returns 200 and deletes the script when the requesting user is a super admin', async () => {
      const superAdminUser = await createSuperAdmin({
        token: '1234',
      });

      await request(app)
        .delete(`/api/scripts/${script._id}`)
        .set('Authorization', `${superAdminUser.email} 1234`)
        .send()
        .expect(200);

      const deletedScript = await getDb()
        .collection('scripts')
        .findOne({ _id: new ObjectId(script._id) });

      expect(deletedScript).toBeNull();
    });
  });

  describe('POST /api/scripts', () => {
    const createScriptDoc = ({ group }) => ({
      name: 'script name',
      content: 'script content',
      meta: {
        creator: null,
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        group,
        revision: 1,
        specVersion: 2,
      },
      _id: String(new ObjectId()),
    });

    it('creates the script in the database and returns a 201 with the created script', async () => {
      const { user: groupAdminUser } = await group.createAdminMember({
        userOverrides: { token: '1234' },
      });

      const scriptDoc = createScriptDoc({
        group: {
          id: String(group._id),
          path: group.path,
        },
      });

      const response = await request(app)
        .post('/api/scripts')
        .set('Authorization', `${groupAdminUser.email} 1234`)
        .send(scriptDoc)
        .expect(201);

      const insertedScript = await getDb()
        .collection('scripts')
        .findOne({ _id: new ObjectId(response.body._id) });

      expect(insertedScript).not.toBeNull();
    });

    it("returns a 401 if the requesting user is not an admin of the script's group", async () => {
      const { user: groupMemberUser } = await group.createUserMember({
        userOverrides: { token: '1234' },
      });

      const scriptDoc = createScriptDoc({
        group: {
          id: String(group._id),
          path: group.path,
        },
      });

      return request(app)
        .post('/api/scripts')
        .set('Authorization', `${groupMemberUser.email} 1234`)
        .send(scriptDoc)
        .expect(401);
    });

    it('returns a 400 if the script is not given a group (invalid request body)', async () => {
      const { user: groupAdminUser } = await group.createAdminMember({
        userOverrides: { token: '1234' },
      });

      const scriptDoc = createScriptDoc({
        group: null,
      });

      return await request(app)
        .post('/api/scripts')
        .set('Authorization', `${groupAdminUser.email} 1234`)
        .send(scriptDoc)
        .expect(400);
    });
  });

  describe('PUT /api/scripts/:id', () => {
    it('returns 200 and modifies the group', async () => {
      const { user: groupAdminUser } = await group.createAdminMember({
        userOverrides: { token: '1234' },
      });
      const group2 = await createGroup();
      await createMembership({
        user: groupAdminUser,
        group: group2._id,
        role: 'admin',
      });

      const updatedScriptDoc = {
        ...script,
        meta: {
          group: {
            id: String(group2._id),
            path: group2.path,
          },
        },
        content: 'new content',
      };

      await request(app)
        .put(`/api/scripts/${script._id}`)
        .set('Authorization', `${groupAdminUser.email} 1234`)
        .send(updatedScriptDoc)
        .expect(200);

      const updatedScript = await getDb().collection('scripts').findOne({ _id: script._id });

      expect(updatedScript.content).toEqual('new content');
      expect(updatedScript.meta.group).toHaveProperty('id', group2._id);
      expect(updatedScript.meta.group).toHaveProperty('path', group2.path);
    });

    it('returns 401 if the requesting user is not an admin of the group the script is in', async () => {
      const { user: groupMemberUser } = await group.createUserMember({
        userOverrides: { token: '1234' },
      });

      const updatedScriptDoc = {
        ...script,
        content: 'new content',
      };

      return request(app)
        .put(`/api/scripts/${script._id}`)
        .set('Authorization', `${groupMemberUser.email} 1234`)
        .send(updatedScriptDoc)
        .expect(401);
    });

    describe("when reassigning the script's group", () => {
      it('returns 401 if the requesting user is not an admin of the group the script is currently in and the group the script is being reassigned to', async () => {
        const { user: groupAdminUser } = await group.createAdminMember({
          userOverrides: { token: '1234' },
        });
        const group2 = await createGroup();

        const updatedScriptDoc = {
          ...script,
          meta: {
            group: {
              id: String(group2._id),
              path: group2.path,
            },
          },
          content: 'new content',
        };

        return request(app)
          .put(`/api/scripts/${script._id}`)
          .set('Authorization', `${groupAdminUser.email} 1234`)
          .send(updatedScriptDoc)
          .expect(401);
      });
    });
  });
});
