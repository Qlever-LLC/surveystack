# Membership

Represents a membership of a User to a Group

## Endpoints

API endpoint `/api/memberships`

- list<br/>GET /api/memberships
- detail<br/>GET /api/memberships/:id
- create<br/> POST /api/memberships
- update<br/> PUT /api/memberships/:id
- delete<br/> DELETE /api/memberships/:id

## Description

```javascript
const memberships = [
  {
    _id: '5e4a656fa1f0db0001bb4a9b',
    user: '5e452119c5117c000185f275', // E.g. Default Our-Sci Admin
    group: '5e6f8bbeea14550001470c28', // E.g. our-sci
    role: 'admin',
  },
  {
    _id: '5e4a656fa1f0db0001bb4a9c',
    user: '5e6f92f16070e700015e0371', // E.g. Default Our-Sci User
    group: '5e6f8bbeea14550001470c28', // E.g. our-sci
    role: 'user',
  },
];
```
