import boom from '@hapi/boom';
import mockAxios from 'axios';
import _ from 'lodash';
import { ObjectId } from 'mongodb';
const { getDb } = require('../db');

import * as manage from '../services/farmos/manage';

jest.spyOn(manage, 'sendUserMoveFarmFromMultGroupToMultSurveystackGroupNotification');
jest.spyOn(manage, 'sendUserAddFarmToMultipleSurveystackGroupNotification');
jest.spyOn(manage, 'sendUserRemoveFarmFromMultipleSurveystackGroupsNotification');

import {
  getFarmOSInstances,
  getAssets,
  getLogs,
  webhookCallback,
  checkUrl,
  superAdminCreateFarmOsInstance,
  groupAdminMinimumGetGroupInformation,
  removeMembershipHook,
  mapUser,
  getDomain,
  addNotes,
  addSuperAdminNotes,
  updateOwnership,
  removeInstanceFromUser,
  deleteInstance,
  removeInstanceFromGroup,
  removeInstanceFromOtherUser,
  extractOwnerUsersMappedInst,
  updateGroupsForUser,
} from './farmosController';
import { createGroup, createReq, createRes, createUser } from '../testUtils';
import {
  mapFarmOSInstanceToUser,
  addFarmToSurveystackGroupAndSendNotification,
  removeFarmFromSurveystackGroupAndSendNotification,
  setPlanForGroup,
  getGroupInformation,
  createFarmosGroupSettings,
} from '../services/farmos/manage';
import * as farmosManageModule from '../services/farmos/manage';
import {
  sendUserMoveFarmFromMultGroupToMultSurveystackGroupNotification,
  sendUserRemoveFarmFromMultipleSurveystackGroupsNotification,
  sendUserAddFarmToMultipleSurveystackGroupNotification,
} from '../services/farmos/manage';
import {
  assetResponse,
  logResponse,
  createFieldResponse,
} from '../services/farmos/__mock__/farmos.asset.response';

import membershipController from './membershipController';

jest.mock('../services/mail/mail.service');

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

process.env.FARMOS_CALLBACK_KEY = 'x';
process.env.FARMOS_AGGREGATOR_URL = 'x';
process.env.FARMOS_AGGREGATOR_APIKEY = 'x';

const origin = 'url';

function mockRes(userId) {
  return {
    data: null,
    s: null,
    status: function (s) {
      this.s = s;
      return this;
    },
    send: function (r) {
      this.data = r;
      return this;
    },
    locals: {
      auth: {
        user: {
          _id: userId,
        },
      },
    },
  };
}

function mockResSuperAdmin(booleanValue) {
  return {
    data: null,
    s: null,
    status: function (s) {
      this.s = s;
      return this;
    },
    send: function (r) {
      this.data = r;
      return this;
    },
    locals: {
      auth: {
        isSuperAdmin: booleanValue,
      },
    },
  };
}

const createFarmOSDomain = async (gs) => {
  const group = await createGroup();
  await createFarmosGroupSettings(group._id);

  const res = {
    group,
  };

  const farms = [];

  for (const [name, u] of Object.entries(gs)) {
    const user = u.admin ? await group.createAdminMember() : await group.createUserMember();
    res[name] = user;

    if (!u.farms) {
      continue;
    }

    for (const farm of u.farms) {
      farms.push(farm);
      await mapFarmOSInstanceToUser(user.user._id, farm, true, origin);
    }
  }
  for (const farm of _.uniq(farms)) {
    await addFarmToSurveystackGroupAndSendNotification(farm, group._id, origin);
  }

  return res;
};

