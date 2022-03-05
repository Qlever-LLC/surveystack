import boom from '@hapi/boom';
import { getFarmOSInstances, getAssets } from './farmos2Controller';
import { createGroup, createReq, createRes, createUser } from '../testUtils';
import {
  mapFarmOSInstanceToUser,
  mapFarmOSInstanceToGroupAdmin,
} from '../services/farmos-2/manage';

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
    await mapFarmOSInstanceToUser(user._id, 'farm1.farmos.dev', true);

    const res = mockRes(user._id);
    await getFarmOSInstances({}, res);

    expect(res.data.length).toEqual(1);
    expect(res.data[0].userId).toEqual(user._id);
    expect(res.data[0].farmOSInstanceName).toEqual('farm1.farmos.dev');
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
  
});
