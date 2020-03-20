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
          },
        },
      ],
    },
  ],
};

export const exampleSubmissions = [
  {
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
    survey: new ObjectId('5e3038dbea0cf40001aef63b'),
    meta: {
      dateCreated: new Date('2020-01-28T13:41:33.984Z'),
      dateModified: new Date('2020-01-28T13:42:52.711Z'),
      version: 1,
      permissions: [],
      group: new ObjectId('5e6f8bbeea14550001470c28'),
      path: '/our-sci',
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
    survey: new ObjectId('5e3038dbea0cf40001aef63b'),
    meta: {
      dateCreated: new Date('2020-01-28T13:42:07.781Z'),
      dateModified: new Date('2020-01-28T13:43:38.987Z'),
      version: 1,
      permissions: [],
      group: new ObjectId('5e6f8bbeea14550001470c28'),
      path: '/our-sci',
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
    survey: new ObjectId('5e3038dbea0cf40001aef63b'),
    meta: {
      dateCreated: new Date('2020-01-28T13:42:33.452Z'),
      dateModified: new Date('2020-01-28T13:42:55.314Z'),
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

export const exampleGroup = {
  _id: new ObjectId('5e6f8bbeea14550001470c28'),
  name: 'Our-Sci',
  slug: 'our-sci',
  path: null,
};

export const exampleUsers = [
  {
    _id: new ObjectId('5e452119c5117c000185f275'),
    email: 'admin@our-sci.net',
    name: 'Default Our-Sci Admin',
    token: '0bb69ddf-49fa-458d-b7f3-42011b1c009a',
    password: '$2b$12$IkxwFgrwXlnpBKBAapHia..beTddaB6qLIATJwMNaPRF5/2jA/97q', // 1234
    permissions: [],
    authProviders: [],
    group: {
      user: [],
      admin: [new ObjectId('5e6f8bbeea14550001470c28')],
    },
  },
  {
    _id: new ObjectId('5e6f92f16070e700015e0371'),
    email: 'user@our-sci.net',
    name: 'Default Our-Sci User',
    token: '8805b1c0-85b7-41b9-abe4-cb28c6603715',
    password: '$2b$12$7cy0/MdjUywLJ2RHeSuKtuczE11Vo10b5xf5g5jKOxQK09T4tBti2', // 1234
    permissions: [],
    authProviders: [],
    group: {
      user: [new ObjectId('5e6f8bbeea14550001470c28')],
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