describe('farmos-controller', () => {
  it('get-farmos-instances', async () => {
    const { group, admin1, user1 } = await init();

    await mapFarmOSInstanceToUser(user1.user._id, 'user.farmos.dev', true, origin);

    const res = mockRes(user1.user._id);
    await getFarmOSInstances({}, res);

    expect(res.data.length).toEqual(1);
    expect(res.data[0].userId).toEqual(user1.user._id);
    expect(res.data[0].instanceName).toEqual('user.farmos.dev');
  });

  it('get-farmos-instances-not-logged-in', async () => {
    const { group, admin1, user1 } = await init();

    await mapFarmOSInstanceToUser(user1.user._id, 'farm1.farmos.dev', true, origin);

    const res = mockRes('');
    await expect(getFarmOSInstances({}, res)).rejects.toThrow(boom.unauthorized());
  });

  it('get-instances-for-admin', async () => {
    const { group, admin1, user1 } = await init();

    await mapFarmOSInstanceToUser(user1.user._id, 'user-farm.farmos.dev', true, origin);

    await mapFarmOSInstanceToUser(admin1.user._id, 'user-farm.farmos.dev', false, origin);
    await mapFarmOSInstanceToUser(admin1.user._id, 'admin-farm.farmos.dev', true, origin);

    const userRes = mockRes(user1.user._id);
    await getFarmOSInstances({}, userRes);

    const adminRes = mockRes(admin1.user._id);

    await getFarmOSInstances({}, adminRes);

    expect(userRes.data.length).toEqual(1);
    const farms = adminRes.data.map((a) => a.instanceName);
    expect(farms).toEqual(
      expect.arrayContaining(['admin-farm.farmos.dev', 'user-farm.farmos.dev'])
    );
  });

  it('add 1 note', async () => {
    const note = 'this is a note';
    const instanceName = 'farmos.net';
    const parentGroup = await createGroup({ name: 'GroupA' });
    const groupAA = await parentGroup.createSubGroup({ name: 'GroupAA' });
    const groupAB = await parentGroup.createSubGroup({ name: 'GroupAB' });
    const user1 = await parentGroup.createUserMember();
    await mapFarmOSInstanceToUser(user1.user._id, instanceName, true, origin);
    const parentGroupId = parentGroup._id;
    await addFarmToSurveystackGroupAndSendNotification(instanceName, parentGroupId, origin);
    await addFarmToSurveystackGroupAndSendNotification(instanceName, groupAA._id, origin);
    const affectedGroupIds = [parentGroupId, groupAA._id];

    const req = createReq({
      body: {
        note: note,
        instanceName: instanceName,
        parentGroupId: parentGroupId,
        groupIds: affectedGroupIds,
        timestamp: new Date(),
      },
    });
    const res = await createRes({ status: 'ok' });
    await addNotes(req, res);

    const db = getDb();
    const instanceNote = await db.collection('farmos-instance-notes').findOne({
      instanceName: instanceName,
    });
    expect(instanceNote.instanceName).toEqual(instanceName);
    expect(instanceNote.note).toContain(note);
    expect(instanceNote.note).toContain(parentGroup.name);
    expect(instanceNote.note).toContain(groupAA.name);
  });

  it('add 2 notes for 1 instance', async () => {
    const note1 = 'this is the first note';
    const note2 = 'this is the second note';
    const instanceName = 'farmos.net';
    const parentGroup = await createGroup({ name: 'GroupA' });
    const groupAA = await parentGroup.createSubGroup({ name: 'GroupAA' });
    const groupAB = await parentGroup.createSubGroup({ name: 'GroupAB' });
    const user1 = await parentGroup.createUserMember();
    await mapFarmOSInstanceToUser(user1.user._id, instanceName, true, origin);
    const parentGroupId = parentGroup._id;
    await addFarmToSurveystackGroupAndSendNotification(instanceName, parentGroupId, origin);
    await addFarmToSurveystackGroupAndSendNotification(instanceName, groupAA._id, origin);
    const affectedGroupIds = [parentGroupId, groupAA._id];

    const res = await createRes({ status: 'ok' });
    const req1 = createReq({
      body: {
        note: note1,
        instanceName: instanceName,
        parentGroupId: parentGroupId,
        groupIds: affectedGroupIds,
        timestamp: new Date(),
      },
    });
    await addNotes(req1, res);

    const req2 = createReq({
      body: {
        note: note2,
        instanceName: instanceName,
        parentGroupId: parentGroupId,
        groupIds: affectedGroupIds,
        timestamp: new Date(),
      },
    });
    await addNotes(req2, res);

    const db = getDb();
    const instanceNote = await db.collection('farmos-instance-notes').findOne({
      instanceName: instanceName,
    });
    expect(instanceNote.instanceName).toEqual(instanceName);
    expect(instanceNote.note).toContain(note1);
    expect(instanceNote.note).toContain(note2);
    expect(instanceNote.note).toContain(parentGroup.name);
    expect(instanceNote.note).toContain(groupAA.name);
  });

  it('reject adding 1 note to unauthorized group', async () => {
    const note = 'this is a note';
    const instanceName = 'farmos.net';
    const parentGroup = await createGroup({ name: 'GroupA' });
    const groupAA = await parentGroup.createSubGroup({ name: 'GroupAA' });
    const groupAB = await parentGroup.createSubGroup({ name: 'GroupAB' });
    const extGroup = await createGroup({ name: 'GroupZ' });
    const user1 = await parentGroup.createUserMember();
    await mapFarmOSInstanceToUser(user1.user._id, instanceName, true, origin);
    const parentGroupId = parentGroup._id;
    await addFarmToSurveystackGroupAndSendNotification(instanceName, parentGroupId, origin);
    await addFarmToSurveystackGroupAndSendNotification(instanceName, groupAA._id, origin);
    const affectedGroupIds = [parentGroupId, groupAA._id, extGroup._id];

    const req = createReq({
      body: {
        note: note,
        instanceName: instanceName,
        parentGroupId: parentGroupId,
        groupIds: affectedGroupIds,
        timestamp: new Date(),
      },
    });
    const res = await createRes({ status: 'ok' });
    await expect(addNotes(req, res)).rejects.toThrow(/error: you don't have access/);

    const db = getDb();
    const instanceNote = await db.collection('farmos-instance-notes').findOne({
      instanceName: instanceName,
    });
    expect(instanceNote).toBe(null);
  });

  it('add 1 note as Super Admin', async () => {
    const note = 'this is a note';
    const instanceName = 'farmos.net';
    const parentGroup = await createGroup({ name: 'GroupA' });
    // the middleware checks that only a super admin has access
    const superAdmin = await parentGroup.createUserMember();
    await mapFarmOSInstanceToUser(superAdmin.user._id, instanceName, true, origin);
    const parentGroupId = parentGroup._id;
    await addFarmToSurveystackGroupAndSendNotification(instanceName, parentGroupId, origin);

    const req = createReq({
      body: {
        note: note,
        instanceName: instanceName,
        timestamp: new Date(),
      },
    });
    const res = await createRes({ status: 'ok' });
    await addSuperAdminNotes(req, res);

    const db = getDb();
    const instanceNote = await db.collection('farmos-instance-notes').findOne({
      instanceName: instanceName,
    });
    expect(instanceNote.instanceName).toEqual(instanceName);
    expect(instanceNote.note).toContain('Super Admin:');
    expect(instanceNote.note).toContain(note);
  });
  it('add 2 notes for 1 instance as Super Admin', async () => {
    const note1 = 'this is the first note';
    const note2 = 'this is the second note';
    const instanceName = 'farmos.net';
    const parentGroup = await createGroup({ name: 'GroupA' });
    const superAdmin = await parentGroup.createUserMember();
    await mapFarmOSInstanceToUser(superAdmin.user._id, instanceName, true, origin);
    const parentGroupId = parentGroup._id;
    await addFarmToSurveystackGroupAndSendNotification(instanceName, parentGroupId, origin);

    const res = await createRes({ status: 'ok' });
    const req1 = createReq({
      body: {
        note: note1,
        instanceName: instanceName,
        timestamp: new Date(),
      },
    });
    await addSuperAdminNotes(req1, res);

    const req2 = createReq({
      body: {
        note: note2,
        instanceName: instanceName,
        timestamp: new Date(),
      },
    });
    await addSuperAdminNotes(req2, res);

    const db = getDb();
    const instanceNote = await db.collection('farmos-instance-notes').findOne({
      instanceName: instanceName,
    });
    expect(instanceNote.instanceName).toEqual(instanceName);
    expect(instanceNote.note).toContain('Super Admin:');
    expect(instanceNote.note).toContain(note1);
    expect(instanceNote.note).toContain(note2);
  });

  it('get-assets', async () => {
    jest.setTimeout(10000);

    mockAxios.get.mockImplementation(() => Promise.resolve({ data: assetResponse }));

    const user = await createUser();
    await mapFarmOSInstanceToUser(user._id, 'buddingmoonfarm.farmos.dev', true, origin);

    const res = mockRes(user._id);
    const send = jest.fn();
    res.send = send;
    await getAssets(
      {
        body: {
          bundle: 'plant',
        },
        query: {
          bundle: 'plant',
        },
      },
      res
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        assets: expect.arrayContaining([
          expect.objectContaining({
            name: 'Block B bed 12 Kale',
            id: 'a89f2dfe-35f6-4bfb-b079-be7c034a7f24',
            instanceName: 'buddingmoonfarm.farmos.dev',
          }),
          expect.objectContaining({
            name: 'spinach 8/26/20 ',
            id: '626dec74-7f46-4c85-bc0e-76f69bcb7b41',
            instanceName: 'buddingmoonfarm.farmos.dev',
          }),
        ]),
      })
    );
  });

  it('get-logs', async () => {
    jest.setTimeout(10000);

    mockAxios.get.mockImplementation(() => Promise.resolve({ data: logResponse }));

    const user = await createUser();
    await mapFarmOSInstanceToUser(user._id, 'buddingmoonfarm.farmos.dev', true, origin);

    const res = mockRes(user._id);
    await getLogs(
      {
        body: {
          bundle: 'activity',
        },
      },
      res
    );

    expect(res.data.assets).toEqual(
      expect.arrayContaining([
        {
          id: '190e2daf-4efd-4db6-a472-179a29de2ad0',
          name: 'Test activity log via API',
          instance: 'buddingmoonfarm.farmos.dev',
        },
        {
          id: 'd4640163-bab7-4b9f-b35c-6dcc3099aa69',
          name: 'Test activity log via API',
          instance: 'buddingmoonfarm.farmos.dev',
        },
      ])
    );
  });
  it('webhook-create-fields', async () => {
    mockAxios.post.mockImplementation(() => Promise.resolve({ data: createFieldResponse }));
    jest.resetModules();

    const db = getDb();
    await db.collection('farmos.fields').insertOne({
      url: 'oursci.farmos.dev',
      fields: [
        {
          name: 'Unit Test Field',
          wkt: 'POLYGON ((-84.34150323269021 42.77962447110511, -84.34129044408108 42.77962315868189, -84.34125289315487 42.77938035618669, -84.34148535132407 42.77938298110345, -84.34150323269021 42.77962447110511))',
        },
      ],
    });

    const send = jest.fn();

    await webhookCallback(
      {
        query: {
          key: 'x',
        },
        body: {
          url: 'oursci.farmos.dev',
          plan: 'oursci',
          status: 'ready',
        },
      },
      {
        send,
      },
      () => {}
    );
    expect(send).toHaveBeenCalledWith({ status: 'success' });

    const dbstate = await db.collection('farmos.webhookrequests').find().toArray();
    expect(dbstate.length).toBe(2);
    expect(dbstate[1].state).toBe('success');
    expect(dbstate[1].url).toBe('oursci.farmos.dev');
  });
  it('test-farmos-check-url', async () => {
    mockAxios.post.mockImplementation(() => Promise.resolve({ status: 200 }));

    process.env.FARMOS_CALLBACK_KEY = 'x';
    process.env.FARMOS_AGGREGATOR_URL = 'x';
    process.env.FARMOS_AGGREGATOR_APIKEY = 'x';
    process.env.FARMOS_CREATE_KEY = 'x';

    const send = jest.fn();

    await checkUrl(
      {
        body: {
          url: 'oursci-unit-test',
        },
      },
      { send }
    );

    expect(send).toHaveBeenCalledWith({ status: 'free' });

    mockAxios.post.mockImplementation(() => Promise.resolve({ status: 400 }));

    await checkUrl(
      {
        body: {
          url: 'oursci-unit-test',
        },
      },
      { send }
    );

    expect(send).toHaveBeenCalledWith({ status: 'taken' });
  });

  it('create-farmos-instance', async () => {
    process.env.FARMOS_CALLBACK_KEY = 'x';
    process.env.FARMOS_AGGREGATOR_URL = 'x';
    process.env.FARMOS_AGGREGATOR_APIKEY = 'x';
    process.env.FARMOS_CREATE_KEY = 'x';

    const { group, admin1, user1 } = await init();

    // TODO create Plan (id, name, url)
    setPlanForGroup(group._id, 'unit-test-plan');

    let body = {
      groupId: group._id + '',
      url: 'oursci-farm',
      agree: true,
    };

    const send = jest.fn();

    mockAxios.post.mockImplementation(() => Promise.resolve({ status: 202, data: '' }));
    await superAdminCreateFarmOsInstance(
      {
        body,
        headers: { origin: origin },
      },
      {
        send,
      }
    );

    expect(send).toHaveBeenCalledWith({ errors: ['email: "email" is required'] });

    body = {
      groupId: group._id + '',
      url: 'oursci-farm',
      email: 'test@our-sci.net',
      farmName: 'unit test farm',
      fullName: 'Unit tester',
      farmAddress: 'Unit Farm Address',
      units: 'metric',
      timezone: 'US/Eastern',
      planName: 'unit-plan',
      owner: user1.user._id + '',
      agree: true,
      fields: [
        {
          name: 'Field 1',
          wkt: 'POLYGON()',
        },
      ],
    };

    await superAdminCreateFarmOsInstance(
      {
        body,
        headers: { origin: origin },
      },
      {
        send,
      }
    );
    expect(send).toHaveBeenCalledWith({ status: 'success', response: '' });
  });

  it('requires-env-secrets-skipping', async () => {});

  it('farmos-groupAdminMinimumGetGroupInformation works fine', async () => {
    const group = await createGroup({ name: 'Bionutrient' });
    const admin1_data = { userOverrides: { name: 'Dan TerAvest', email: 'teravestdan@gmail.com' } };
    const admin1 = await group.createAdminMember(admin1_data);
    const user1_data = { userOverrides: { name: 'Dave Jole', email: 'djole2352@gmail.com' } };
    const user1 = await group.createUserMember(user1_data);
    await createFarmosGroupSettings(group._id);
    const req = { params: { groupId: group._id } };
    const res = mockResSuperAdmin(true);
    await groupAdminMinimumGetGroupInformation(req, res);
    console.log('RES-1', res);

    expect(res.data.status).toStrictEqual('success');
    expect(res.data.response.groupId).toStrictEqual(group._id);
    expect(res.data.response.members.length).toBe(2);
  });
  it('farmos-groupAdminMinimumGetGroupInformation error with passed groupId', async () => {
    const group = await createGroup({ name: 'Bionutrient' });
    await createFarmosGroupSettings(group._id);
    let grpId = new ObjectId();
    while (group._id === grpId) {
      grpId = new ObjectId();
    }
    const req = { params: { groupId: grpId } };
    const res = mockResSuperAdmin(true);

    await expect(groupAdminMinimumGetGroupInformation(req, res)).rejects.toThrow(
      boom.notFound(`No group found: ${grpId}`)
    );
    console.log('RES-2', res);
  });
  it.skip('farmos-groupAdminMinimumGetGroupInformation error by executing the service', async () => {
    // TODO, fix case

    const group = await createGroup({ name: 'Bionutrient' });
    await createFarmosGroupSettings(group._id);
    const groupExt = await createGroup({ name: 'exterior' });
    const req = { params: { groupId: groupExt._id } };
    const res = mockResSuperAdmin(true);

    const spy = jest.spyOn(farmosManageModule, 'getGroupInformation');
    spy.mockImplementation(() => Promise.reject({ message: 'custom error detected' }));

    await groupAdminMinimumGetGroupInformation(req, res);
    console.log('RES-3', res);

    expect(res.data.status).toStrictEqual('error');
    expect(res.data.message).toStrictEqual('custom error detected');
  });

  const removeMemberWithFarm = async (domain, admin, member) => {
    let res = mockRes(admin.user._id);
    let req = { params: { groupId: domain.group._id } };

    await groupAdminMinimumGetGroupInformation(req, res);
    const membersBefore = res.data.response.members;

    const connectedFarmsBefore = _.uniq(
      membersBefore.flatMap((m) => m.connectedFarms.flatMap((c) => c.instanceName))
    );
    res = mockRes(admin.user._id);
    req = { params: { id: member.membership._id }, headers: { origin: origin } };

    await membershipController.deleteMembership(req, res, undefined, async (membership) => {
      await removeMembershipHook(membership, origin);
    });

    res = mockRes(member.user._id);
    req = {};

    await getFarmOSInstances(req, res);
    const usersInstancesAfter = res.data.map((f) => f.instanceName);

    res = mockRes(admin.user._id);
    req = { params: { groupId: domain.group._id } };

    res = mockRes(admin.user._id);
    req = { params: { groupId: domain.group._id } };
    await groupAdminMinimumGetGroupInformation(req, res);
    const membersAfter = res.data.response.members;

    const connectedFarmsAfter = membersAfter.flatMap((m) => m.connectedFarms);

    return {
      connectedFarmsBefore,
      connectedFarmsAfter,
      usersInstancesAfter,
      membersAfter,
    };
  };

  it('remove-user-with-mapped-farm', async () => {
    // create group structure
    // map farms to users and group
    // admin removes member
    // farmos instance is still mapped to user
    // farmos instance is not mapped to group anymore

    const groupStructure = {
      a1: {
        admin: true,
      },
      u1: {
        farms: ['test1@farmos.net', 'test2@farmos.net'],
      },
      u2: {
        farms: [],
      },
    };

    const farmosDomain = await createFarmOSDomain(groupStructure);

    const { connectedFarmsBefore, connectedFarmsAfter, usersInstancesAfter, membersAfter } =
      await removeMemberWithFarm(farmosDomain, farmosDomain.a1, farmosDomain.u1);

    expect(connectedFarmsBefore).toEqual(
      expect.arrayContaining(['test1@farmos.net', 'test2@farmos.net'])
    );

    expect(connectedFarmsAfter.length).toBe(0); // no more farm connected to group
    expect(membersAfter.length).toBe(2); // admin and u2
    expect(usersInstancesAfter).toEqual(
      expect.arrayContaining(['test1@farmos.net', 'test2@farmos.net'])
    );
  });

  it('remove-user-with-mapped-farm-other-user-has-same-farm-mapped', async () => {
    const groupStructure = {
      a1: {
        admin: true,
      },
      u1: {
        farms: ['test1@farmos.net', 'test2@farmos.net'],
      },
      u2: {
        farms: ['test1@farmos.net'],
      },
    };

    const farmosDomain = await createFarmOSDomain(groupStructure);

    const { connectedFarmsBefore, connectedFarmsAfter, usersInstancesAfter, membersAfter } =
      await removeMemberWithFarm(farmosDomain, farmosDomain.a1, farmosDomain.u1);

    expect(connectedFarmsBefore).toEqual(
      expect.arrayContaining(['test1@farmos.net', 'test2@farmos.net'])
    );

    expect(connectedFarmsAfter.length).toBe(1);
    expect(membersAfter.length).toBe(2);
    expect(usersInstancesAfter).toEqual(
      expect.arrayContaining(['test1@farmos.net', 'test2@farmos.net'])
    );
  });

  it('remove-user-with-mapped-farm-three-users', async () => {
    const groupStructure = {
      a1: {
        admin: true,
        farms: ['test3@farmos.net'],
      },
      u1: {
        farms: ['test1@farmos.net'],
      },
      u2: {
        farms: ['test1@farmos.net'],
      },
    };

    const farmosDomain = await createFarmOSDomain(groupStructure);

    const { connectedFarmsBefore, connectedFarmsAfter, usersInstancesAfter, membersAfter } =
      await removeMemberWithFarm(farmosDomain, farmosDomain.a1, farmosDomain.u1);

    expect(connectedFarmsBefore.length).toBe(2);
    expect(connectedFarmsBefore).toEqual(
      expect.arrayContaining(['test1@farmos.net', 'test3@farmos.net'])
    );

    expect(connectedFarmsAfter.length).toBe(2);
    expect(membersAfter.length).toBe(2);
    expect(usersInstancesAfter).toEqual(expect.arrayContaining(['test1@farmos.net']));
  });

  it('map-user', async () => {
    // check that user is in group
    // check that user has access to instance and is owner
    // or that instance is assigned to group
    // check instance not already mapped
    // const group = await createGroup({ name: 'Bionutrient' });
    // const admin = await group.createAdminMember();
    // const user = await group.createUserMember();
    // await mapFarmOSInstanceToUser(user.user._id, 'userinstance.farmos.net', true, origin);
    // const req = {
    //   params: { groupId: group._id + "" },
    //   body: {
    //     instanceName: "userinstance.farmos.net",
    //     userId: admin.user._id + "",
    //   }
    // };
    // const res = {
    //   send: jest.fn(),
    //   locals: {
    //     auth: {
    //       user: {
    //         _id: admin,
    //       },
    //     },
    //   },
    // }
    // await mapUser(req, res);
    // expect(res.send).toHaveBeenCalledWith({ status: "ok" })
  });

  /*it('get-assets', async () => {
    mockAxios.get.mockImplementation(() => Promise.resolve({ data: assetResponse }));

    const user = await createUser();
    await mapFarmOSInstanceToUser(user._id, 'buddingmoonfarm.farmos.dev', true, origin);

    const res = mockRes(user._id);
    const send = jest.fn();
    res.send = send;
    await getAssets(
      {
        body: {
          bundle: 'plant',
        },
        query: {
          bundle: 'plant',
        },
      },
      res
    );*/

  it('update Ownership success', async () => {
    const instanceName = 'instanceName';
    const user1 = await createUser();
    const user2 = await createUser();
    await mapFarmOSInstanceToUser(user1._id, instanceName, true, origin);
    const newOwnerEmail = user2.email;

    const req = createReq({
      body: {
        instanceName,
        newOwnerEmail,
      },
    });
    const res = mockRes(user1._id);

    await updateOwnership(req, res);

    const db = getDb();
    const instanceLinkedToUser1 = await db.collection('farmos-instances').findOne({
      instanceName: instanceName,
      userId: user1._id,
    });
    expect(instanceLinkedToUser1.owner).toEqual(false);
    const instanceLinkedToUser2 = await db.collection('farmos-instances').findOne({
      instanceName: instanceName,
      userId: user2._id,
    });
    expect(instanceLinkedToUser2.owner).toEqual(true);
  });
  it('update Ownership error', async () => {
    const instanceName = 'instanceName';
    const user1 = await createUser();
    const user2FakeEmail = 'email@fake.com';
    await mapFarmOSInstanceToUser(user1._id, instanceName, true, origin);

    const req = createReq({
      body: {
        instanceName,
        newOwnerEmail: user2FakeEmail,
      },
    });
    const res = mockRes(user1._id);

    await expect(updateOwnership(req, res)).rejects.toThrow(/user doesn't exist/);

    const db = getDb();
    const instanceLinkedToUser1 = await db.collection('farmos-instances').findOne({
      instanceName: instanceName,
      userId: user1._id,
    });
    expect(instanceLinkedToUser1.owner).toEqual(true);
  });
  it('remove Instance From User success', async () => {
    const instanceName = 'instanceName';
    const user = await createUser();
    await mapFarmOSInstanceToUser(user._id, instanceName, true, origin);

    const req = createReq({
      body: {
        instanceName,
      },
    });
    const res = mockRes(user._id);

    await removeInstanceFromUser(req, res);

    const db = getDb();
    const coupleExists = await db.collection('farmos-instances').findOne({
      instanceName: instanceName,
      userId: user._id,
    });
    expect(coupleExists).toEqual(null);
  });
  it('remove Instance From User error', async () => {
    const instanceName = 'instanceName';
    const user1 = await createUser();
    await mapFarmOSInstanceToUser(user1._id, instanceName, true, origin);
    const wrongInstanceName = 'wrongInstanceName';

    const req = createReq({
      body: {
        instanceName: wrongInstanceName,
      },
    });
    const res = mockRes(user1._id);

    await expect(removeInstanceFromUser(req, res)).rejects.toThrow(
      /You don't have access to this instance/
    );

    const db = getDb();
    const coupleExists = await db.collection('farmos-instances').findOne({
      instanceName: wrongInstanceName,
      userId: user1._id,
    });
    expect(coupleExists).toEqual(null);
  });

  it('delete Instance success', async () => {
    const instanceName = 'instanceName';
    const { group, admin1, user1 } = await init();
    const user = user1.user;
    await mapFarmOSInstanceToUser(user._id, instanceName, true, origin);
    await addFarmToSurveystackGroupAndSendNotification(instanceName, group._id, origin);

    const req = createReq({
      body: {
        instanceName,
      },
    });
    const res = mockRes(user._id);
    const db = getDb();

    let coupleInstExists = await db.collection('farmos-instances').findOne({
      instanceName,
      userId: user._id,
    });
    expect(coupleInstExists.instanceName).toEqual(instanceName);
    let coupleGrpExists = await db.collection('farmos-group-mapping').findOne({
      instanceName,
      groupId: group._id,
    });
    expect(coupleGrpExists.instanceName).toEqual(instanceName);

    await deleteInstance(req, res);

    coupleInstExists = await db.collection('farmos-instances').findOne({
      instanceName,
      userId: user._id,
    });
    expect(coupleInstExists).toEqual(null);
    coupleGrpExists = await db.collection('farmos-group-mapping').findOne({
      instanceName,
      userId: user._id,
    });
    expect(coupleGrpExists).toEqual(null);
  });
  it('delete Instance error', async () => {
    const instanceName = 'instanceName';
    const { group, admin1, user1 } = await init();
    const user = user1.user;
    await mapFarmOSInstanceToUser(user._id, instanceName, true, origin);

    const req = createReq({
      body: {
        instanceName,
      },
    });
    const res = mockRes(user._id);
    const db = getDb();

    await expect(deleteInstance(req, res)).rejects.toThrow(
      /This instance is not mapped in a group/
    );

    const coupleInstExists = await db.collection('farmos-instances').findOne({
      instanceName,
      userId: user._id,
    });
    expect(coupleInstExists.instanceName).toEqual(instanceName);
    const coupleGrpExists = await db.collection('farmos-group-mapping').findOne({
      instanceName,
      userId: user._id,
    });
    expect(coupleGrpExists).toEqual(null);
  });

  it('remove Instance From Group success', async () => {
    const instanceName = 'instanceName';
    const { group, admin1, user1 } = await init();
    const user = user1.user;
    await mapFarmOSInstanceToUser(user._id, instanceName, true, origin);
    await addFarmToSurveystackGroupAndSendNotification(instanceName, group._id, origin);

    const req = createReq({
      body: {
        instanceName,
        groupId: String(group._id),
      },
    });
    const res = mockRes(user._id);

    await removeInstanceFromGroup(req, res);

    const db = getDb();
    const coupleExists = await db.collection('farmos-group-mapping').findOne({
      instanceName: instanceName,
      groupId: group._id,
    });
    expect(coupleExists).toEqual(null);
  });

  it('remove Instance From Group error', async () => {
    const instanceName = 'instanceName';
    const { group, admin1, user1 } = await init();
    const user = user1.user;
    await mapFarmOSInstanceToUser(user._id, instanceName, true, origin);

    const req = createReq({
      body: {
        instanceName,
        groupId: String(group._id),
      },
    });
    const res = mockRes(user._id);

    await expect(removeInstanceFromGroup(req, res)).rejects.toThrow(
      /This instance is not mapped in a group/
    );

    const db = getDb();
    const coupleExists = await db.collection('farmos-group-mapping').findOne({
      instanceName: instanceName,
      groupId: group._id,
    });
    expect(coupleExists).toEqual(null);
  });

  it('remove Instance From Other User succes', async () => {
    const instanceName = 'instanceName';
    const user = await createUser();
    await mapFarmOSInstanceToUser(user._id, instanceName, true, origin);

    const req = createReq({
      body: {
        instanceName,
        userId: String(user._id),
      },
    });
    const res = mockRes(user._id);

    await removeInstanceFromOtherUser(req, res);

    const db = getDb();
    const coupleExists = await db.collection('farmos-instances').findOne({
      instanceName: instanceName,
      userId: user._id,
    });
    expect(coupleExists).toEqual(null);
  });
  it('remove Instance From Other User error', async () => {
    const instanceName = 'instanceName';
    const user = await createUser();
    await mapFarmOSInstanceToUser(user._id, instanceName, true, origin);
    const wrongInstanceName = 'wrongInstanceName';

    const req = createReq({
      body: {
        instanceName: wrongInstanceName,
        userId: String(user._id),
      },
    });
    const res = mockRes(user._id);

    await expect(removeInstanceFromOtherUser(req, res)).rejects.toThrow(
      /This instance is not mapped to user/
    );

    const db = getDb();
    const coupleExists = await db.collection('farmos-instances').findOne({
      instanceName: wrongInstanceName,
      userId: user._id,
    });
    expect(coupleExists).toEqual(null);
  });

  it('extractOwnerUsersMappedInst', async () => {
    const instanceA = 'instanceA.net';
    const instanceB = 'instanceB.net';
    const instanceC = 'instanceC.net';
    const user1 = await createUser();
    const user2 = await createUser();
    const user3 = await createUser();

    await mapFarmOSInstanceToUser(user1._id, instanceA, true, origin);
    await mapFarmOSInstanceToUser(user1._id, instanceB, true, origin);
    await mapFarmOSInstanceToUser(user1._id, instanceC, true, origin);

    await mapFarmOSInstanceToUser(user2._id, instanceA, true, origin);
    await mapFarmOSInstanceToUser(user2._id, instanceB, true, origin);

    await mapFarmOSInstanceToUser(user3._id, instanceA, true, origin);

    const instances = [instanceA, instanceB, instanceC];
    const db = getDb();
    const instancesObj = await db
      .collection('farmos-instances')
      .find({
        instanceName: {
          $in: instances,
        },
      })
      .toArray();
    const ownerUsers = await db
      .collection('users')
      .find(
        {
          _id: {
            $in: instancesObj.filter((i) => i.owner).map((i) => new ObjectId(i.userId)),
          },
        },
        {
          email: 1,
          name: 1,
        }
      )
      .toArray();

    const mergedData = extractOwnerUsersMappedInst(instancesObj, ownerUsers);

    const resA = {
      instanceName: instanceA,
      owners: [
        { email: user1.email, name: user1.name },
        { email: user2.email, name: user2.name },
        { email: user3.email, name: user3.name },
      ],
    };
    const resB = {
      instanceName: instanceB,
      owners: [
        { email: user1.email, name: user1.name },
        { email: user2.email, name: user2.name },
      ],
    };
    const resC = {
      instanceName: instanceC,
      owners: [{ email: user1.email, name: user1.name }],
    };

    expect(mergedData[0]).toEqual(resA);
    expect(mergedData[1]).toEqual(resB);
    expect(mergedData[2]).toEqual(resC);
  });

  it('updateGroupsForUser', async () => {
    const instanceName = 'test.farmos.net';
    const parentGroup = await createGroup({ name: 'Parent Group' });

    await createFarmosGroupSettings(parentGroup._id);

    const a = await parentGroup.createSubGroup({ name: 'A' });
    const b = await parentGroup.createSubGroup({ name: 'B' });
    const c = await parentGroup.createSubGroup({ name: 'C' });
    const d = await parentGroup.createSubGroup({ name: 'D' });

    const user = await parentGroup.createUserMember();
    const admin = await parentGroup.createAdminMember();

    await mapFarmOSInstanceToUser(user.user._id, instanceName, true, origin);

    const parentGroupId = parentGroup._id;

    await addFarmToSurveystackGroupAndSendNotification(instanceName, parentGroupId, origin);

    const addMethod = sendUserAddFarmToMultipleSurveystackGroupNotification;
    const moveMethod = sendUserMoveFarmFromMultGroupToMultSurveystackGroupNotification;
    const removeMethod = sendUserRemoveFarmFromMultipleSurveystackGroupsNotification;

    const runWithGroups = async (initial, updated, expectedMethod) => {
      // initialization process
      for (const grp of initial) {
        await addFarmToSurveystackGroupAndSendNotification(instanceName, grp._id, origin);
      }
      const res = mockRes(admin.user._id);
      const req = createReq({
        params: {
          groupId: parentGroup._id,
        },
        body: {
          userId: user.user._id + '',
          instanceName: instanceName,
          groupIds: updated.map((g) => g._id + ''),
        },
      });
      await updateGroupsForUser(req, res);
      expect(expectedMethod).toHaveBeenCalled();

      // clear process
      for (const grp of updated) {
        await removeFarmFromSurveystackGroupAndSendNotification(instanceName, grp._id, origin);
      }
    };

    await runWithGroups([a, c], [b, d], moveMethod);
    await runWithGroups([a, c], [a], removeMethod);
    await runWithGroups([a], [a, b, d], addMethod);

    await runWithGroups([a, b, c, d], [], removeMethod);
    await runWithGroups([], [a, b, c, d], addMethod);
  });
});
