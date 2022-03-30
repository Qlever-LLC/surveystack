import boom from '@hapi/boom';
import { getFarmOSInstances, getAssets, getLogs } from './farmos2Controller';
import { createGroup, createReq, createRes, createUser } from '../testUtils';
import {
  mapFarmOSInstanceToUser,
  mapFarmOSInstanceToGroupAdmin,
} from '../services/farmos-2/manage';

import { assetResponse, logResponse } from '../services/farmos-2/__mock__/farmos.asset.response';

import mockAxios from 'axios';

require('dotenv').config();

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

describe('farmos2controller', () => {
  it('get-farmos-instances', async () => {
    const user = await createUser();
    await mapFarmOSInstanceToUser(user._id, 'user.farmos.dev', true);

    const res = mockRes(user._id);
    await getFarmOSInstances({}, res);

    expect(res.data.length).toEqual(1);
    expect(res.data[0].userId).toEqual(user._id);
    expect(res.data[0].farmOSInstanceName).toEqual('user.farmos.dev');
  });

  it('get-farmos-instances-not-logged-in', async () => {
    const user = await createUser();
    await mapFarmOSInstanceToUser(user._id, 'farm1.farmos.dev', true);

    const res = mockRes('');
    await expect(getFarmOSInstances({}, res)).rejects.toThrow(boom.unauthorized());
  });

  it('get-instances-for-admin', async () => {
    const groupRes = await createGroup();
    const { createUserMember, createAdminMember } = groupRes;

    const { user } = await createUserMember();
    await mapFarmOSInstanceToUser(user._id, 'user-farm.farmos.dev', true);

    const { user: admin } = await createAdminMember();

    await mapFarmOSInstanceToGroupAdmin(admin._id, groupRes._id, 'user-farm.farmos.dev');
    await mapFarmOSInstanceToUser(admin._id, 'admin-farm.farmos.dev', true);

    const userRes = mockRes(user._id);
    await getFarmOSInstances({}, userRes);

    const adminRes = mockRes(admin._id);

    await getFarmOSInstances({}, adminRes);

    expect(userRes.data.length).toEqual(1);
    const farms = adminRes.data.map((a) => a.farmOSInstanceName);
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

    expect(res.data.assets).toEqual(
      expect.arrayContaining([
        {
          name: 'Block B bed 12 Kale',
          id: 'a89f2dfe-35f6-4bfb-b079-be7c034a7f24',
          instance: 'buddingmoonfarm.farmos.dev',
        },
        {
          name: 'spinach 8/26/20 ',
          id: '626dec74-7f46-4c85-bc0e-76f69bcb7b41',
          instance: 'buddingmoonfarm.farmos.dev',
        },
      ])
    );
  });

  it.only('get-logs', async () => {
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
});
