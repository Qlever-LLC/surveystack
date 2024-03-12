export const surveys = [
  {
    _id: '654e445e8d178a0001eb589e',
    name: 'alpha',
    latestVersion: 2,
    meta: {
      dateCreated: '2023-11-10T14:55:26.098Z',
      dateModified: '2024-01-02T09:17:04.332Z',
      submissions: 'public',
      creator: '63e24b3e826a396d74d6d530',
      group: { id: '63e24fe6826a396d74d6d531', path: '/group-sa/' },
    },
  },
  {
    _id: '654e44828d178a0001eb58ad',
    name: 'beta_',
    latestVersion: 2,
    meta: {
      dateCreated: '2023-11-10T14:56:02.540Z',
      dateModified: '2023-11-10T14:56:11.272Z',
      submissions: 'public',
      creator: '63e24b3e826a396d74d6d530',
      group: { id: '63e24fe6826a396d74d6d531', path: '/group-sa/' },
    },
  },
  {
    _id: '653a2a3b733f5a00010fedd0',
    name: 'charlie',
    latestVersion: 8,
    meta: {
      dateCreated: '2023-10-26T08:58:35.139Z',
      dateModified: '2023-12-12T15:49:18.456Z',
      submissions: 'public',
      creator: '63e24b3e826a396d74d6d530',
      group: { id: '63e24fe6826a396d74d6d531', path: '/group-sa/' },
    },
  },
];

export const scripts = [
  {
    _id: '65787e81ce97580001b6e4a2',
    name: 'script for something',
    meta: {
      dateCreated: '2023-12-12T15:38:41.996Z',
      dateModified: '2023-12-12T15:38:41.996Z',
      revision: 1,
      creator: '63e24b3e826a396d74d6d530',
      group: { id: '649d4638447692370c226937', path: '/group-a/group-aa/' },
      specVersion: 2,
    },
  },
  {
    _id: '65ddb2cb57ec11157e0d3279',
    name: 'GetInformations',
    meta: {
      dateCreated: '2024-02-27T10:00:43.751Z',
      dateModified: '2024-02-27T10:00:43.751Z',
      revision: 1,
      creator: '63e24b3e826a396d74d6d530',
      group: { id: '649d4638447692370c226937', path: '/group-a/group-aa/' },
      specVersion: 2,
    },
  },
];

export const questionsLibrary = [
  {
    _id: '653a2a3b733f5a00010fedd0',
    name: 'form for identity',
    latestVersion: 8,
    meta: {
      dateCreated: '2023-10-26T08:58:35.139Z',
      dateModified: '2023-12-12T15:49:18.456Z',
      submissions: 'public',
      creator: '63e24b3e826a396d74d6d530',
      group: { id: '63e24fe6826a396d74d6d531', path: '/group-sa/' },
      isLibrary: true,
      libraryUsageCountSubmissions: 3,
    },
  },
  {
    _id: '654b994a7b94b4000160c21e',
    name: 'introduction',
    latestVersion: 2,
    meta: {
      dateCreated: '2023-11-08T14:20:58.949Z',
      dateModified: '2024-02-29T11:00:01.566Z',
      submissions: 'public',
      creator: '63e24b3e826a396d74d6d530',
      group: { id: '63e24fe6826a396d74d6d531', path: '/group-sa/' },
      isLibrary: true,
    },
  },
];

