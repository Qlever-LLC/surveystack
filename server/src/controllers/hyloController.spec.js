import { ObjectId } from 'mongodb';
import {
  createNewIntegratedHyloGroup,
  getGroupBySlug,
  getIntegratedHyloGroup,
  QUERY_GROUP,
  QUERY_GROUP_BY_SLUG,
  removeHyloGroupIntegration,
  setIntegratedHyloGroup,
} from './hyloController';
import { createGroup, createReq, createRes } from '../testUtils';
import { gqlRequest } from '../services/hylo/utils';
import { COLL_GROUPS_HYLO_MAPPINGS, db } from '../db';
import { createHyloGroup, upsertHyloUser } from '../services/hylo.service';
import { without } from 'lodash';

jest.mock('../services/hylo.service');
jest.mock('../services/hylo/utils');

describe('hyloController', () => {
  describe('getIntegratedHyloGroup', () => {
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
      req = createReq({ params: { groupId: group._id.toString() } });
      res = await createRes({ user });
    });

    it('throws if groupId is not set', async () => {
      await expect(getIntegratedHyloGroup(await createReq(), res)).rejects.toThrow(
        'The groupId query parameter is required'
      );
    });
    it('calls Hylo API', async () => {
      await getIntegratedHyloGroup(req, res);
      expect(gqlRequest).toHaveBeenCalledWith(QUERY_GROUP, { id: hyloGroup.id });
    });
    it('returns the integrated hylo group', async () => {
      await getIntegratedHyloGroup(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(hyloGroup));
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
          visibility: 1,
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
      await expect(res.send).toHaveBeenCalledWith({ ok: true });
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
      expect(gqlRequest).toHaveBeenCalledWith(QUERY_GROUP_BY_SLUG, {slug: hyloGroup.slug})
    });

    it('returns the group', async () => {
      await getGroupBySlug(req, res);
      gqlRequest.mockResolvedValue({group: hyloGroup})
      expect(res.json).toHaveBeenCalledWith(hyloGroup)
    });
  });
});
