import boom from '@hapi/boom';

import { ObjectId } from 'mongodb';
const { getDb } = require('../db');

import {
  getFarmOSInstances,
  getAssets,
  getLogs,
  webhookCallback,
  checkUrl,
  superAdminCreateFarmOsInstance,
  groupAdminMinimumGetGroupInformation,
} from './farmosController';
import { createGroup, createReq, createRes, createUser } from '../testUtils';
import {
  mapFarmOSInstanceToUser,
  mapFarmOSInstanceToGroupAdmin,
  setPlanForGroup,
  getGroupInformation,
  createFarmosGroupSettings,
} from '../services/farmos/manage';
import * as farmosManageModule from '../services/farmos/manage';
import {
  assetResponse,
  logResponse,
  createFieldResponse,
} from '../services/farmos/__mock__/farmos.asset.response';

import mockAxios from 'axios';

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

describe('farmos-controller', () => {
  it('get-farmos-instances', async () => {
    const { group, admin1, user1 } = await init();

    await mapFarmOSInstanceToUser(user1.user._id, 'user.farmos.dev', true);

    const res = mockRes(user1.user._id);
    await getFarmOSInstances({}, res);

    expect(res.data.length).toEqual(1);
    expect(res.data[0].userId).toEqual(user1.user._id);
    expect(res.data[0].instanceName).toEqual('user.farmos.dev');
  });

  it('get-farmos-instances-not-logged-in', async () => {
    const { group, admin1, user1 } = await init();

    await mapFarmOSInstanceToUser(user1.user._id, 'farm1.farmos.dev', true);

    const res = mockRes('');
    await expect(getFarmOSInstances({}, res)).rejects.toThrow(boom.unauthorized());
  });

  it('get-instances-for-admin', async () => {
    const { group, admin1, user1 } = await init();

    await mapFarmOSInstanceToUser(user1.user._id, 'user-farm.farmos.dev', true);

    await mapFarmOSInstanceToGroupAdmin(admin1.user._id, group._id, 'user-farm.farmos.dev');
    await mapFarmOSInstanceToUser(admin1.user._id, 'admin-farm.farmos.dev', true);

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

  it('get-assets', async () => {
    jest.setTimeout(10000);

    mockAxios.get.mockImplementation(() => Promise.resolve({ data: assetResponse }));

    const user = await createUser();
    await mapFarmOSInstanceToUser(user._id, 'buddingmoonfarm.farmos.dev', true);

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
    await mapFarmOSInstanceToUser(user._id, 'buddingmoonfarm.farmos.dev', true);

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
      },
      {
        send,
      }
    );
    expect(send).toHaveBeenCalledWith({ status: 'success', response: '' });
  });

  it('requires-env-secrets-skipping', async () => {});

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

  /*it('get-assets', async () => {
    mockAxios.get.mockImplementation(() => Promise.resolve({ data: assetResponse }));

    const user = await createUser();
    await mapFarmOSInstanceToUser(user._id, 'buddingmoonfarm.farmos.dev', true);

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
});
