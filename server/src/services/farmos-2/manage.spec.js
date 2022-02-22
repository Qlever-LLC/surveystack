import { createGroup, createReq, createRes, createUser } from '../../testUtils';
import {
  mapFarmOSInstanceToUser,
  listFarmOSInstancesForUser,
  mapFarmOSInstanceToUserOfGroup,
} from './manage';

const init = async () => {
  const group = await createGroup();
  const user1 = await group.createUserMember();
  const admin1 = await group.createAdminMember();

  return {
    group,
    user1,
    admin1,
  };
};

describe('manageFarmOS', () => {
  it('mapFarmOSInstanceToUser', async () => {
    const { group, admin1, user1 } = await init();
    const farmOSInstanceName = 'test.surveystack.io';
    await mapFarmOSInstanceToUser(user1.user._id, farmOSInstanceName, true);
    const results = await listFarmOSInstancesForUser(user1.user._id);

    expect(results).toEqual([{ farmOSInstanceName: farmOSInstanceName, owner: true }]);
  });

  it('create instance admin access', async () => {
    const { group, admin1, user1 } = await init();
    const farmOSInstanceName = 'test.surveystack.io';
    const someAdminFarmOSInstanceName = 'admin.surveystack.io';
    await mapFarmOSInstanceToUser(user1.user._id, farmOSInstanceName, true);
    await mapFarmOSInstanceToUser(admin1.user._id, someAdminFarmOSInstanceName, true);
    await mapFarmOSInstanceToUserOfGroup(user1.userId, farmOSInstanceName, group._id);

    const farms = await listFarmOSInstancesForUser(admin1.user._id);
    expect(farms).toEqual(
      expect.arrayContaining([
        {
          owner: false,
          farmOSInstanceName,
        },
        {
          farmOSInstanceName: someAdminFarmOSInstanceName,
          owner: true,
        },
      ])
    );

    const results = await listFarmOSInstancesForUser(user1.user._id);
    expect(results).toEqual([{ farmOSInstanceName: farmOSInstanceName, owner: true }]);
  });
});
