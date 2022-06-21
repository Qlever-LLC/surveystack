import { ObjectId } from 'mongodb';
import { getIntegratedHyloGroup, QUERY_GROUP } from './hyloController';
import { createGroup, createReq, createRes } from '../testUtils';
import { gqlRequest } from '../services/hylo/utils';
import { COLL_GROUPS_HYLO_MAPPINGS, db } from '../db';

jest.mock('../services/hylo.service');
jest.mock('../services/hylo/utils');

describe('hyloController', () => {
  describe('getIntegratedHyloGroup', () => {
    let group, hyloGroup, res, req;
    beforeEach(async () => {
      group = await createGroup();
      hyloGroup = {
        id: 'hylo-group-id-foo',
      };
      await db
        .collection(COLL_GROUPS_HYLO_MAPPINGS)
        .insertOne({ groupId: group._id, hyloGroupId: hyloGroup.id });

      gqlRequest.mockResolvedValue({ group: hyloGroup });
      req = createReq({ params: { groupId: group._id.toString() } });
      res = await createRes();
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
});
