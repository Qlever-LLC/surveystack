import getControlGenerator from './surveyControls';

const crypto = jest.requireActual('crypto');
const { deburr, kebabCase, uniqueId } = jest.requireActual('lodash');
const { ObjectId } = jest.requireActual('mongodb');
const { getDb } = jest.requireActual('../db');
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
    path: `/${kebabCase(deburr(name))}/`,
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

  const createSubGroup = async (nameObj) => {
    const { name } = nameObj;
    return await createGroup({
      name: name,
      dir: doc.path,
      path: doc.path + kebabCase(deburr(name)) + '/',
    });
  };

  return { ...result.ops[0], createUserMember, createAdminMember, createSubGroup };
};

export const asMongoId = (source) =>
  source instanceof ObjectId ? source : ObjectId(typeof source === 'string' ? source : source._id);

export const createMembership = async (_overrides = {}) => {
  const { user, group, ...overrides } = _overrides;
  const doc = {
    user: overrides.meta?.status === 'pending' ? null : asMongoId(user),
    group: asMongoId(group),
    role: 'user',
    meta: {
      status: 'active',
      dateCreated: new Date(),
      dateSent: null,
      dateActivated: new Date(),
      invitationEmail: null,
      invitationCode: crypto.randomBytes(32).toString('hex'),
      ...overrides.meta,
    },
    ...overrides,
  };
  const result = await getDb().collection('memberships').insertOne(doc);

  return result.ops[0];
};

export const deleteMemberships = async (groupId, userId) => {
  return await getDb()
    .collection('memberships')
    .deleteMany({
      group: asMongoId(groupId),
      user: asMongoId(userId),
    });
};

/**
 * membershipId must be ObjectId
 * @param {ObjectId} membershipId
 * @param {*} role
 * @returns
 */
export const setRole = async (membershipId, role) => {
  return await getDb().collection('memberships').findOneAndUpdate(
    { _id: membershipId },
    { $set: { role } },
    {
      returnOriginal: false,
    }
  );
};

/**
 *
 * @param {
    'page' |
    'group' |
    'instructions' |
    'instructionsImageSplit' |
    'text' |
    'number' |
    'date' |
    'location' |
    'selectSingle' |
    'selectMultiple' |
    'ontology' |
    'matrix' |
    'image' |
    'file' |
    'script' |
    'farmOsField' |
    'farmOsPlanting' |
    'farmOsFarm' |
    'geoJSON'
  } controls
*/
export const createSurvey = async (overrides = {}, control = '') => {
  const surveyDoc = {
    _id: uniqueId(),
    name: 'Mock Survey Name',
    latestVersion: 1,
    meta: {
      dateCreated: new Date('2022-10-11T02:30:35.000Z'),
      dateModified: new Date('2022-10-11T02:30:35.000Z'),
      submissions: 'public',
      creator: uniqueId(),
      group: {
        id: uniqueId(),
        path: '/mock-group-path/',
      },
      specVersion: 4,
    },
    resources: [
      {
        id: uniqueId(),
        label: 'Mock.csv',
        name: 'mockcsv',
        type: 'FILE',
        location: 'REMOTE',
      },
      {
        id: uniqueId(),
        label: 'Mock Dropdown Items',
        name: 'mock_dropdown_items',
        type: 'ONTOLOGY_LIST',
        location: 'EMBEDDED',
        content: [
          {
            id: uniqueId(),
            label: 'Item 1',
            value: 'item_1',
            tags: 'item1',
          },
          {
            id: uniqueId(),
            label: 'Item 2',
            value: 'item_2',
            tags: 'item2',
          },
        ],
      },
      {
        id: uniqueId(),
        label: 'Mock Resource Name',
        name: 'survey_reference_1',
        type: 'SURVEY_REFERENCE',
        location: 'REMOTE',
        content: {
          id: uniqueId(),
          version: 1,
          path: 'data.node_1.property_2',
        },
      },
    ],
    revisions: [
      {
        dateCreated: new Date('2022-10-11T02:30:35.000Z'),
        version: 1,
        controls: [],
      },
    ],
    ...overrides,
  };

  const controlGenerator = getControlGenerator(control);

  if (typeof controlGenerator === 'function') {
    surveyDoc.revisions.push({
      dateCreated: surveyDoc.meta.dateModified,
      version: 2,
      controls: [
        {
          id: uniqueId(),
          ...controlGenerator({}, 1, surveyDoc.resources[1].id),
        },
      ],
    });
    surveyDoc.latestVersion = 2;
  }

  const survey = await getDb().collection('survey').insertOne(surveyDoc);

  const createSubmission = async (_overrides = {}) => {
    const submissionDoc = { ..._overrides };
    const submission = await getDb().collection('submissions').insertOne(submissionDoc);
    return submission;
  };

  return { ...survey, createSubmission };
};

export const createReq = ({
  body = {},
  params = {},
  query = {},
  headers = {},
  cookies = {},
  protocol = 'https',
} = {}) => ({
  body,
  params,
  query,
  cookies,
  headers: {
    origin: 'https://surveystack.io',
    host: 'test.surveystack.io',
    ...headers,
  },
  get(key) {
    return this.headers[key];
  },
  protocol,
});

export const createRes = async ({ user = null } = {}) => ({
  send: jest.fn(),
  json: jest.fn(),
  redirect: jest.fn(),
  cookie: jest.fn(),
  status: jest.fn().mockReturnThis(),
  set: jest.fn(),
  locals: {
    auth: {
      isAuthenticated: !!user,
      isSuperAdmin: user && user.permissions.includes('super-admin'),
      user,
      roles: user ? await getRoles(user._id) : [],
    },
  },
  _headers: {},
});
