import { ObjectId } from 'mongodb';

export const exampleSurveys = [
  {
    _id: new ObjectId('5e3038dbea0cf40001aef63b'),
    name: 'Favorite Colors 2',
    dateCreated: new Date('2020-04-09T12:48:20.002Z'),
    dateModified: new Date('2020-04-09T12:47:42.124Z'),
    latestVersion: 1,
    specVersion: 1,
    revisions: [
      {
        dateCreated: new Date('2020-04-09T12:48:20.002Z'),
        version: 1,
        controls: [
          {
            name: 'favorite_color',
            label: 'What is your favorite color?',
            type: 'string',
            options: {
              readOnly: false,
              required: false,
              redacted: false,
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
              apiCompose: {
                enabled: false,
                code: '',
              },
            },
            _id: '5e8f19a13a9b2e00010a2460',
            value: null,
          },
          {
            name: 'personal_group',
            label: 'Personal Group',
            type: 'group',
            children: [
              {
                name: 'age',
                label: 'What is your age?',
                type: 'number',
                options: {
                  readOnly: false,
                  required: false,
                  redacted: false,
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
                  apiCompose: {
                    enabled: false,
                    code: '',
                  },
                },
                _id: '5e8f19f03a9b2e00010a24dd',
                value: null,
              },
              {
                name: 'full_name',
                label: 'What is your name?',
                type: 'string',
                options: {
                  readOnly: false,
                  required: false,
                  redacted: false,
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
                  apiCompose: {
                    enabled: false,
                    code: '',
                  },
                },
                _id: '5e8f19e73a9b2e00010a24db',
                value: null,
              },
            ],
            options: {
              readOnly: false,
              required: false,
              redacted: false,
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
              apiCompose: {
                enabled: false,
                code: '',
              },
            },
            _id: '5e8f19cb3a9b2e00010a2499',
          },
        ],
      },
    ],
    description: 'One of the funniest surveys.',
  },
];

export const exampleSubmissions = [
  {
    _id: new ObjectId('5e303982ea0cf40001aef63c'),
    meta: {
      dateCreated: new Date('2020-01-28T13:39:14.544Z'),
      dateModified: new Date('2020-01-28T13:41:34.329Z'),
      survey: {
        id: new ObjectId('5e3038dbea0cf40001aef63b'),
        version: 1,
      },
      revision: 3,
      permissions: [], // restrict access to submission, leave empty for now
      creator: new ObjectId('5e6f92f16070e700015e0371'),
      group: {
        id: new ObjectId('5e6f8bbeea14550001470c28'),
        path: '/our-sci/',
      },
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
            permissions: ['admin'],
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
        },
      },
    },
  },
  {
    _id: new ObjectId('5e303982ea0cf40001aef79b'),
    meta: {
      dateCreated: new Date('2020-01-28T13:41:33.984Z'),
      dateModified: new Date('2020-01-28T13:42:52.711Z'),
      survey: {
        id: new ObjectId('5e3038dbea0cf40001aef63b'),
        version: 1,
      },
      revision: 1,
      permissions: [],
      creator: new ObjectId('5e452119c5117c000185f275'),
      group: {
        id: new ObjectId('5e6f8bbeea14550001470c28'),
        path: '/our-sci/',
      },
    },
    data: {
      favorite_color: {
        value: 'green',
        meta: {
          type: 'string',
        },
      },
      personal_group: {
        full_name: {
          value: 'Philipp Rudolf',
          meta: {
            type: 'string',
            permissions: ['admin'],
          },
        },
        age: {
          value: 3,
          meta: {
            type: 'number',
          },
        },
        meta: {
          type: 'group',
        },
      },
    },
  },
  {
    _id: new ObjectId('5e303982ea0cf40001aef81e'),
    meta: {
      dateCreated: new Date('2020-01-28T13:42:07.781Z'),
      dateModified: new Date('2020-01-28T13:43:38.987Z'),
      survey: {
        id: new ObjectId('5e3038dbea0cf40001aef63b'),
        version: 1,
      },
      revision: 1,
      permissions: [],
      creator: new ObjectId('5e452119c5117c000185f275'),
      group: {
        id: new ObjectId('5e6f8bbeea14550001470c28'),
        path: '/our-sci/',
      },
    },
    data: {
      favorite_color: {
        value: 'pink',
        meta: {
          type: 'string',
        },
      },
      personal_group: {
        full_name: {
          value: 'Nora Rudolf',
          meta: {
            type: 'string',
            permissions: ['admin'],
          },
        },
        age: {
          value: 0,
          meta: {
            type: 'number',
          },
        },
        meta: {
          type: 'group',
        },
      },
    },
  },
  {
    _id: new ObjectId('5e303982ea0cf40001aef94f'),
    meta: {
      dateCreated: new Date('2020-01-28T13:42:33.452Z'),
      dateModified: new Date('2020-01-28T13:42:55.314Z'),
      survey: {
        id: new ObjectId('5e3038dbea0cf40001aef63b'),
        version: 1,
      },
      revision: 1,
      permissions: [],
      creator: new ObjectId('5e452119c5117c000185f275'),
      group: {
        id: new ObjectId('5e6f8bbeea14550001470c34'),
        path: '/our-sci/lab/testing/',
      },
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
          value: 'Stefanie Rudolf',
          meta: {
            type: 'string',
            permissions: ['admin'],
          },
        },
        age: {
          value: 32,
          meta: {
            type: 'number',
          },
        },
        meta: {
          type: 'group',
        },
      },
    },
  },
];

