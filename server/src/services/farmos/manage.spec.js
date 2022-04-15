import { createGroup, createReq, createRes, createUser } from '../../testUtils';
import {
  mapFarmOSInstanceToUser,
  listFarmOSInstancesForUser,
  mapFarmOSInstanceToGroupAdmin,
  listFarmOSInstancesForGroup,
  addFarmToSurveystackGroup,
  removeFarmFromSurveystackGroup,
  createPlan,
  getPlans,
  getPlanForGroup,
  deletePlan,
  setPlanNameForGroup,
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

    expect(results[0].instanceName).toBe(farmOSInstanceName);
    expect(results[0].owner).toBe(true);
  });

  it('create instance admin access', async () => {
    const { group, admin1, user1 } = await init();
    const farmOSInstanceName = 'test.surveystack.io';
    const someAdminFarmOSInstanceName = 'admin.surveystack.io';
    await mapFarmOSInstanceToUser(user1.user._id, farmOSInstanceName, true);
    await mapFarmOSInstanceToUser(admin1.user._id, someAdminFarmOSInstanceName, true);
    await mapFarmOSInstanceToGroupAdmin(admin1.user._id, group._id, farmOSInstanceName);

    const farms = await listFarmOSInstancesForUser(admin1.user._id);

    const adminsInstance = farms.find((f) => f.instanceName == someAdminFarmOSInstanceName);
    expect(adminsInstance).toBeDefined();
    expect(adminsInstance.owner).toBe(true);

    const usersInstance = farms.find((f) => f.instanceName == farmOSInstanceName);
    expect(usersInstance).toBeDefined();
    expect(usersInstance.owner).toBe(false);

    const results = await listFarmOSInstancesForUser(user1.user._id);
    expect(results.length).toBe(1);
    expect(results[0].instanceName).toBe(farmOSInstanceName);
    expect(results[0].owner).toBe(true);
  });
  it('map-and-unmap-instance-to-group', async () => {
    const { group, admin1, user1 } = await init();
    const farmOSInstanceName = 'test.surveystack.io';

    let list = await listFarmOSInstancesForGroup(group._id);

    expect(list.length).toBe(0);

    /*
    await addFarmToSurveystackGroup(farmOSInstanceName, group._id);

    await expect(addFarmToSurveystackGroup(farmOSInstanceName, group._id)).rejects.toThrow(
      /mapping already exists/
    );

    list = await listFarmOSInstancesForGroup(group._id);
    expect(list[0].instanceName).toBe('test.surveystack.io');

    await removeFarmFromSurveystackGroup(farmOSInstanceName, group._id);

    list = await listFarmOSInstancesForGroup(group._id);
    expect(list.length).toBe(0);
    */
  });

  it('test-plans', async () => {
    const { group, admin1, user1 } = await init();
    await setPlanNameForGroup(group._id, 'test-plan');
    const res = await getPlanForGroup(group._id);
    expect(res).toBe('test-plan');

    await createPlan('test-plan-all');
    const plans = await getPlans();
    expect(plans.length).toBe(1);
    expect(plans[0].planName).toBe('test-plan-all');

    await deletePlan(plans[0]._id);
    const deleted = await getPlans();
    expect(deleted.length).toBe(0);

    await setPlanNameForGroup(group._id, null);
    const nullPlan = await getPlanForGroup(group._id);
    expect(nullPlan).toBe(null);
  });
});
