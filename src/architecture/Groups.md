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
    name: 'Our-Sci LLC',
    slug: 'our-sci',
    dir: '/',
    path: '/our-sci/',
  },
  {
    _id: '5e6f8bbeea14550001470c32',
    name: 'Our-Sci Lab',
    slug: 'lab',
    dir: '/our-sci/',
    path: '/our-sci/lab/',
  },
  {
    _id: '5e6f8bbeea14550001470c34',
    name: 'Our-Sci Lab Testing',
    slug: 'testing',
    dir: '/our-sci/lab/',
    path: '/our-sci/lab/testing/',
  },
  {
    _id: '5e6f8bbeea14550001470c36',
    name: 'Our-Sci Lab Results',
    slug: 'results',
    dir: '/our-sci/lab/',
    path: '/our-sci/lab/results/',
  },
  {
    _id: '5e6f8bbeea14550001470c38',
    name: 'Nexus-Computing GmbH',
    slug: 'nexus-computing',
    dir: '/',
    path: '/nexus-computing/',
  },
];
```
