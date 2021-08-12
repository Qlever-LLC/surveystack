# Scripts

Represents a standalone script which can be integrated into a survey.

## Endpoints

API endpoint `/api/scripts`

- list<br/>GET /api/scripts
- detail<br/>GET /api/scripts/:id
- create<br/> POST /api/scripts
- update<br/> PUT /api/scripts/:id
- delete<br/> DELETE /api/scripts/:id

## Description

```javascript
// Example scripts
const scripts = [
  {
    _id: '5e2eed723c98557ae2c1d967', // script id
    name: "test_script"
    meta: {
      dateCreated: '2020-01-27T14:10:41.623Z',
      dateModified: '2020-01-27T14:11:56.301Z',
      revision: 1, // script revision
      creator: '5e6f92f16070e700015e0371',
      group: {
        id: '5e6f8bbeea14550001470c28',
        path: '/our-sci/',
      },
      specVersion: 1,
    },
    content: "..." // script
  },
];
```
