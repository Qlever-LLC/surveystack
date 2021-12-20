const { deburr, kebabCase, uniqueId } = jest.requireActual('lodash');
const { ObjectId } = jest.requireActual('mongodb');
const { getDb }  = jest.requireActual('../db');
const { createUserDoc } = jest.requireActual('../services/auth.service');
const { getRoles } = jest.requireActual('../services/roles.service');

export const createSuperAdmin = async () => {
  return await createUser({ permissions: ['super-admin'] });
};

export const createUser = async (overrides = {}) => {
  const fakeId = uniqueId();
  const defaults = {
    email: `user${fakeId}@email.com`,
    name: `User Number${fakeId}`,
  };
  const user = createUserDoc({ ...defaults, ...overrides });
  const result = await getDb().collection('users').insertOne(user);
  return result.ops[0];
};

export const createGroup = async (_overrides = {}) => {
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

  const result = await getDb().collection('groups').insertOne(doc);

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

export const asMongoId = (source) =>
  source instanceof ObjectId ? source : ObjectId(typeof source === 'string' ? source : source._id);

export const createMembership = async (_overrides = {}) => {
  const { user, group, ...overrides } = _overrides;
  const doc = {
    user: asMongoId(user),
    group: asMongoId(group),
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
  const result = await getDb().collection('memberships').insertOne(doc);

  return result.ops[0];
};

export const createReq = ({ body = {}, params = {}, query = {}, headers = {} } = {}) => ({
  body,
  params,
  query,
  headers: {
    origin: 'https://surveystack.io',
    ...headers,
  },
});

export const createRes = async ({ user = null } = {}) => ({
  send: jest.fn(),
  redirect: jest.fn(),
  locals: {
    auth: {
      isAuthenticated: !!user,
      isSuperAdmin: user && user.permissions.includes('super-admin'),
      user,
      roles: user ? await getRoles(user._id) : [],
    },
  },
});
