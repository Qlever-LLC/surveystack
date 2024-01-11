import { createGroup, deleteMemberships } from '../../testUtils';
import {
  mapFarmOSInstanceToUser,
  unmapFarmOSInstance,
  listFarmOSInstancesForUser,
  createFarmOSInstanceForUserAndGroup,
} from './manage';

jest.mock('../../services/mail/mail.service');

const init = async () => {
  const group = await createGroup();
  const user1 = await group.createUserMember();
  const user2 = await group.createUserMember();
  const admin1 = await group.createAdminMember();

  return {
    group,
    user1,
    user2,
    admin1,
  };
};

const origin = 'url';

import { hasPermission } from './apiCompose';

describe('farmos2-api-compose', () => {
  it.only('has-permission', async () => {
    const { group, user1, user2, admin1 } = await init();
    const instanceName = 'test.surveystack.io';
    await mapFarmOSInstanceToUser(user1.user._id, instanceName, true, origin);
    await createFarmOSInstanceForUserAndGroup(
      admin1.user._id,
      group._id,
      instanceName,
      false,
      origin
    );

    expect(await hasPermission(user1.user._id, instanceName)).toBe(true);
    expect(await hasPermission(user2.user._id, instanceName)).toBe(false);
    expect(await hasPermission(admin1.user._id, instanceName)).toBe(true);

    await deleteMemberships(group._id, admin1.user._id);

    expect(await hasPermission(admin1.user._id, instanceName)).toBe(false);

    const mapResult = await mapFarmOSInstanceToUser(user2.user._id, instanceName, false, origin);

    /**
     * user2 is not admin, so does not have permission
     */
    expect(await hasPermission(user2.user._id, instanceName)).toBe(false);

    const instances = await listFarmOSInstancesForUser(user2.user._id);
    expect(instances.length).toBe(1);

    await unmapFarmOSInstance(mapResult._id + '');
    expect(await hasPermission(user2.user._id, instanceName)).toBe(false);

    const instancesAfter = await listFarmOSInstancesForUser(user2.user._id);
    expect(instancesAfter.length).toBe(0);
  });
});
