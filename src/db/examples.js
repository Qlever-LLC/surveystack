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
    version: 1,
    permissions: [],
    path: '/oursci/lab',
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

const userPermissionsDefault = ['public'];
const userPermissionsAdmin = ['public', 'admin@/oursci/lab'];
const userPermissions = userPermissionsAdmin;

export const redactStage = {
  $cond: {
    if: {
      $gt: [
        {
          $size: {
            $setIntersection: [
              {
                $cond: {
                  if: { $eq: ['$meta.permissions', null] },
                  then: ['public'],
                  else: {
                    $map: {
                      input: '$meta.permissions',
                      as: 'role',
                      in: { $concat: ['$role', '@', '$$ROOT.meta.path'] },
                    },
                  },
                },
              },
              userPermissions,
            ],
          },
        },
        0,
      ],
    },
    then: '$$DESCEND',
    else: '$$PRUNE',
  },
};

const currentStage = {
  $cond: {
    if: {
      $gt: [
        {
          $size: {
            $setIntersection: [{ $ifNull: ['$meta.permissions', ['public']] }, ['public']],
          },
        },
        0,
      ],
    },
    then: '$$DESCEND',
    else: '$$PRUNE',
  },
};

/*

  Redact Stage:
  If meta.permissions exists, concat its items with ROOT.meta.path, and compare with user permissions
  E.g.
  ROOT.meta.path: '/oursci/lab'
  meta.permissions: ['admin', 'owner']
  => ['admin@/oursci/lab', 'owner@/oursci/lab', ...] has permission
  

  If meta.permissions does not exist, treat its permissions as 'public'.
  => ['public', ...] has permission

*/
const currentStage2 = {
  $cond: {
    if: {
      $gt: [
        {
          $size: {
            $setIntersection: [
              {
                $concatArrays: [
                  {
                    $map: {
                      input: {
                        $ifNull: ['$meta.permissions', []],
                      },
                      as: 'role',
                      in: { $concat: ['$$role', '@', '$$ROOT.meta.path'] },
                    },
                  },
                  {
                    $cond: {
                      if: { $eq: [{ $size: { $ifNull: ['$meta.permissions', []] } }, 0] },
                      then: ['public'],
                      else: [],
                    },
                  },
                ],
              },
              ['public@/oursci/lab', 'public', 'admin@/oursci/lab'], // user permissions
            ],
          },
        },
        0,
      ],
    },
    then: '$$DESCEND',
    else: '$$PRUNE',
  },
};