export const exampleGroups = [
  {
    _id: new ObjectId('5e6f8bbeea14550001470c28'),
    name: 'Our-Sci LLC',
    slug: 'our-sci',
    dir: '/',
    path: '/our-sci/',
  },
  {
    _id: new ObjectId('5e6f8bbeea14550001470c32'),
    name: 'Our-Sci Lab',
    slug: 'lab',
    dir: '/our-sci/',
    path: '/our-sci/lab/',
  },
  {
    _id: new ObjectId('5e6f8bbeea14550001470c34'),
    name: 'Our-Sci Lab Testing',
    slug: 'testing',
    dir: '/our-sci/lab/',
    path: '/our-sci/lab/testing/',
  },
  {
    _id: new ObjectId('5e6f8bbeea14550001470c36'),
    name: 'Our-Sci Lab Results',
    slug: 'results',
    dir: '/our-sci/lab/',
    path: '/our-sci/lab/results/',
  },
  {
    _id: new ObjectId('5e6f8bbeea14550001470c38'),
    name: 'Nexus-Computing GmbH',
    slug: 'nexus-computing',
    dir: '/',
    path: '/nexus-computing/',
  },
];

export const exampleUsers = [
  {
    _id: new ObjectId('5e452119c5117c000185f275'),
    email: 'admin@our-sci.net',
    name: 'Default Our-Sci Admin',
    token: '0bb69ddf-49fa-458d-b7f3-42011b1c009a',
    password: '$2b$12$IkxwFgrwXlnpBKBAapHia..beTddaB6qLIATJwMNaPRF5/2jA/97q', // 1234
    permissions: [],
    authProviders: [],
  },
  {
    _id: new ObjectId('5e6f92f16070e700015e0371'),
    email: 'user@our-sci.net',
    name: 'Default Our-Sci User',
    token: '8805b1c0-85b7-41b9-abe4-cb28c6603715',
    password: '$2b$12$7cy0/MdjUywLJ2RHeSuKtuczE11Vo10b5xf5g5jKOxQK09T4tBti2', // 1234
    permissions: [],
    authProviders: [],
  },
];

