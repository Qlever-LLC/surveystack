import { ObjectId } from 'mongodb';

export const exampleSurvey = {
  _id: new ObjectId('5e3038dbea0cf40001aef63b'),
  name: 'Favorite Colors',
  dateCreated: new Date('2020-01-28T13:36:13.031Z'),
  dateModified: new Date('2020-01-28T13:36:13.031Z'),
  latestVersion: 1,
  revisions: [
    {
      dateCreated: new Date('2020-01-28T13:36:13.031Z'),
      version: 1,
      controls: [
        {
          name: 'favorite_color',
          label: 'What is your favorite color?',
          type: 'string',
          options: {
            readOnly: false,
            required: false,
            relevance: {
              enabled: false,
              code: '',
            },
            constraint: {
              enabled: false,
              code: '',
            },
            calculate: {
              enabled: false,
              code: '',
            },
          },
        },
        {
          name: 'personal_group',
          label: 'Personal Group',
          type: 'group',
          children: [
            {
              name: 'full_name',
              label: 'Full Name',
              type: 'string',
              options: {
                readOnly: false,
                required: false,
                relevance: {
                  enabled: false,
                  code: '',
                },
                constraint: {
                  enabled: false,
                  code: '',
                },
                calculate: {
                  enabled: false,
                  code: '',
                },
              },
            },
            {
              name: 'age',
              label: 'Age',
              type: 'number',
              options: {
                readOnly: false,
                required: false,
                relevance: {
                  enabled: false,
                  code: '',
                },
                constraint: {
                  enabled: false,
                  code: '',
                },
                calculate: {
                  enabled: false,
                  code: '',
                },
              },
            },
          ],
          options: {
            readOnly: false,
            required: false,
            redacted: true,
            relevance: {
              enabled: false,
              code: '',
            },
            constraint: {
              enabled: false,
              code: '',
            },
            calculate: {
              enabled: false,
              code: '',
            },
          },
        },
      ],
    },
  ],
};

export const exampleSubmission = {
  _id: new ObjectId('5e303982ea0cf40001aef63c'),
  survey: new ObjectId('5e3038dbea0cf40001aef63b'),
  meta: {
    dateCreated: new Date('2020-01-28T13:39:14.544Z'),
    dateModified: new Date('2020-01-28T13:41:34.329Z'),
    version: 1,
    permissions: [],
    group: new ObjectId('5e6f8bbeea14550001470c28'),
    path: '/our-sci',
  },
  data: {
    favorite_color: {
      value: 'blue',
      meta: {
        type: 'string',
      },
    },
    personal_group: {
      full_name: {
        value: 'Andreas Rudolf',
        meta: {
          type: 'string',
        },
      },
      age: {
        value: 35,
        meta: {
          type: 'number',
        },
      },
      meta: {
        type: 'group',
        permissions: ['admin'],
      },
    },
  },
};

export const exampleGroup = {
  _id: new ObjectId('5e6f8bbeea14550001470c28'),
  name: 'Our-Sci',
  slug: 'our-sci',
  path: null,
};

export const exampleUsers = [
  {
    _id: '5e452119c5117c000185f275',
    email: 'admin@our-sci.net',
    name: 'Default Our-Sci Admin',
    token: '0bb69ddf-49fa-458d-b7f3-42011b1c009a',
    password: '$2b$12$IkxwFgrwXlnpBKBAapHia..beTddaB6qLIATJwMNaPRF5/2jA/97q', // 1234
    permissions: [],
    authProviders: [],
    group: {
      user: [],
      admin: ['5e6f8bbeea14550001470c28'],
    },
  },
  {
    _id: '5e6f92f16070e700015e0371',
    email: 'user@our-sci.net',
    name: 'Default Our-Sci User',
    token: '8805b1c0-85b7-41b9-abe4-cb28c6603715',
    password: '$2b$12$7cy0/MdjUywLJ2RHeSuKtuczE11Vo10b5xf5g5jKOxQK09T4tBti2', // 1234
    permissions: [],
    authProviders: [],
    group: {
      user: ['5e6f8bbeea14550001470c28'],
      admin: [],
    },
  },
];

const OWNER = '37190y1';
const ROLES = ['admin@/our/sci', 'member@/farmos'];

const redactStage = {
  $switch: {
    branches: [
      // check for owner rights
      {
        case: { $in: [OWNER, { $ifNull: ['$$ROOT.meta.owners', []] }] },
        then: '$$KEEP',
      },
      // check if meta.permissions does not exist or is empty
      {
        case: { $eq: [{ $size: { $ifNull: ['$meta.permissions', []] } }, 0] },
        then: '$$DESCEND',
      },
      // check if user has specific role
      // e.g. "meta.permissions": ['admin'], "$$ROOT.meta.path": "/oursci/lab"
      // => User needs 'admin@/oursci/lab' to view
      {
        case: {
          $gt: [
            {
              $size: {
                $setIntersection: [
                  {
                    $concatArrays: [
                      {
                        $map: {
                          input: '$meta.permissions',
                          as: 'role',
                          in: { $concat: ['$$role', '@', '$$ROOT.meta.path'] },
                        },
                      },
                    ],
                  },
                  ROLES,
                ],
              },
            },
            0,
          ],
        },
        then: '$$DESCEND',
      },
    ],
    default: '$$PRUNE',
  },
};

const oldPath = '/superheroes/';
const newPath = '/super-heroes/';
const bulkUpdatePipeline = [
  {
    $set: {
      path: { $concat: [newPath, { $substr: ['$path', { $strLenBytes: oldPath }, -1] }] },
    },
  },
];

/*
db.groups.update(
  { path: { $regex: '^/superheroes/' } },
  [
    {
      $set: {
        path: {
          $concat: [
            '/super-heroes/',
            { $substr: ['$path', { $strLenBytes: '/superheroes/' }, -1] },
          ],
        },
      },
    },
  ],
  { multi: true }
);

var oldPath = "/super-heroes/";
var newPath = "/supermanheroes/";
db.groups.updateMany(
  { path: { $regex: `^${oldPath}` } },
  [
    {
      $set: {
        path: {
          $concat: [
            newPath,
            { $substr: ['$path', { $strLenBytes: oldPath }, -1] },
          ],
        },
      },
    },
  ]
);
*/

// Left join on group id
const user = {
  _id: '5e452119c5117c000185f275',
  email: 'xxx@gmail.com',
  name: 'xxx',
  token: '4a6076b6-6c16-4dfa-aa38-fd14f35f1ae6',
  password: '$2b$12$L.CzwVxqRJq5NNxF3xDhnOKVW6jA3B8V3PblffF2jiKeOczK9p09C',
  permissions: [],
  authProviders: [],
  groups: {
    member: ['5e4a656fa1f0db0001bb4a9b'],
    admin: ['5e4a6a6052fc340001d15453'],
  },
};

//db.users.aggregate([{$lookup: {from: "groups", localField: "groups.admin", foreignField: "_id", as: "groups.admin"}}]).pretty()
