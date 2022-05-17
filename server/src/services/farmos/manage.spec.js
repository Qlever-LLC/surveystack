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
  setPlanForGroup,
  getGroupInformation,
  listUsersForGroup,
  createFarmOSInstanceForUserAndGroup,
  mapFarmOSInstanceToGroup,
  createFarmosGroupSettings,
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

    // TODO create plan

    await setPlanForGroup(group._id, 'test-plan');
    const res = await getPlanForGroup(group._id);
    expect(res).toBe('test-plan');

    await createPlan('test-plan-all');
    const plans = await getPlans();
    expect(plans.length).toBe(1);
    expect(plans[0].planName).toBe('test-plan-all');

    await deletePlan(plans[0]._id);
    const deleted = await getPlans();
    expect(deleted.length).toBe(0);

    await setPlanForGroup(group._id, null);
    const nullPlan = await getPlanForGroup(group._id);
    expect(nullPlan).toBe(null);
  });
  it.only('test-group-settings', async () => {
    // TODO test farmos
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });
    const groupEurope = await groupLabs.createSubGroup({ name: 'Europe' });
    const groupCommunity = await groupLabs.createSubGroup({ name: 'Community' });
    const groupCommunityLab = await groupCommunity.createSubGroup({ name: 'Lab' });

    const admin1_data = { userOverrides: { name: 'Dan TerAvest', email: 'teravestdan@gmail.com' } };
    const admin1 = await groupLabs.createAdminMember(admin1_data);
    const user1_data = { userOverrides: { name: 'Dave Jole', email: 'djole2352@gmail.com' } };
    const user1 = await groupLabs.createUserMember(user1_data);
    const user2_data = { userOverrides: { name: 'Jenny Jennerson', email: 'bigjenny@bj.net' } };
    const user2 = await groupLabs.createUserMember(user2_data);

    const admin1_farmOSInstance1 = 'dan_teravest_farm.farmos.net';
    await createFarmOSInstanceForUserAndGroup(
      admin1.user._id,
      groupLabs._id,
      admin1_farmOSInstance1,
      true
    );
    const admin1_farmOSInstance2 = 'lees_farm.farmos.net';
    await createFarmOSInstanceForUserAndGroup(
      admin1.user._id,
      groupLabs._id,
      admin1_farmOSInstance2,
      true
    );
    await mapFarmOSInstanceToGroup(groupMichigan._id, admin1_farmOSInstance2);
    const admin1_farmOSInstance3 = 'ourscinet.farmos.net';
    await createFarmOSInstanceForUserAndGroup(
      admin1.user._id,
      groupLabs._id,
      admin1_farmOSInstance3,
      false
    );
    await mapFarmOSInstanceToGroup(groupMichigan._id, admin1_farmOSInstance3);
    await mapFarmOSInstanceToGroup(groupEurope._id, admin1_farmOSInstance3);
    await mapFarmOSInstanceToGroup(groupCommunity._id, admin1_farmOSInstance3);
    await mapFarmOSInstanceToGroup(groupCommunityLab._id, admin1_farmOSInstance3);
    const admin1_farmOSInstance4 = 'coffeeshop.farmos.net';
    await createFarmOSInstanceForUserAndGroup(
      admin1.user._id,
      groupMichigan._id,
      admin1_farmOSInstance4,
      false
    );

    const user2_farmOSInstance1 = 'jennybigfarmstand.farmos.net';
    await createFarmOSInstanceForUserAndGroup(
      user2.user._id,
      groupLabs._id,
      user2_farmOSInstance1,
      true
    );
    await mapFarmOSInstanceToGroup(groupMichigan._id, user2_farmOSInstance1);

    // create subgroup "Bio > Ext"
    const groupExt = await groupBionutrient.createSubGroup({ name: 'Ext' });
    /*const userext_data = { userOverrides: { name: 'Ext ernal', email: 'external@bj.net' } };
    const userext = await groupExt.createUserMember(userext_data);
    const userext_farmOSInstance1 = 'external.farmos.net';
    await createFarmOSInstanceForUserAndGroup(
      userext.user._id,
      groupExt._id,
      userext_farmOSInstance1,
      true
    );
    await mapFarmOSInstanceToGroup(groupMichigan._id, userext_farmOSInstance1);
*/
    await createFarmosGroupSettings(groupLabs._id);
    //await createFarmosGroupSettings(groupBionutrient._id);
    //await createFarmosGroupSettings(groupCommunityLab._id);

    const infos = await getGroupInformation(groupLabs._id);
    //console.log(JSON.stringify(infos, null, 2));

    // setup admins
    // setup users
    // setup group-settings
    // test return value of getGroupInformation

    // expect statements
    // expect(groupInformation.groupHasFarmOSAccess).toBe(true);
  });
});