export const groups = [
  {
    _id: '63e252f5826a396d74d6d537',
    meta: { archived: false, specVersion: 2, invitationOnly: true },
    name: 'Group A',
    slug: 'group-a',
    dir: '/',
    path: '/group-a/',
    surveys: { pinned: [] },
  },
  {
    _id: '649d4638447692370c226937',
    meta: { archived: false, specVersion: 2, invitationOnly: true },
    name: 'Group AA',
    slug: 'group-aa',
    dir: '/group-a/',
    path: '/group-a/group-aa/',
    surveys: { pinned: [] },
  },
  {
    _id: '649d4640447692370c226939',
    meta: { archived: false, specVersion: 2, invitationOnly: true },
    name: 'Group AAA (sub-sub for A)',
    slug: 'group-aaa',
    dir: '/group-a/group-aa/',
    path: '/group-a/group-aa/group-aaa/',
    surveys: { pinned: [] },
  },
  {
    _id: '65e5de023572796f6a61aaaf',
    meta: { archived: false, specVersion: 2, invitationOnly: true },
    name: 'Group AB',
    slug: 'group-ab',
    dir: '/group-a/',
    path: '/group-a/group-ab/',
    surveys: { pinned: [] },
  },
  {
    _id: '63e25075826a396d74d6d533',
    meta: { archived: false, specVersion: 2, invitationOnly: true },
    name: 'Group Extern',
    slug: 'group-extern',
    dir: '/',
    path: '/group-extern/',
    surveys: { pinned: [] },
  },
  {
    _id: '63e24fe6826a396d74d6d531',
    meta: { archived: false, specVersion: 2, invitationOnly: true },
    name: 'Group SA',
    slug: 'group-sa',
    dir: '/',
    path: '/group-sa/',
    surveys: { pinned: ['653a2a3b733f5a00010fedd0'] },
  },
  {
    _id: '5e6f8bbeea14550001470c28',
    meta: { archived: false, specVersion: 2, invitationOnly: true },
    name: 'Our-Sci',
    slug: 'our-sci',
    dir: '/',
    path: '/our-sci/',
    surveys: {
      pinned: ['5e95d425a6681900016584f9', '5e95c6ecdf51440001984b2d'],
    },
  },
];

export const submissions = [
  {
    _id: '654b9f7edf4b140001505bb0',
    meta: {
      dateCreated: {
        $date: '2023-11-08T14:47:26.438Z',
      },
      dateModified: {
        $date: '2023-11-08T17:14:44.482Z',
      },
      dateSubmitted: {
        $date: '2023-11-08T17:14:51.748Z',
      },
      survey: {
        id: {
          $oid: '653a2a3b733f5a00010fedd0',
        },
        name: 'test form',
        version: 4,
      },
      revision: 2,
      permissions: [],
      status: [
        {
          type: 'READY_TO_SUBMIT',
          value: {
            at: '2023-11-08T17:14:50.397Z',
          },
        },
      ],
      group: {
        id: {
          $oid: '63e24fe6826a396d74d6d531',
        },
        path: '/group-sa/',
      },
      specVersion: 3,
      creator: {
        $oid: '63e24b3e826a396d74d6d530',
      },
      permanentResults: [],
      resubmitter: {
        $oid: '63e24b3e826a396d74d6d530',
      },
    },
    data: {
      dropdown_1: {
        value: ['abc_bis'],
        meta: {
          type: 'ontology',
          dateModified: '2023-11-08T17:14:44.482Z',
        },
      },
      matrix_1: {
        value: [
          {
            sample: {
              value: 7,
            },
            description: {
              value: ['abc_bis'],
            },
          },
        ],
        meta: {
          type: 'matrix',
          dateModified: '2023-11-08T14:47:37.260Z',
        },
      },
    },
  },
  {
    _id: '6556233f4988770001696ef9',
    meta: {
      dateCreated: {
        $date: '2023-11-16T14:12:15.420Z',
      },
      dateModified: {
        $date: '2023-11-16T14:12:24.007Z',
      },
      dateSubmitted: {
        $date: '2023-11-16T14:12:37.400Z',
      },
      survey: {
        id: {
          $oid: '653a2a3b733f5a00010fedd0',
        },
        name: 'test form',
        version: 6,
      },
      revision: 1,
      permissions: [],
      status: [
        {
          type: 'READY_TO_SUBMIT',
          value: {
            at: '2023-11-16T14:12:37.004Z',
          },
        },
      ],
      group: {
        id: {
          $oid: '63e24fe6826a396d74d6d531',
        },
        path: '/group-sa/',
      },
      specVersion: 3,
      creator: {
        $oid: '63e24b3e826a396d74d6d530',
      },
      permanentResults: [],
    },
    data: {
      dropdown_1: {
        value: ['abc'],
        meta: {
          type: 'ontology',
          dateModified: '2023-11-16T14:12:17.584Z',
        },
      },
      matrix_1: {
        value: [
          {
            sample: {
              value: 1,
            },
            description: {
              value: ['abc_bis'],
            },
          },
        ],
        meta: {
          type: 'matrix',
          dateModified: '2023-11-16T14:12:24.007Z',
        },
      },
      instructions_1: {
        value: null,
        meta: {
          type: 'instructions',
          dateModified: null,
        },
      },
    },
  },
];
