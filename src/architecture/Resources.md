# Resources

Represents a general-purpose resource, for instance to be used inside a survey.
Binary resources will be stored in an Amazon S3 bucket.
Other resources may be stored directly inside mongodb database

## Endpoints

API endpoint `/api/resources`

- list<br/>GET /api/resources
- detail<br/>GET /api/resources/:id
- create<br/> POST /api/resources
- update<br/> PUT /api/resources/:id
- delete<br/> DELETE /api/resources/:id

## Description

```javascript
// Example resources
const resources = [
  {
    _id: '5e2eed723c98557ae2c1d967', // resource id
    name: "smiley.png"
    meta: {
      dateCreated: '2020-01-27T14:10:41.623Z',
      dateModified: '2020-01-27T14:11:56.301Z',
      revision: 1, // resource revision
      creator: '5e6f92f16070e700015e0371',
      group: {
        id: '5e6f8bbeea14550001470c28',
        path: '/our-sci/',
      },
      specVersion: 1,
    },
    type: "image",
  },
];
```
