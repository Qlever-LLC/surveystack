import membershipController from './membershipController';
const { updateMembership } = membershipController;
import { createUserDoc } from '../services/auth.service';
import { db } from '../db';
import { deburr, kebabCase, uniqueId } from 'lodash';
import { getRoles } from '../services/roles.service';
import { ObjectId } from 'mongodb';

const createSuperAdmin = async () => {
  return await createUser({ permissions: ['super-admin'] });
};

const createUser = async (overrides = {}) => {
  const fakeId = uniqueId();
  const defaults = {
    email: `user${fakeId}@email.com`,
    name: `User Number${fakeId}`,
  };
  const user = createUserDoc({ ...defaults, ...overrides });
  const result = await db.collection('users').insertOne(user);
  return result.ops[0];
};

const createGroup = async (_overrides = {}) => {
  const { name = `group ${uniqueId()}`, ...overrides } = _overrides;
  const doc = {
    meta: {
      archived: false,
      specVersion: 2,
      invitationOnly: true,
      ...overrides.meta,
    },
    name,
    slug: kebabCase(deburr(name)),
    dir: '/',
    path: `/${name}/`,
    surveys: {
      pinned: [],
      ...overrides.surveys,
    },
    ...overrides,
  };

  const result = await db.collection('groups').insertOne(doc);

  const createUserMember = async ({ userOverrides, membershipOverrides } = {}) => {
    const user = await createUser(userOverrides);
    const membership = await createMembership({
      user,
      group: result.insertedId,
      role: 'user',
      ...membershipOverrides,
    });
    return { user, membership };
  };
  const createAdminMember = async ({ userOverrides, membershipOverrides } = {}) => {
    return await createUserMember({
      userOverrides,
      membershipOverrides: { role: 'admin', ...membershipOverrides },
    });
  };

  return { ...result.ops[0], createUserMember, createAdminMember };
};

const toId = (source) =>
  source instanceof ObjectId ? source : ObjectId(typeof source === 'string' ? source : source._id);

const createMembership = async (_overrides = {}) => {
  const { user, group, ...overrides } = _overrides;
  const doc = {
    user: toId(user),
    group: toId(group),
    role: 'user',
    meta: {
      status: 'active',
      dateCreated: new Date(),
      dateSent: null,
      dateActivated: new Date(),
      invitationEmail: null,
      invitationCode: null,
      ...overrides.meta,
    },
    ...overrides,
  };
  const result = await db.collection('memberships').insertOne(doc);

  return result.ops[0];
};

const createReq = ({ body = {}, params = {} } = {}) => ({
  body,
  params,
});

const createRes = async ({ user = null } = {}) => ({
  send: jest.fn(),
  locals: {
    auth: {
      isAuthenticated: !!user,
      isSuperAdmin: user.permissions.includes('super-admin'),
      user,
      roles: await getRoles(user._id),
    },
  },
});

describe('updateMembership', () => {
  it('can update editable fields', async () => {
    const group = await createGroup();
    const admin = await group.createAdminMember();
    const user = await group.createUserMember();

    const req = createReq({
      body: {
        group: group._id,
        role: 'admin',
        meta: {
          invitationName: 'Changed Name',
          invitationEmail: 'something.different@email.com',
        },
      },
      params: { id: user.membership._id },
    });
    const res = await createRes({ user: admin.user });

    await updateMembership(req, res);

    const updatedUserMembership = await db
      .collection('memberships')
      .findOne({ _id: toId(user.membership) });
    expect(updatedUserMembership.role).toBe('admin');
    expect(updatedUserMembership.meta.invitationName).toBe('Changed Name');
    expect(updatedUserMembership.meta.invitationEmail).toBe(user.membership.meta.invitationEmail);
  });

  it("throws if the user isn't group admin", async () => {
    const group = await createGroup();
    const user1 = await group.createUserMember();
    const user2 = await group.createUserMember();
    const req = createReq({
      body: {
        group: group._id,
        role: 'admin',
      },
      params: { id: user2.membership._id },
    });
    const res = await createRes({ user: user1.user });

    await expect(updateMembership(req, res)).rejects.toThrow(
      'Only group admins can update memberships'
    );
  });
});
