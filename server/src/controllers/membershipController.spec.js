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
  return result.ops[0];
};

const toId = (source) => new ObjectId(typeof source === 'string' ? source : source._id);

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

describe.only('updateMembership', () => {
  it.only('works', async () => {
    const adminMember = await createUser();
    const userMember = await createUser();
    const group = await createGroup();
    await createMembership({ user: adminMember, group, role: 'admin' });
    const userMembership = await createMembership({ user: userMember, group, role: 'user' });
    const req = createReq({
      body: {
        group: group._id,
        role: 'admin',
      },
      params: { id: userMembership._id },
    });
    const res = await createRes({ user: adminMember })

    await updateMembership(req, res);

    const updatedUserMembership = await db
      .collection('memberships')
      .findOne({ _id: toId(userMembership) });
    expect(updatedUserMembership.role).toBe('admin');
  });
});
