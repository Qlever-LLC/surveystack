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
    _id: '5df8af90a6d59d4375e4b363', // group id
    name: 'our-sci', // should be a handle (must not contain special chars)
    path: '/our-sci', // automatically generated from name and location
    label: 'Our-Sci Organization', // pretty name
  },
  {
    _id: '5df8af98a6d59d4375e4b364',
    name: 'lab',
    path: '/our-sci/lab',
    label: 'Our-Sci Lab Group',
  },
  {
    _id: '5df8b00fa6d59d4375e4b369',
    name: 'uw',
    path: '/uw',
    label: 'University of Washington',
  },
  {
    _id: '5dfa045a5990e9e9cfd18dff',
    name: 'biology',
    path: '/uw/biology',
    label: 'UW Biology Department',
  },
  {
    _id: '5dfa04685990e9e9cfd18e01',
    name: 'undergrad',
    path: '/uw/biology/undergrad',
    label: 'Undergrad Group',
  },
  {
    _id: '5df8b00fa6d59d4375e4b312',
    name: 'postgrad',
    path: '/uw/biology/postgrad',
    label: 'Postgrad Group',
  },
];
```
