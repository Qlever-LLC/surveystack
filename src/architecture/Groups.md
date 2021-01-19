# Groups

Represents a group or an organization.

## Endpoints

API endpoint `/api/groups`

- list<br/>GET /api/groups
- detail<br/>GET /api/groups/:id
- create<br/> POST /api/groups
- update<br/> PUT /api/groups/:id
- delete<br/> DELETE /api/groups/:id

## Description

For groups, we are utilizing a similar structure as in
[materialized paths](https://docs.mongodb.com/manual/tutorial/model-tree-structures-with-materialized-paths/).

Paths are unique, also note how the rule for building the path is always `dir + slug + '/'`.

```javascript
const groups = [
  {
    _id: '5e6f8bbeea14550001470c28',
    meta: {
      archived: false,
      specVersion: 2,
      invitationOnly: true,
    },
    name: 'Our-Sci LLC',
    slug: 'our-sci',
    dir: '/',
    path: '/our-sci/',
    surveys: {
      pinned: ['5e95d425a6681900016584f9', '5e95c6ecdf51440001984b2d'],
    },
  },
  {
    _id: '5e6f8bbeea14550001470c32',
    meta: {
      archived: false,
      specVersion: 2,
      invitationOnly: true,
    },
    name: 'Our-Sci Lab',
    slug: 'lab',
    dir: '/our-sci/',
    path: '/our-sci/lab/',
    surveys: {
      pinned: [],
    },
  },
  {
    _id: '5e6f8bbeea14550001470c34',
    meta: {
      archived: false,
      specVersion: 2,
      invitationOnly: true,
    },
    name: 'Our-Sci Lab Testing',
    slug: 'testing',
    dir: '/our-sci/lab/',
    path: '/our-sci/lab/testing/',
    surveys: {
      pinned: [],
    },
    invitationOnly: true,
  },
  {
    _id: '5e6f8bbeea14550001470c36',
    meta: {
      archived: false,
      specVersion: 2,
      invitationOnly: true,
    },
    name: 'Our-Sci Lab Results',
    slug: 'results',
    dir: '/our-sci/lab/',
    path: '/our-sci/lab/results/',
    surveys: {
      pinned: [],
    },
  },
  {
    _id: '5e6f8bbeea14550001470c38',
    meta: {
      archived: false,
      specVersion: 2,
      invitationOnly: true,
    },
    name: 'Nexus-Computing GmbH',
    slug: 'nexus-computing',
    dir: '/',
    path: '/nexus-computing/',
    surveys: {
      pinned: ['5e95c6ecdf51440001984b2d'],
    },
  },
];
```
