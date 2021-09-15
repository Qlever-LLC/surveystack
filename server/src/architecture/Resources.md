# Resources

Represents a general-purpose resource, for instance to be used inside a survey.
"INTERNAL" resources will be stored in an Amazon S3 bucket.
"EXTERNAL" resources are a link to an external URL.
"EMBEDDED" resources are stored directly inside mongodb database inside "content" field.

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
    name: "smiley.jpg"
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
    // "INTERNAL" - stored in surveystack's S3 bucket
    // "EXTERNAL" - external URL
    // "EMBEDDED" - directly embedded into content
    location: "INTERNAL",
    // MIME-Type, e.g. application/octet-stream
    mime: "image/jpeg",
    // not sure if label is needed?
    label: "Smiley Face",
    // content
    content: "",
  },
];
```
