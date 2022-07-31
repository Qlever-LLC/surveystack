import { ObjectId } from 'mongodb';
import {
  createNewIntegratedHyloGroup,
  getGroupBySlug,
  getIntegratedHyloGroup,
  QUERY_GROUP,
  QUERY_GROUP_BY_SLUG,
  removeHyloGroupIntegration,
  setIntegratedHyloGroup,
  inviteMemberToHyloGroup,
} from './hyloController';
import { createGroup, createReq, createRes } from '../testUtils';
import { gqlRequest } from '../services/hylo/utils';
import { COLL_GROUPS_HYLO_MAPPINGS, db } from '../db';
import { addMember, createHyloGroup, upsertHyloUser } from '../services/hylo.service';
import { without } from 'lodash';
import boom from '@hapi/boom';

jest.mock('../services/hylo.service');
jest.mock('../services/hylo/utils');

describe('hyloController', () => {
  describe('getIntegratedHyloGroup', () => {
    const SAVE_ENV = process.env;
    let group, user1, hyloUser1, hyloGroup, res, req;
    beforeEach(async () => {
      process.env = { ...SAVE_ENV, HYLO_API_URL: 'https://hylo.api.url' };
      group = await createGroup();
      user1 = await group.createUserMember();
      hyloUser1 = {
        id: '1',
        hasRegistered: true,
        name: user1.user.name,
      };
      hyloGroup = {
        id: 'hylo-group-id-foo',
        slug: 'hylo-slug-foo',
        members: {
          items: [hyloUser1],
        },
      };
      await db
        .collection(COLL_GROUPS_HYLO_MAPPINGS)
        .insertOne({ groupId: group._id, hyloGroupId: hyloGroup.id });

      gqlRequest.mockResolvedValueOnce({ member0: hyloUser1 });
      gqlRequest.mockResolvedValueOnce({ group: hyloGroup });
      req = createReq({ params: { groupId: group._id.toString() } });
      res = await createRes({ user: user1.user });
    });

    afterAll(() => (process.env = SAVE_ENV));

    it('throws if groupId is not set', async () => {
      await expect(getIntegratedHyloGroup(await createReq(), res)).rejects.toThrow(
        'The groupId query parameter is required'
      );
    });
    it('reads group from Hylo API', async () => {
      await getIntegratedHyloGroup(req, res);
      expect(gqlRequest).toHaveBeenCalledWith(QUERY_GROUP, { id: hyloGroup.id });
    });
    it('reads members from Hylo API', async () => {
      await getIntegratedHyloGroup(req, res);
      expect(gqlRequest.mock.calls[0][0]).toContain(`person(email:"${user1.user.email}")`);
    });
    it('returns the integrated hylo group', async () => {
      await getIntegratedHyloGroup(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(hyloGroup));
    });
    it('extends hylo member objects with surveyStackMembership', async () => {
      await getIntegratedHyloGroup(req, res);
      expect(res.json.mock.calls[0][0].members.items).toContainEqual({
        ...hyloUser1,
        surveyStackMembership: {
          _id: user1.membership._id,
          user: {
            _id: user1.user._id,
            email: user1.user.email,
          },
        },
      });
    });
    it('adds hyloUrl to surveyStackMembership', async () => {
      await getIntegratedHyloGroup(req, res);
      expect(res.json.mock.calls[0][0].members.items).toContainEqual({
        ...hyloUser1,
        hyloUrl: `${process.env.HYLO_API_URL}/groups/${hyloGroup?.slug}/members/${hyloUser1.id}`,
      });
    });
    it('returns null if group is not connected to Hylo', async () => {
      await db.collection(COLL_GROUPS_HYLO_MAPPINGS).deleteOne({ groupId: group._id });
      await getIntegratedHyloGroup(req, res);
      expect(res.json).toHaveBeenCalledWith(null);
    });
  });

  describe('createNewIntegratedHyloGroup', () => {
    let group, user, hyloGroup, hyloUser, res, req;
    beforeEach(async () => {
      group = await createGroup();
      user = (await group.createUserMember()).user;
      hyloGroup = {
        id: 'hylo-group-id-foo',
      };
      hyloUser = {
        id: 'hylo-user-id-bar',
        email: user.email,
      };
      upsertHyloUser.mockResolvedValue(hyloUser);
      createHyloGroup.mockResolvedValue({ group: hyloGroup });

      gqlRequest.mockResolvedValue({ group: hyloGroup });
      req = createReq({ body: { groupId: group._id.toString() } });
      res = await createRes({ user });
    });

    it('throws if groupId is not set', async () => {
      await expect(createNewIntegratedHyloGroup(await createReq(), res)).rejects.toThrow(
        '"groupId" is required'
      );
    });

    it('calls upsertHyloUser', async () => {
      await createNewIntegratedHyloGroup(req, res);
      expect(upsertHyloUser).toHaveBeenCalledWith({ email: user.email, name: user.name });
    });

    it('calls createHyloGroup', async () => {
      await createNewIntegratedHyloGroup(req, res);
      expect(createHyloGroup.mock.calls[0][0]).toMatchObject({
        data: {
          accessibility: 1,
          name: group.name,
          slug: group.slug,
          parentIds: [],
          visibility: 2,
        },
        hyloUserId: hyloUser.id,
      });
    });

    it('inserts mapping into DB', async () => {
      await createNewIntegratedHyloGroup(req, res);
      await expect(
        db.collection(COLL_GROUPS_HYLO_MAPPINGS).findOne({ groupId: group._id })
      ).resolves.toMatchObject({ groupId: group._id, hyloGroupId: hyloGroup.id });
    });

    it('updates mapping in DB', async () => {
      await db
        .collection(COLL_GROUPS_HYLO_MAPPINGS)
        .insertOne({ groupId: group._id, hyloGroupId: `${hyloGroup.id}-different` });
      await createNewIntegratedHyloGroup(req, res);
      await expect(
        db.collection(COLL_GROUPS_HYLO_MAPPINGS).findOne({ groupId: group._id })
      ).resolves.toMatchObject({ groupId: group._id, hyloGroupId: hyloGroup.id });
    });

    it('returns hylo group', async () => {
      gqlRequest.mockResolvedValue({ group: hyloGroup });
      await createNewIntegratedHyloGroup(req, res);
      expect(res.json).toHaveBeenCalledWith(hyloGroup);
    });
  });

  describe('inviteMemberToHyloGroup', () => {
    let group, user, admin, hyloGroup, hyloUser, res, req;
    beforeEach(async () => {
      group = await createGroup();
      user = await group.createUserMember();
      admin = await group.createAdminMember();
      hyloGroup = {
        id: 'hylo-group-id-foo',
      };
      hyloUser = {
        id: 'hylo-user-id-foo',
      };
      await db
        .collection(COLL_GROUPS_HYLO_MAPPINGS)
        .insertOne({ groupId: group._id, hyloGroupId: hyloGroup.id });
      upsertHyloUser.mockResolvedValue(hyloUser);
      req = createReq({ body: { membershipId: user.membership._id.toString() } });
      res = await createRes({ user: admin.user });
    });

    it('throws if membershipId is not set', async () => {
      await expect(inviteMemberToHyloGroup(createReq(), res)).rejects.toThrow(
        '"membershipId" is required'
      );
    });

    it("throws if membership doesn't exsist in DB", async () => {
      await db.collection('memberships').deleteOne({ _id: user.membership._id });
      await expect(inviteMemberToHyloGroup(req, res)).rejects.toThrow(
        `Can't find membership with the ID "${user.membership._id}"`
      );
    });

    it('throws if executing user is not group admin', async () => {
      const userMember = await group.createUserMember();
      res = await createRes({ user: userMember.user });
      await expect(inviteMemberToHyloGroup(req, res)).rejects.toThrow(boom.unauthorized());
    });

    it("throws if user doesn't exsist in DB", async () => {
      await db.collection('users').deleteOne({ _id: user.membership.user });
      await expect(inviteMemberToHyloGroup(req, res)).rejects.toThrow(
        `Membership "${user.membership._id}" has no user`
      );
    });

    it('throws when group has no integrated Hylo group', async () => {
      await db.collection(COLL_GROUPS_HYLO_MAPPINGS).deleteOne({ groupId: group._id });
      await expect(inviteMemberToHyloGroup(req, res)).rejects.toThrow(
        `Can't find Hylo integration for group "${group._id}"`
      );
    });

    it('calls upsertHyloUser', async () => {
      await inviteMemberToHyloGroup(req, res);
      expect(upsertHyloUser).toHaveBeenCalledWith({ name: user.user.name, email: user.user.email });
    });

    it('calls addMember', async () => {
      await inviteMemberToHyloGroup(req, res);
      expect(addMember).toHaveBeenCalledWith({
        hyloUserId: hyloUser.id,
        hyloGroupId: hyloGroup.id,
      });
    });

    it('returns ok', async () => {
      await inviteMemberToHyloGroup(req, res);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe('setIntegratedHyloGroup', () => {
    let group, user, hyloGroup, res, req;
    beforeEach(async () => {
      group = await createGroup();
      user = (await group.createUserMember()).user;
      hyloGroup = {
        id: 'hylo-group-id-foo',
      };

      gqlRequest.mockResolvedValue({ group: hyloGroup });
      req = createReq({ body: { groupId: group._id.toString(), hyloGroupId: hyloGroup.id } });
      res = await createRes({ user });
    });

    it('throws if groupId is not set', async () => {
      await expect(
        setIntegratedHyloGroup(createReq({ body: { hyloGroupId: hyloGroup.id } }), res)
      ).rejects.toThrow('"groupId" is required');
    });

    it('throws if hyloGroupId is not set', async () => {
      await expect(
        setIntegratedHyloGroup(createReq({ body: { groupId: group._id.toString() } }), res)
      ).rejects.toThrow('"hyloGroupId" is required');
    });

    it('inserts mapping into DB', async () => {
      await setIntegratedHyloGroup(req, res);
      await expect(
        db.collection(COLL_GROUPS_HYLO_MAPPINGS).findOne({ groupId: group._id })
      ).resolves.toMatchObject({ groupId: group._id, hyloGroupId: hyloGroup.id });
    });

    it('updates mapping in DB', async () => {
      await db
        .collection(COLL_GROUPS_HYLO_MAPPINGS)
        .insertOne({ groupId: group._id, hyloGroupId: `${hyloGroup.id}-different` });
      await setIntegratedHyloGroup(req, res);
      await expect(
        db.collection(COLL_GROUPS_HYLO_MAPPINGS).findOne({ groupId: group._id })
      ).resolves.toMatchObject({ groupId: group._id, hyloGroupId: hyloGroup.id });
    });

    it('returns hylo group', async () => {
      gqlRequest.mockResolvedValue({ group: hyloGroup });
      await setIntegratedHyloGroup(req, res);
      expect(res.json).toHaveBeenCalledWith(hyloGroup);
    });
  });

  describe('removeHyloGroupIntegration', () => {
    let group, user, hyloGroup, res, req;
    beforeEach(async () => {
      group = await createGroup();
      user = (await group.createUserMember()).user;
      hyloGroup = {
        id: 'hylo-group-id-foo',
      };
      await db
        .collection(COLL_GROUPS_HYLO_MAPPINGS)
        .insertOne({ groupId: group._id, hyloGroupId: hyloGroup.id });
      gqlRequest.mockResolvedValue({ group: hyloGroup });
      req = createReq({ body: { groupId: group._id.toString() } });
      res = await createRes({ user });
    });

    it('throws if groupId is not set', async () => {
      await expect(
        removeHyloGroupIntegration(createReq({ body: { hyloGroupId: hyloGroup.id } }), res)
      ).rejects.toThrow('"groupId" is required');
    });

    it('remove mapping from DB', async () => {
      await removeHyloGroupIntegration(req, res);
      await expect(
        db.collection(COLL_GROUPS_HYLO_MAPPINGS).findOne({ groupId: group._id })
      ).resolves.toBeNull();
    });
    it('remove mapping from DB', async () => {
      await db.collection(COLL_GROUPS_HYLO_MAPPINGS).deleteOne({ groupId: group._id });
      await removeHyloGroupIntegration(req, res);
      await expect(
        db.collection(COLL_GROUPS_HYLO_MAPPINGS).findOne({ groupId: group._id })
      ).resolves.toBeNull();
    });
    it('returns ok', async () => {
      await removeHyloGroupIntegration(req, res);
      expect(res.send).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe('getGroupBySlug', () => {
    let hyloGroup, res, req;
    beforeEach(async () => {
      hyloGroup = {
        id: 'hylo-group-id-foo',
        slug: 'hylo-slug-foo',
      };
      gqlRequest.mockResolvedValue({ group: hyloGroup });
      req = createReq({ query: { slug: hyloGroup.slug } });
      res = await createRes();
    });

    it('throws if groupId is not set', async () => {
      await expect(getGroupBySlug(createReq(), res)).rejects.toThrow('"slug" is required');
    });

    it('calls gqlRequest', async () => {
      await getGroupBySlug(req, res);
      expect(gqlRequest).toHaveBeenCalledWith(QUERY_GROUP_BY_SLUG, { slug: hyloGroup.slug });
    });

    it('returns the group', async () => {
      await getGroupBySlug(req, res);
      gqlRequest.mockResolvedValue({ group: hyloGroup });
      expect(res.json).toHaveBeenCalledWith(hyloGroup);
    });
  });
});