export const exampleMemberships = [
  {
    _id: new ObjectId('5e4a656fa1f0db0001bb4a9a'),
    user: new ObjectId('5e452119c5117c000185f275'), // Default Our-Sci Admin
    group: new ObjectId('5e6f8bbeea14550001470c28'),
    role: 'admin',
  },
  {
    _id: new ObjectId('5e4a656fa1f0db0001bb4a9b'),
    user: new ObjectId('5e452119c5117c000185f275'), // Default Our-Sci Admin
    group: new ObjectId('5e6f8bbeea14550001470c38'),
    role: 'admin',
  },
  {
    _id: new ObjectId('5e4a656fa1f0db0001bb4a9c'),
    user: new ObjectId('5e6f92f16070e700015e0371'), // Default Our-Sci User
    group: new ObjectId('5e6f8bbeea14550001470c28'), // our-sci
    role: 'user',
  },
  {
    _id: new ObjectId('5e4a656fa1f0db0001bb4a9e'),
    user: new ObjectId('5e6f92f16070e700015e0371'), // Default Our-Sci User
    group: new ObjectId('5e6f8bbeea14550001470c32'), // our-sci/lab
    role: 'user',
  },
  {
    _id: new ObjectId('5e4a656fa1f0db0001bb4a9f'),
    user: new ObjectId('5e6f92f16070e700015e0371'), // Default Our-Sci User
    group: new ObjectId('5e6f8bbeea14550001470c34'), // our-sci/lab/testing
    role: 'user',
  },
  {
    _id: new ObjectId('5e4a656fa1f0db0001bb4aa0'),
    user: new ObjectId('5e6f92f16070e700015e0371'), // Default Our-Sci User
    group: new ObjectId('5e6f8bbeea14550001470c36'), // our-sci/lab/results
    role: 'user',
  },
];

const OWNER = '37190y1';
const ROLES = ['admin@/our/sci/', 'member@/farmos'];

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
  _id: ObjectId('5e6f92f16070e700015e0371'),
  email: 'user@our-sci.net',
  name: 'Default Our-Sci User',
  token: '8805b1c0-85b7-41b9-abe4-cb28c6603715',
  password: '$2b$12$7cy0/MdjUywLJ2RHeSuKtuczE11Vo10b5xf5g5jKOxQK09T4tBti2',
  permissions: [],
  authProviders: [],
  group: {
    user: [
      {
        _id: ObjectId('5e6f8bbeea14550001470c28'),
        name: 'Our-Sci',
        slug: 'our-sci',
        path: null,
      },
    ],
    admin: [],
  },
};

/*
// find members of group with 'user' rights
db.users.aggregate([
    { $match: { 'group.user': ObjectId('5e6f8bbeea14550001470c28') } },
    {
      $lookup: { from: 'groups', localField: 'group.user', foreignField: '_id', as: 'group.user' },
    },
  ]);

// find members of group with 'user' rights
db.users.aggregate([
    { $match: {} },
    {
      $lookup: { from: 'groups', localField: 'group.user', foreignField: '_id', as: 'group.user' },
    },
    {
      $lookup: { from: 'groups', localField: 'group.admin', foreignField: '_id', as: 'group.admin' },
    }
  ]);
*/

/*
// Apply projection to group.user lookup stage
db.users
  .aggregate([
    {
      $lookup: {
        from: 'groups',
        let: { usergroups: { $ifNull: ['$group.user', []] } },
        pipeline: [
          { $match: { $expr: { $in: ['$_id', '$$usergroups'] } } },
          { $project: { slug: 0 } },
        ],
        as: 'group.user',
      },
    },
  ])
  .pretty();
*/

/*
db.users.aggregate([
  {
    $match: {
      $or: [
        { 'group.user': ObjectId('5e6f8bbeea14550001470c28') },
        { 'group.admin': ObjectId('5e6f8bbeea14550001470c28') },
      ],
    },
  },
]);
*/

/*
// This may be a better way to store roles, however, a lookup on the nested groups is more complicated
const userWithRoles = {
  email: 'user@gmx.ch',
  name: 'User William Roles',
  roles: [
    { group: '5e6f8bbeea14550001470c28', type: 'admin' },
    { group: '5e789e8a9f0a2b00018f7c27', type: 'user' },
  ],
};

// find users in group 5e6f8bbeea14550001470c28
// and then also filter their roles to only contain this group
const matchStage = {"roles.group": ObjectId('5e6f8bbeea14550001470c28')},
const projectStage = {
  $project: {
    email: 1,
    name: 1,
    roles: {
      $filter: {
        input: '$roles',
        as: 'role',
        cond: { $in: ['$$role.group', [ObjectId('5e6f8bbeea14550001470c28')]] },
      },
    },
  },
};

*/
