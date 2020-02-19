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

For groups, we may want to use the a similar structure as in
[materialized paths](https://docs.mongodb.com/manual/tutorial/model-tree-structures-with-materialized-paths/).

```javascript
const groups = [
  {
    _id: '5e4a656fa1f0db0001bb4a9b',
    name: 'Oursci Lab',
    slug: 'oursci-lab',
    path: null,
  },
  {
    _id: '5e4a699b52fc340001d15450',
    name: 'Andreas',
    slug: 'andreas',
    path: '/oursci-lab/',
  },
  {
    _id: '5e4a6a6052fc340001d15453',
    name: 'test',
    slug: 'test',
    path: '/oursci-lab/andreas/',
  },
  {
    _id: '5e4a6a6952fc340001d15454',
    name: 'migros',
    slug: 'migros',
    path: '/oursci-lab/andreas/',
  },
];
```
