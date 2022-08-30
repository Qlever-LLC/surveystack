import mockAxios from 'axios';
import { createGroup, createReq, createRes, createUser } from '../../testUtils';
import { getAscendantGroups, getDescendantGroups } from '../roles.service';
import {
  mapFarmOSInstanceToUser,
  listFarmOSInstancesForUser,
  listFarmOSInstancesForGroup,
  createPlan,
  getPlans,
  getPlanForGroup,
  deletePlan,
  setPlanForGroup,
  getGroupInformation,
  createFarmOSInstanceForUserAndGroup,
  createFarmosGroupSettings,
  getGroupSettings,
  setGroupSettings,
  getTree,
  addFarmToUser,
  removeFarmFromUser,
  addFarmToSurveystackGroup,
  removeFarmFromSurveystackGroup,
  getSuperAllFarmosMappings,
  unmapFarmOSInstance,
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
  it('addFarmToUser && removeFarmFromUser in same group', async () => {
    const { group, admin1, user1 } = await init();
    const farmOSInstanceName = 'test.surveystack.io';
    await addFarmToUser(farmOSInstanceName, user1.user._id, group._id, true);
    let results = await listFarmOSInstancesForUser(user1.user._id);
    expect(results[0].instanceName).toBe(farmOSInstanceName);
    await removeFarmFromUser(farmOSInstanceName, user1.user._id, group._id);
    results = await listFarmOSInstancesForUser(user1.user._id);
    expect(results.length).toBe(0);

    const farmOSInstanceNameBis = 'test2.surveystack.io';
    await addFarmToUser(farmOSInstanceName, user1.user._id, group._id, true);
    await expect(
      addFarmToUser(farmOSInstanceName, user1.user._id, group._id, true)
    ).rejects.toThrow(/mapping already exists/);

    await addFarmToUser(farmOSInstanceNameBis, user1.user._id, group._id, true);
    results = await listFarmOSInstancesForUser(user1.user._id);
    expect(results.length).toBe(2);
    await removeFarmFromUser(farmOSInstanceName, user1.user._id, group._id);
    results = await listFarmOSInstancesForUser(user1.user._id);
    expect(results.length).toBe(1);
    expect(results[0].instanceName).toBe(farmOSInstanceNameBis);
  });
  it('addFarmToUser && removeFarmFromUser in differents groups', async () => {
    const { group, admin1, user1 } = await init();
    const init2 = await init();
    const farmOSInstanceName = 'test.surveystack.io';
    const farmOSInstanceNameBis = 'test2.surveystack.io';
    await addFarmToUser(farmOSInstanceName, user1.user._id, group._id, true);
    await expect(
      addFarmToUser(farmOSInstanceName, user1.user._id, init2.group._id, true)
    ).rejects.toThrow(/mapping already exists/);

    await addFarmToUser(farmOSInstanceNameBis, user1.user._id, init2.group._id, true);
    let results = await listFarmOSInstancesForUser(user1.user._id);
    expect(results.length).toBe(2);
    await removeFarmFromUser(farmOSInstanceName, user1.user._id, group._id);
    results = await listFarmOSInstancesForUser(user1.user._id);
    expect(results.length).toBe(1);
    expect(results[0].instanceName).toBe(farmOSInstanceNameBis);
  });
  it('mapFarmOSInstanceToUser and unmapFarmOSInstance', async () => {
    const { group, admin1, user1 } = await init();
    const farmOSInstanceName = 'test.surveystack.io';
    const farmOSInstanceName2 = 'test2.surveystack.io';
    const res = await mapFarmOSInstanceToUser(user1.user._id, farmOSInstanceName, true);
    const idFirstMap = res._id;
    const results = await listFarmOSInstancesForUser(user1.user._id);

    expect(results[0].instanceName).toBe(farmOSInstanceName);
    expect(results[0].owner).toBe(true);

    await mapFarmOSInstanceToUser(user1.user._id, farmOSInstanceName2, true);
    const res1 = await listFarmOSInstancesForUser(user1.user._id);
    expect(res1.length).toBe(2);

    await unmapFarmOSInstance(idFirstMap);
    const res2 = await listFarmOSInstancesForUser(user1.user._id);
    expect(res2.length).toBe(1);
  });

  it('create instance admin access', async () => {
    const { group, admin1, user1 } = await init();
    const farmOSInstanceName = 'test.surveystack.io';
    const someAdminFarmOSInstanceName = 'admin.surveystack.io';
    await mapFarmOSInstanceToUser(user1.user._id, farmOSInstanceName, true);
    await mapFarmOSInstanceToUser(admin1.user._id, someAdminFarmOSInstanceName, true);
    await mapFarmOSInstanceToUser(admin1.user._id, farmOSInstanceName, false);

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
  it('addFarmToSurveystackGroup && removeFarmFromSurveystackGroup', async () => {
    const { group, admin1, user1 } = await init();
    const farmOSInstanceName = 'test.surveystack.io';

    await addFarmToSurveystackGroup(farmOSInstanceName, group._id);
    let results = await listFarmOSInstancesForGroup(group._id);
    expect(results[0].instanceName).toBe(farmOSInstanceName);

    await expect(addFarmToSurveystackGroup(farmOSInstanceName, group._id)).rejects.toThrow(
      /mapping already exists/
    );

    await removeFarmFromSurveystackGroup(farmOSInstanceName, group._id);
    results = await listFarmOSInstancesForGroup(group._id);
    expect(results.length).toBe(0);
  });
  it('getSuperAllFarmosMappings', async () => {
    //aggregatorFarms part
    const farmosAggregatorResponse = [
      {
        url: 'test1.farmos.net',
        tags: `/test-group/`,
      },
      {
        url: 'test2.farmos.net',
        tags: `/test-group/child`,
      },
    ];

    let res = { data: farmosAggregatorResponse };
    mockAxios.get.mockImplementation(() => Promise.resolve(res));

    process.env = {
      FARMOS_AGGREGATOR_URL: 'x',
      FARMOS_AGGREGATOR_APIKEY: 'x',
    };

    const init1 = await init();
    const init2 = await init();
    //surveystackFarms part
    await addFarmToSurveystackGroup('farmOSInstanceNameA', init1.group._id);
    await addFarmToSurveystackGroup('farmOSInstanceNameA', init2.group._id);
    await expect(addFarmToSurveystackGroup('farmOSInstanceNameA', init1.group._id)).rejects.toThrow(
      /mapping already exists/
    );

    //surveystackUserFarms part
    await addFarmToUser('farmOSInstanceNameB', init1.user1.user._id, init1.group._id, true);
    await expect(
      addFarmToUser('farmOSInstanceNameB', init1.user1.user._id, init2.group._id, true)
    ).rejects.toThrow(/mapping already exists/);

    await addFarmToUser('farmOSInstanceNameB', init2.user1.user._id, init1.group._id, true);
    await expect(
      addFarmToUser('farmOSInstanceNameB', init2.user1.user._id, init2.group._id, true)
    ).rejects.toThrow(/mapping already exists/);

    const r = await getSuperAllFarmosMappings();
    expect(r.aggregatorFarms.length).toBe(2);
    expect(r.surveystackFarms.length).toBe(2);
    expect(r.surveystackUserFarms.length).toBe(2);
  });

  it('test-plans', async () => {
    const { group, admin1, user1 } = await init();

    // TODO create plan

    await createFarmosGroupSettings(group._id);

    await createPlan('test-plan-all');
    const plans = await getPlans();
    expect(plans.length).toBe(1);
    expect(plans[0].planName).toBe('test-plan-all');

    await setPlanForGroup(group._id, plans.find((it) => it.planName == 'test-plan-all')._id);
    const res = await getPlanForGroup(group._id);
    expect(res[0].planName).toBe('test-plan-all');

    await deletePlan(plans[0]._id);
    const deleted = await getPlans();
    expect(deleted.length).toBe(0);

    await setPlanForGroup(group._id, null);
    const nullPlan = await getPlanForGroup(group._id);
    expect(nullPlan).toStrictEqual([]);
  });
  it('getFarmOSRootGroup', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    await createFarmosGroupSettings(groupLabs._id);
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    const michiganTree = await getTree(groupMichigan);
    expect(michiganTree.domainRoot.name).toBe('Labs');

    const labsTree = await getTree(groupLabs);
    expect(labsTree.domainRoot.name).toBe('Labs');

    const bionutrientTree = await getTree(groupBionutrient);
    expect(bionutrientTree.domainRoot.name).toBe('Labs');
    expect(bionutrientTree.isDomainRooInDescendants()).toBeTruthy();
  });
  it('canBecomeFarmOSRootGroup', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupExt = await groupBionutrient.createSubGroup({ name: 'Ext' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    await createFarmosGroupSettings(groupLabs._id);
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    const michiganTree = await getTree(groupMichigan);

    const canBeRoot = michiganTree.canBecomeRoot();
    expect(canBeRoot).toBeFalsy();

    const labsTree = await getTree(groupLabs);
    const canBeRoot2 = labsTree.canBecomeRoot();
    expect(canBeRoot2).toBeFalsy();

    const extTree = await getTree(groupExt);
    const canBeRoot3 = extTree.canBecomeRoot();
    expect(canBeRoot3).toBeTruthy();

    const bionutrientTree = await getTree(groupBionutrient);
    const canBeRoot4 = bionutrientTree.canBecomeRoot();
    expect(canBeRoot4).toBeFalsy();
  });
  it('getTree group-descendants-ascendants', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    let bionutrientTree = await getTree(groupBionutrient);
    let labsTree = await getTree(groupLabs);
    let michiganTree = await getTree(groupMichigan);

    expect(bionutrientTree.group).toBe(groupBionutrient);
    expect(labsTree.group).toBe(groupLabs);
    expect(michiganTree.group).toBe(groupMichigan);

    //descendants
    expect(bionutrientTree.descendants[0].name).toBe(groupBionutrient.name);
    expect(bionutrientTree.descendants[1].name).toBe(groupLabs.name);
    expect(bionutrientTree.descendants[2].name).toBe(groupMichigan.name);

    expect(labsTree.descendants[0].name).toBe(groupLabs.name);
    expect(labsTree.descendants[1].name).toBe(groupMichigan.name);

    expect(michiganTree.descendants[0].name).toBe(groupMichigan.name);

    //ascendants
    expect(bionutrientTree.ascendants[0].name).toBe(groupBionutrient.name);

    expect(labsTree.ascendants[0].name).toBe(groupBionutrient.name);
    expect(labsTree.ascendants[1].name).toBe(groupLabs.name);

    expect(michiganTree.ascendants[0].name).toBe(groupBionutrient.name);
    expect(michiganTree.ascendants[1].name).toBe(groupLabs.name);
    expect(michiganTree.ascendants[2].name).toBe(groupMichigan.name);
  });
  it('getTree breadcrumbsByPath', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    let bionutrientTree = await getTree(groupBionutrient);
    let labsTree = await getTree(groupLabs);
    let michiganTree = await getTree(groupMichigan);
    const expectedResult = {
      '/bionutrient/': 'Bionutrient',
      '/bionutrient/labs/': 'Bionutrient > Labs',
      '/bionutrient/labs/michigan/': 'Bionutrient > Labs > Michigan',
    };

    expect(bionutrientTree.breadcrumbsByPath).toStrictEqual(expectedResult);
    expect(labsTree.breadcrumbsByPath).toStrictEqual(expectedResult);
    expect(michiganTree.breadcrumbsByPath).toStrictEqual(expectedResult);
  });
  it('getTree domainInformation', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs2 = await groupBionutrient.createSubGroup({ name: 'Labs2' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    await createFarmosGroupSettings(groupLabs._id);

    let bionutrientTree = await getTree(groupBionutrient);
    let labs2Tree = await getTree(groupLabs2);
    let labsTree = await getTree(groupLabs);
    let michiganTree = await getTree(groupMichigan);

    const bioResult = await bionutrientTree.domainInformation();
    const labs2Result = await labs2Tree.domainInformation();
    const labsResult = await labsTree.domainInformation();
    const michResult = await michiganTree.domainInformation();

    expect(bioResult).toBe(null);
    expect(labs2Result).toBe(null);
    expect(labsResult.maxSeats).toBe(20);
    expect(labsResult.name).toBe('Bionutrient > Labs');
    expect(labsResult.seats).toBe(0);
    expect(michResult.maxSeats).toBe(20);
    expect(michResult.name).toBe('Bionutrient > Labs > Michigan');
    expect(michResult.seats).toBe(0);
  });
  it('getGroupInformation', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });
    const groupEurope = await groupLabs.createSubGroup({ name: 'Europe' });
    const groupCommunity = await groupLabs.createSubGroup({ name: 'Community' });
    const groupCommunityLab = await groupCommunity.createSubGroup({ name: 'Lab' });

    const froeignGroup = await createGroup({ name: 'Foreign' });

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
    await addFarmToSurveystackGroup(admin1_farmOSInstance2, groupMichigan._id);
    const admin1_farmOSInstance3 = 'ourscinet.farmos.net';
    await createFarmOSInstanceForUserAndGroup(
      admin1.user._id,
      groupLabs._id,
      admin1_farmOSInstance3,
      false
    );
    await addFarmToSurveystackGroup(admin1_farmOSInstance3, groupMichigan._id);
    await addFarmToSurveystackGroup(admin1_farmOSInstance3, groupEurope._id);
    await addFarmToSurveystackGroup(admin1_farmOSInstance3, groupCommunity._id);
    await addFarmToSurveystackGroup(admin1_farmOSInstance3, groupCommunityLab._id);
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

    const user2_farmOSInstance2 = 'foreigninstance.farmos.net';
    await createFarmOSInstanceForUserAndGroup(
      user2.user._id,
      froeignGroup._id,
      user2_farmOSInstance2,
      true
    );

    // create subgroup "Bio > Ext"
    const groupExt = await groupBionutrient.createSubGroup({ name: 'Ext' });
    const userext_data = { userOverrides: { name: 'Ext ernal', email: 'external@bj.net' } };
    const userext = await groupExt.createUserMember(userext_data);
    const userext_farmOSInstance1 = 'external.farmos.net';
    const external_farmos_net_data = await createFarmOSInstanceForUserAndGroup(
      userext.user._id,
      groupExt._id,
      userext_farmOSInstance1,
      true
    );
    const { _id: idExternal1 } = await addFarmToSurveystackGroup(
      userext_farmOSInstance1,
      groupMichigan._id
    );
    const userext_data2 = { userOverrides: { name: 'Ext ernal2', email: 'external2@bj.net' } };
    const userext2 = await groupExt.createUserMember(userext_data2);
    const userext_farmOSInstance2 = 'external2.farmos.net';
    const external2_farmos_net_data = await createFarmOSInstanceForUserAndGroup(
      userext2.user._id,
      groupExt._id,
      userext_farmOSInstance2,
      true
    );
    const { _id: idExternal2 } = await addFarmToSurveystackGroup(
      userext_farmOSInstance2,
      groupMichigan._id
    );

    //FederalMills
    const groupFederalMills = await createGroup({ name: 'FederalMills' });
    const groupX = await groupFederalMills.createSubGroup({ name: 'FMX' });

    await createFarmosGroupSettings(groupLabs._id);

    const groupLabsInfos = await getGroupInformation(groupLabs._id, true);
    // console.log('INFORMATION', groupLabsInfos);

    expect(groupLabsInfos.groupHasFarmOSAccess).toBeTruthy();
    expect(groupLabsInfos.groupHasCoffeeShopAccess).toBeFalsy();
    expect(groupLabsInfos.allowSubgroupsToJoinCoffeeShop).toBeFalsy();
    expect(groupLabsInfos.allowSubgroupAdminsToCreateFarmOSInstances).toBeFalsy();
    expect(groupLabsInfos.seats.current).toBe(7);
    expect(groupLabsInfos.seats.max).toBe(20);
    expect(groupLabsInfos.name).toBe('Bionutrient > Labs');
    expect(groupLabsInfos.members).toHaveLength(3);
    expect(groupLabsInfos.members[0].admin).toBeTruthy();
    expect(groupLabsInfos.members[0].breadcrumb).toBe('Bionutrient > Labs');
    expect(groupLabsInfos.members[0].email).toBe('teravestdan@gmail.com');
    expect(groupLabsInfos.members[0].connectedFarms).toHaveLength(4);
    expect(groupLabsInfos.members[0].connectedFarms[0].instanceName).toBe(
      'dan_teravest_farm.farmos.net'
    );
    expect(groupLabsInfos.members[0].connectedFarms[0].groups).toHaveLength(1);
    expect(groupLabsInfos.members[0].connectedFarms[0].groups[0].breadcrumb).toBe(
      'Bionutrient > Labs'
    );
    expect(groupLabsInfos.members[0].connectedFarms[1].instanceName).toBe('lees_farm.farmos.net');
    expect(groupLabsInfos.members[0].connectedFarms[1].groups).toHaveLength(2);
    expect(groupLabsInfos.members[0].connectedFarms[1].groups[0].breadcrumb).toBe(
      'Bionutrient > Labs'
    );
    expect(groupLabsInfos.members[0].connectedFarms[1].groups[1].breadcrumb).toBe(
      'Bionutrient > Labs > Michigan'
    );
    expect(groupLabsInfos.members[0].connectedFarms[2].instanceName).toBe('ourscinet.farmos.net');
    expect(groupLabsInfos.members[0].connectedFarms[2].groups).toHaveLength(5);
    expect(groupLabsInfos.members[0].connectedFarms[2].groups[0].breadcrumb).toBe(
      'Bionutrient > Labs'
    );
    expect(groupLabsInfos.members[0].connectedFarms[2].groups[1].breadcrumb).toBe(
      'Bionutrient > Labs > Michigan'
    );
    expect(groupLabsInfos.members[0].connectedFarms[2].groups[2].breadcrumb).toBe(
      'Bionutrient > Labs > Europe'
    );
    expect(groupLabsInfos.members[0].connectedFarms[2].groups[3].breadcrumb).toBe(
      'Bionutrient > Labs > Community'
    );
    expect(groupLabsInfos.members[0].connectedFarms[2].groups[4].breadcrumb).toBe(
      'Bionutrient > Labs > Community > Lab'
    );
    expect(groupLabsInfos.members[0].connectedFarms[3].instanceName).toBe('coffeeshop.farmos.net');
    expect(groupLabsInfos.members[0].connectedFarms[3].groups).toHaveLength(1);
    expect(groupLabsInfos.members[0].connectedFarms[3].groups[0].breadcrumb).toBe(
      'Bionutrient > Labs > Michigan'
    );

    expect(groupLabsInfos.members[1].admin).toBe(false);
    expect(groupLabsInfos.members[1].breadcrumb).toBe('Bionutrient > Labs');
    expect(groupLabsInfos.members[1].email).toBe('djole2352@gmail.com');
    expect(groupLabsInfos.members[1].connectedFarms).toHaveLength(0);

    expect(groupLabsInfos.members[2].admin).toBe(false);
    expect(groupLabsInfos.members[2].breadcrumb).toBe('Bionutrient > Labs > Michigan');
    expect(groupLabsInfos.members[2].email).toBe('bigjenny@bj.net');
    expect(groupLabsInfos.members[2].connectedFarms).toHaveLength(2);
    expect(groupLabsInfos.members[2].connectedFarms[0].instanceName).toBe(
      'jennybigfarmstand.farmos.net'
    );
    expect(groupLabsInfos.members[2].connectedFarms[0].groups).toHaveLength(1);
    expect(groupLabsInfos.members[2].connectedFarms[0].groups[0].breadcrumb).toBe(
      'Bionutrient > Labs > Michigan'
    );

    expect(groupLabsInfos.unassignedInstances).toHaveLength(2);
    expect(groupLabsInfos.unassignedInstances[0].instanceName).toBe('external.farmos.net');
    expect(groupLabsInfos.unassignedInstances[0].breadcrumb).toBe('Bionutrient > Labs > Michigan');
    expect(groupLabsInfos.unassignedInstances[0]._id).toStrictEqual(idExternal1);
    expect(groupLabsInfos.unassignedInstances[1].instanceName).toBe('external2.farmos.net');
    expect(groupLabsInfos.unassignedInstances[1].breadcrumb).toBe('Bionutrient > Labs > Michigan');
    expect(groupLabsInfos.unassignedInstances[1]._id).toStrictEqual(idExternal2);
  });

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

    let bionutrientTree = await getTree(groupBionutrient);
    let labsTree = await getTree(groupLabs);
    let michiganTree = await getTree(groupMichigan);

    expect(await bionutrientTree.isFarmOSEnabled()).toBeFalsy();
    expect(await labsTree.isFarmOSEnabled()).toBeFalsy();
    expect(await michiganTree.isFarmOSEnabled()).toBeFalsy();

    await labsTree.enableFarmOS();
    michiganTree = await getTree(groupMichigan);
    bionutrientTree = await getTree(groupBionutrient);

    expect(await bionutrientTree.isFarmOSEnabled()).toBeFalsy();
    expect(await labsTree.isFarmOSEnabled()).toBeTruthy();
    expect(await michiganTree.isFarmOSEnabled()).toBeTruthy();

    await labsTree.disableFarmOS();
    michiganTree = await getTree(groupMichigan);
    bionutrientTree = await getTree(groupBionutrient);

    expect(await bionutrientTree.isFarmOSEnabled()).toBeFalsy();
    expect(await labsTree.isFarmOSEnabled()).toBeFalsy();
    expect(await michiganTree.isFarmOSEnabled()).toBeFalsy();
  });
  it('groupHasCoffeeShopAccess', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    let treeMichigan, treeLabs, treeBionutrient;

    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasCoffeeShopAccess()).toBeFalsy();
    expect(await treeLabs.hasCoffeeShopAccess()).toBeFalsy();
    expect(await treeMichigan.hasCoffeeShopAccess()).toBeFalsy();

    await treeLabs.enableFarmOS();
    await treeLabs.enableCoffeeShop();

    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasCoffeeShopAccess()).toBeFalsy();
    expect(await treeLabs.hasCoffeeShopAccess()).toBeTruthy();
    expect(await treeMichigan.hasCoffeeShopAccess()).toBeTruthy();

    await treeLabs.disableCoffeeShop();
    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasCoffeeShopAccess()).toBeFalsy();
    expect(await treeLabs.hasCoffeeShopAccess()).toBeFalsy();
    expect(await treeMichigan.hasCoffeeShopAccess()).toBeFalsy();
  });
  it('allowSubgroupsToJoinCoffeeShop', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    let treeBionutrient, treeMichigan, treeLabs;

    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();
    expect(await treeLabs.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();
    expect(await treeMichigan.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();

    await treeLabs.enableFarmOS();
    await treeLabs.enableAllowSubgroupsToJoinCoffeeShop();

    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();
    expect(await treeLabs.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();
    expect(await treeMichigan.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();

    await treeLabs.enableCoffeeShop();
    await treeLabs.enableAllowSubgroupsToJoinCoffeeShop();

    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();
    expect(await treeLabs.hasAllowSubgroupsToJoinCoffeeShop()).toBeTruthy();
    expect(await treeMichigan.hasAllowSubgroupsToJoinCoffeeShop()).toBeTruthy();

    await treeLabs.disableAllowSubgroupsToJoinCoffeeShop();

    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();
    expect(await treeLabs.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();
    expect(await treeMichigan.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();

    await treeLabs.enableAllowSubgroupsToJoinCoffeeShop();
    await treeLabs.disableCoffeeShop();

    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();
    expect(await treeLabs.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();
    expect(await treeMichigan.hasAllowSubgroupsToJoinCoffeeShop()).toBeFalsy();
  });
  it('allowSubgroupAdminsToCreateFarmOSInstances', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });

    let treeBionutrient, treeMichigan, treeLabs;

    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();
    expect(await treeLabs.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();
    expect(await treeMichigan.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();

    await treeLabs.enableAllowSubgroupAdminsToCreateFarmOSInstances();

    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();
    expect(await treeLabs.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();
    expect(await treeMichigan.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();

    await treeLabs.enableFarmOS();
    await treeLabs.enableAllowSubgroupAdminsToCreateFarmOSInstances();

    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();
    expect(await treeLabs.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeTruthy();
    expect(await treeMichigan.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeTruthy();

    await treeLabs.disableAllowSubgroupAdminsToCreateFarmOSInstances();

    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();
    expect(await treeLabs.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();
    expect(await treeMichigan.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();

    await treeLabs.enableAllowSubgroupAdminsToCreateFarmOSInstances();
    await treeLabs.disableFarmOS();

    treeMichigan = await getTree(groupMichigan);
    treeLabs = await getTree(groupLabs);
    treeBionutrient = await getTree(groupBionutrient);

    expect(await treeBionutrient.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();
    expect(await treeLabs.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();
    expect(await treeMichigan.hasAllowSubgroupAdminsToCreateFarmOSInstances()).toBeFalsy();
  });
});
