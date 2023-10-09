import getSubmissionDataGenerator from './submissionData';
import getSubmissionHeadersGenerator from './submissionHeader';
import getControlGenerator from './surveyControls';

const crypto = jest.requireActual('crypto');
const { deburr, kebabCase, uniqueId } = jest.requireActual('lodash');
const { ObjectId } = jest.requireActual('mongodb');
const { getDb } = jest.requireActual('../db');
const { createUserDoc } = jest.requireActual('../services/auth.service');
const { getRoles } = jest.requireActual('../services/roles.service');

export const createSuperAdmin = async (overrides = {}) => {
  return await createUser({
    permissions: ['super-admin'],
    ...overrides,
  });
};

export const createUser = async (overrides = {}) => {
  const fakeId = uniqueId();
  const defaults = {
    email: `user${fakeId}@email.com`,
    name: `User Number${fakeId}`,
  };
  const user = createUserDoc({ ...defaults, ...overrides });
  const insertResult = await getDb().collection('users').insertOne(user);
  return { _id: insertResult.insertedId, ...user };
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

  const insertResult = await getDb().collection('groups').insertOne(doc);
  const group = { _id: insertResult.insertedId, ...doc };

  const createUserMember = async ({ userOverrides, membershipOverrides } = {}) => {
    const user = await createUser(userOverrides);
    const membership = await createMembership({
      user,
      group: group._id,
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

  return { ...group, createUserMember, createAdminMember, createSubGroup };
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
  const insertResult = await getDb().collection('memberships').insertOne(doc);

  return { _id: insertResult.insertedId, ...doc };
};

export const deleteMemberships = (groupId, userId) =>
  getDb()
    .collection('memberships')
    .deleteMany({
      group: asMongoId(groupId),
      user: asMongoId(userId),
    });

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
      returnDocument: 'after',
    }
  );
};

export const createScript = async ({ group }) => {
  const script = {
    name: 'script name',
    content: 'script content',
    meta: {
      creator: null,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      group,
      revision: 1,
      specVersion: 2,
    },
    _id: new ObjectId(),
  };
  await getDb().collection('scripts').insertOne(script);
  return script;
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
  } | *[] controls
*/
export const createSurvey = async (control = '', overrides = {}) => {
  const now = new Date();
  const group = await createGroup();
  const surveyDoc = {
    name: 'Mock Survey Name',
    latestVersion: 1,
    meta: {
      dateCreated: now,
      dateModified: now,
      submissions: 'public',
      creator: new ObjectId(),
      group: {
        id: group._id,
        path: group.path,
      },
      specVersion: 4,
      printOptions: {
        showInstruction: true,
        showUnanswered: false,
      },
    },
    resources: [
      {
        id: new ObjectId(),
        label: 'Mock.csv',
        name: 'mockcsv',
        type: 'FILE',
        location: 'REMOTE',
      },
      {
        id: new ObjectId(),
        label: 'Mock Dropdown Items',
        name: 'mock_dropdown_items',
        type: 'ONTOLOGY_LIST',
        location: 'EMBEDDED',
        content: [
          {
            id: new ObjectId(),
            label: 'Item 1',
            value: 'item_1',
            tags: 'item1',
          },
          {
            id: new ObjectId(),
            label: 'Item 2',
            value: 'item_2',
            tags: 'item2',
          },
        ],
      },
      {
        id: new ObjectId(),
        label: 'Mock Resource Name',
        name: 'survey_reference_1',
        type: 'SURVEY_REFERENCE',
        location: 'REMOTE',
        content: {
          id: new ObjectId(),
          version: 1,
          path: 'data.node_1.property_2',
        },
      },
    ],
    revisions: [
      {
        dateCreated: now,
        version: 1,
        controls: [],
      },
    ],
    ...overrides,
  };

  const controlDocs = [];
  const controls = Array.isArray(control)
    ? control
    : typeof control === 'string' && control
    ? [control]
    : [];

  controls.forEach((ctrl, index) => {
    const controlGenerator = getControlGenerator(ctrl);

    if (typeof controlGenerator === 'function') {
      controlDocs.push({
        id: new ObjectId(),
        ...controlGenerator({}, index + 1, surveyDoc.resources[1].id),
      });
    }
  });

  if (controlDocs.length > 0) {
    surveyDoc.revisions.push({
      dateCreated: surveyDoc.meta.dateModified,
      version: 2,
      controls: controlDocs,
    });
    surveyDoc.latestVersion = 2;
  }

  const insertResult = await getDb().collection('surveys').insertOne(surveyDoc);
  const survey = { _id: insertResult.insertedId, ...surveyDoc };

  const createSubmission = async (_overrides = {}) => {
    let data = {};
    const headers = [
      '_id',
      'meta.dateCreated',
      'meta.dateModified',
      'meta.dateSubmitted',
      'meta.survey.id',
      'meta.survey.name',
      'meta.survey.version',
      'meta.revision',
      'meta.permissions',
      'meta.status.0.type',
      'meta.status.0.value.at',
      'meta.group.id',
      'meta.group.path',
      'meta.specVersion',
      'meta.creator',
      'meta.permanentResults',
    ];

    controls.forEach((ctrl, index) => {
      const dataGenerator = getSubmissionDataGenerator(ctrl);
      if (typeof dataGenerator === 'function') {
        data = { ...data, ...dataGenerator({}, index + 1) };
      }

      const headersGenerator = getSubmissionHeadersGenerator(ctrl);
      if (typeof headersGenerator === 'function') {
        headers.push(...headersGenerator(index + 1));
      }
    });

    const submissionDoc = {
      meta: {
        dateCreated: now,
        dateModified: now,
        dateSubmitted: now,
        survey: {
          id: survey._id,
          name: survey.name,
          version: 2,
        },
        revision: 1,
        permissions: [],
        status: [
          {
            type: 'READY_TO_SUBMIT',
            value: { at: now },
          },
        ],
        group: surveyDoc.meta.group,
        specVersion: 4,
        creator: new ObjectId(),
        permanentResults: [],
      },
      data,
      ..._overrides,
    };

    const insertResult = await getDb().collection('submissions').insertOne(submissionDoc);
    const submission = { _id: insertResult.insertedId, ...submissionDoc };

    submission.meta.dateCreated = submission.meta.dateCreated.toISOString();
    submission.meta.dateModified = submission.meta.dateModified.toISOString();
    submission.meta.dateSubmitted = submission.meta.dateSubmitted.toISOString();

    return {
      submission,
      headers,
    };
  };

  return {
    survey,
    createSubmission,
  };
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
  attachment: jest.fn(),
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

export { getSubmissionDataGenerator, getSubmissionHeadersGenerator, getControlGenerator };
