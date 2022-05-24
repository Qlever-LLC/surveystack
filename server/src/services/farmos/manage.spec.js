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
  getFarmOSRootGroup,
  canBecomeFarmOSRootGroup,
  getArrayPathsConainedInPath,
  getUserFromUserId,
  getGroupFromGroupId,
  getRewrittenPathFromGroupPath,
  getGroupSettings,
  setGroupSettings,
  hasGroupFarmOSAccess,
  enableFarmOSAccessForGroup,
  disableFarmOSAccessForGroup,
  hasGroupCoffeeShopAccess,
  enableCoffeeShopAccessForGroup,
  disableCoffeeShopAccessForGroup,
  isAllowedSubgroupsToJoinCoffeeShop,
  enableSubgroupsToJoinCoffeeShop,
  disableSubgroupsToJoinCoffeeShop,
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
  it('getFarmOSRootGroup', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    await createFarmosGroupSettings(groupLabs._id);
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    const root = await getFarmOSRootGroup(groupMichigan);
    expect(root.name).toBe('Labs');

    const root2 = await getFarmOSRootGroup(groupLabs);
    expect(root2.name).toBe('Labs');

    const root3 = await getFarmOSRootGroup(groupBionutrient);
    expect(root3).toBeNull();
  });
  it('canBecomeFarmOSRootGroup', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupExt = await groupBionutrient.createSubGroup({ name: 'Ext' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    await createFarmosGroupSettings(groupLabs._id);
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    const canBeRoot = await canBecomeFarmOSRootGroup(groupMichigan._id);
    expect(canBeRoot).toBeFalsy();

    const canBeRoot2 = await canBecomeFarmOSRootGroup(groupLabs._id);
    expect(canBeRoot2).toBeFalsy();

    const canBeRoot3 = await canBecomeFarmOSRootGroup(groupExt._id);
    expect(canBeRoot3).toBeTruthy();

    const canBeRoot4 = await canBecomeFarmOSRootGroup(groupBionutrient._id);
    expect(canBeRoot4).toBeFalsy();
  });
  it('getArrayPathsConainedInPath', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    const paths = await getArrayPathsConainedInPath(groupMichigan.path);
    expect(paths).toStrictEqual([
      '/bionutrient/labs/michigan/',
      '/bionutrient/labs/',
      '/bionutrient/',
    ]);
  });
  it('getUserFromUserId', async () => {
    const group = await createGroup({ name: 'Bionutrient' });
    const admin_data = { userOverrides: { name: 'Dan TerAvest', email: 'teravestdan@gmail.com' } };
    const admin = await group.createAdminMember(admin_data);

    const userFound = await getUserFromUserId(admin.user._id);
    expect(userFound).toStrictEqual(admin.user);
  });
  it('getGroupFromGroupId', async () => {
    const group = await createGroup({ name: 'Bionutrient' });

    const groupFound = await getGroupFromGroupId(group._id);
    expect(groupFound.meta).toStrictEqual(group.meta);
    expect(groupFound.name).toBe(group.name);
    expect(groupFound.slug).toBe(group.slug);
    expect(groupFound.dir).toBe(group.dir);
    expect(groupFound.path).toBe(group.path);
    expect(groupFound.surveys).toStrictEqual(group.surveys);
    expect(groupFound._id).toStrictEqual(group._id);
  });
  it('getRewrittenPathFromGroupPath', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    const prettyPath = await getRewrittenPathFromGroupPath(groupMichigan.path);
    expect(prettyPath).toBe('Bionutrient > Labs > Michigan');
  });
  it('getGroupInformation', async () => {
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
    const user2 = await groupMichigan.createUserMember(user2_data);

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
      groupMichigan._id,
      user2_farmOSInstance1,
      true
    );

    // create subgroup "Bio > Ext"
    const groupExt = await groupBionutrient.createSubGroup({ name: 'Ext' });
    const userext_data = { userOverrides: { name: 'Ext ernal', email: 'external@bj.net' } };
    const userext = await groupExt.createUserMember(userext_data);
    const userext_farmOSInstance1 = 'external.farmos.net';
    await createFarmOSInstanceForUserAndGroup(
      userext.user._id,
      groupExt._id,
      userext_farmOSInstance1,
      true
    );
    await mapFarmOSInstanceToGroup(groupMichigan._id, userext_farmOSInstance1);
    const userext_data2 = { userOverrides: { name: 'Ext ernal2', email: 'external2@bj.net' } };
    const userext2 = await groupExt.createUserMember(userext_data2);
    const userext_farmOSInstance2 = 'external2.farmos.net';
    await createFarmOSInstanceForUserAndGroup(
      userext2.user._id,
      groupExt._id,
      userext_farmOSInstance2,
      true
    );
    await mapFarmOSInstanceToGroup(groupMichigan._id, userext_farmOSInstance2);

    //FederalMills
    const groupFederalMills = await createGroup({ name: 'FederalMills' });
    const groupX = await groupFederalMills.createSubGroup({ name: 'FMX' });

    await createFarmosGroupSettings(groupLabs._id);

    const groupLabsInfos = await getGroupInformation(groupLabs._id, true);
    //console.log('INFORMATIONS', JSON.stringify(groupLabsInfos, null, 2));

    expect(groupLabsInfos.groupHasFarmOSAccess).toBeTruthy();
    expect(groupLabsInfos.groupHasCoffeeShopAccess).toBeFalsy();
    expect(groupLabsInfos.allowSubgroupsToJoinCoffeeShop).toBeFalsy();
    expect(groupLabsInfos.allowSubgroupAdminsToCreateFarmOSInstances).toBeFalsy();
    expect(groupLabsInfos.seats.current).toBe(7);
    expect(groupLabsInfos.seats.max).toBe(20);
    expect(groupLabsInfos.name).toBe('Bionutrient > Labs');

    expect(groupLabsInfos.members).toHaveLength(3);
    expect(groupLabsInfos.members[0].role).toBeTruthy();
    expect(groupLabsInfos.members[0].location).toBe('Bionutrient > Labs');
    expect(groupLabsInfos.members[0].email).toBe('teravestdan@gmail.com');
    expect(groupLabsInfos.members[0].connectedFarms).toHaveLength(4);
    expect(groupLabsInfos.members[0].connectedFarms[0].instanceName).toBe(
      'dan_teravest_farm.farmos.net'
    );
    expect(groupLabsInfos.members[0].connectedFarms[0].memberships).toHaveLength(1);
    expect(groupLabsInfos.members[0].connectedFarms[0].memberships[0].path).toBe(
      'Bionutrient > Labs'
    );
    expect(groupLabsInfos.members[0].connectedFarms[1].instanceName).toBe('lees_farm.farmos.net');
    expect(groupLabsInfos.members[0].connectedFarms[1].memberships).toHaveLength(2);
    expect(groupLabsInfos.members[0].connectedFarms[1].memberships[0].path).toBe(
      'Bionutrient > Labs'
    );
    expect(groupLabsInfos.members[0].connectedFarms[1].memberships[1].path).toBe(
      'Bionutrient > Labs > Michigan'
    );
    expect(groupLabsInfos.members[0].connectedFarms[2].instanceName).toBe('ourscinet.farmos.net');
    expect(groupLabsInfos.members[0].connectedFarms[2].memberships).toHaveLength(5);
    expect(groupLabsInfos.members[0].connectedFarms[2].memberships[0].path).toBe(
      'Bionutrient > Labs'
    );
    expect(groupLabsInfos.members[0].connectedFarms[2].memberships[1].path).toBe(
      'Bionutrient > Labs > Michigan'
    );
    expect(groupLabsInfos.members[0].connectedFarms[2].memberships[2].path).toBe(
      'Bionutrient > Labs > Europe'
    );
    expect(groupLabsInfos.members[0].connectedFarms[2].memberships[3].path).toBe(
      'Bionutrient > Labs > Community'
    );
    expect(groupLabsInfos.members[0].connectedFarms[2].memberships[4].path).toBe(
      'Bionutrient > Labs > Community > Lab'
    );
    expect(groupLabsInfos.members[0].connectedFarms[3].instanceName).toBe('coffeeshop.farmos.net');
    expect(groupLabsInfos.members[0].connectedFarms[3].memberships).toHaveLength(1);
    expect(groupLabsInfos.members[0].connectedFarms[3].memberships[0].path).toBe(
      'Bionutrient > Labs > Michigan'
    );

    expect(groupLabsInfos.members[1].role).toBe('false');
    expect(groupLabsInfos.members[1].location).toBe('Bionutrient > Labs');
    expect(groupLabsInfos.members[1].email).toBe('djole2352@gmail.com');
    expect(groupLabsInfos.members[1].connectedFarms).toHaveLength(0);

    expect(groupLabsInfos.members[2].role).toBe('false');
    expect(groupLabsInfos.members[2].location).toBe('Bionutrient > Labs > Michigan');
    expect(groupLabsInfos.members[2].email).toBe('bigjenny@bj.net');
    expect(groupLabsInfos.members[2].connectedFarms).toHaveLength(1);
    expect(groupLabsInfos.members[2].connectedFarms[0].instanceName).toBe(
      'jennybigfarmstand.farmos.net'
    );
    expect(groupLabsInfos.members[2].connectedFarms[0].memberships).toHaveLength(1);
    expect(groupLabsInfos.members[2].connectedFarms[0].memberships[0].path).toBe(
      'Bionutrient > Labs > Michigan'
    );

    expect(groupLabsInfos.nonMembers).toHaveLength(2);
    expect(groupLabsInfos.nonMembers[0].instanceName).toBe('external.farmos.net');
    expect(groupLabsInfos.nonMembers[0].path).toBe('Bionutrient > Labs > Michigan');
    expect(groupLabsInfos.nonMembers[1].instanceName).toBe('external2.farmos.net');
    expect(groupLabsInfos.nonMembers[1].path).toBe('Bionutrient > Labs > Michigan');
  });

  //TODO unit test 'test-group-settings'
  it('createFarmosGroupSettings, getGroupSettings and setGroupSettings', async () => {
    const group = await createGroup({ name: 'Bionutrient' });

    await createFarmosGroupSettings(group._id);
    let groupFound = await getGroupSettings(group._id);
    expect(groupFound.groupHasFarmOSAccess).toBeTruthy();
    expect(groupFound.groupHasCoffeeShopAccess).toBeFalsy();
    expect(groupFound.allowSubgroupsToJoinCoffeeShop).toBeFalsy();
    expect(groupFound.allowSubgroupAdminsToCreateFarmOSInstances).toBeFalsy();

    await setGroupSettings(group._id, { groupHasCoffeeShopAccess: true });
    groupFound = await getGroupSettings(group._id);
    expect(groupFound.groupHasFarmOSAccess).toBeTruthy();
    expect(groupFound.groupHasCoffeeShopAccess).toBeTruthy();
    expect(groupFound.allowSubgroupsToJoinCoffeeShop).toBeFalsy();
    expect(groupFound.allowSubgroupAdminsToCreateFarmOSInstances).toBeFalsy();
  });
  it('groupHasGroupFarmOSAccess', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    expect(await hasGroupFarmOSAccess(groupBionutrient._id)).toBeFalsy();
    expect(await hasGroupFarmOSAccess(groupLabs._id)).toBeFalsy();
    expect(await hasGroupFarmOSAccess(groupMichigan._id)).toBeFalsy();

    await enableFarmOSAccessForGroup(groupLabs._id);
    expect(await hasGroupFarmOSAccess(groupBionutrient._id)).toBeFalsy();
    expect(await hasGroupFarmOSAccess(groupLabs._id)).toBeTruthy();
    expect(await hasGroupFarmOSAccess(groupMichigan._id)).toBeTruthy();

    await disableFarmOSAccessForGroup(groupLabs._id);
    expect(await hasGroupFarmOSAccess(groupBionutrient._id)).toBeFalsy();
    expect(await hasGroupFarmOSAccess(groupLabs._id)).toBeFalsy();
    expect(await hasGroupFarmOSAccess(groupMichigan._id)).toBeFalsy();
  });
  it('groupHasCoffeeShopAccess', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    expect(await hasGroupCoffeeShopAccess(groupBionutrient._id)).toBeFalsy();
    expect(await hasGroupCoffeeShopAccess(groupLabs._id)).toBeFalsy();
    expect(await hasGroupCoffeeShopAccess(groupMichigan._id)).toBeFalsy();

    await enableCoffeeShopAccessForGroup(groupLabs._id);
    expect(await hasGroupCoffeeShopAccess(groupBionutrient._id)).toBeFalsy();
    expect(await hasGroupCoffeeShopAccess(groupLabs._id)).toBeTruthy();
    expect(await hasGroupCoffeeShopAccess(groupMichigan._id)).toBeTruthy();

    await disableCoffeeShopAccessForGroup(groupLabs._id);
    expect(await hasGroupCoffeeShopAccess(groupBionutrient._id)).toBeFalsy();
    expect(await hasGroupCoffeeShopAccess(groupLabs._id)).toBeFalsy();
    expect(await hasGroupCoffeeShopAccess(groupMichigan._id)).toBeFalsy();
  });
  it('allowSubgroupsToJoinCoffeeShop', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupBionutrient._id)).toBeFalsy();
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupLabs._id)).toBeFalsy();
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupMichigan._id)).toBeFalsy();

    await enableSubgroupsToJoinCoffeeShop(groupLabs._id);
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupBionutrient._id)).toBeFalsy();
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupLabs._id)).toBeFalsy();
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupMichigan._id)).toBeFalsy();

    await enableCoffeeShopAccessForGroup(groupLabs._id);
    await enableSubgroupsToJoinCoffeeShop(groupLabs._id);
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupBionutrient._id)).toBeFalsy();
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupLabs._id)).toBeTruthy();
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupMichigan._id)).toBeTruthy();

    await disableSubgroupsToJoinCoffeeShop(groupLabs._id);
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupBionutrient._id)).toBeFalsy();
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupLabs._id)).toBeFalsy();
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupMichigan._id)).toBeFalsy();

    await enableSubgroupsToJoinCoffeeShop(groupLabs._id);
    await disableCoffeeShopAccessForGroup(groupLabs._id);
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupBionutrient._id)).toBeFalsy();
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupLabs._id)).toBeFalsy();
    expect(await isAllowedSubgroupsToJoinCoffeeShop(groupMichigan._id)).toBeFalsy();
  });
});
