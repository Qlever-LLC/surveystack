import { createGroup, createReq, createSuperAdmin } from '../testUtils';
import groupController from './groupController';
const { updateGroup } = groupController;

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

function mockRes(userId, isSuperAdmin, existingGroupDB) {
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
        isSuperAdmin: isSuperAdmin,
        user: {
          _id: userId,
        },
      },
      existing: existingGroupDB,
    },
  };
}

function getCreateReq(group) {
  return createReq({
    params: group._id,
    body: {
      _id: group._id,
      meta: {
        archived: true,
        specVersion: group.meta.specVersion,
        invitationOnly: group.meta.invitationOnly,
      },
      name: group.name,
      slug: group.slug,
      dir: group.dir,
      path: group.path,
      surveys: {
        pinned: [],
      },
    },
  });
}

describe('group-controller', () => {
  it("user from the group can't archive it", async () => {
    const { group, user1 } = await init();
    const req = getCreateReq(group);
    const res = mockRes(user1.user._id, false, group);
    await expect(updateGroup(req, res)).rejects.toThrow(
      'You are not authorized: admin@' + group.path
    );
  });

  it('admin from the group can archive it', async () => {
    const { group, admin1 } = await init();
    const req = getCreateReq(group);
    const res = mockRes(admin1.user._id, false, group);
    await updateGroup(req, res);
  });

  it("admin from an other group can't archive it", async () => {
    const { group } = await init();
    const { admin1 } = await init();
    const req = getCreateReq(group);
    const res = mockRes(admin1.user._id, false, group);
    await expect(updateGroup(req, res)).rejects.toThrow(
      'You are not authorized: admin@' + group.path
    );
  });

  it('super admin can archive any group', async () => {
    const { group } = await init();
    const superAdmin = await createSuperAdmin();
    const req = getCreateReq(group);
    const res = mockRes(superAdmin._id, true, group);
    await updateGroup(req, res);
  });
});
