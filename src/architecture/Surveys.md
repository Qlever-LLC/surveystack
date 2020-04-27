# Surveys

Represents a definition of a survey, as in a "survey blueprint".

## Endpoints

API endpoint `/api/surveys`

- list<br/>GET /api/surveys
- detail<br/>GET /api/surveys/:id
- create<br/> POST /api/surveys
- update<br/> PUT /api/surveys/:id
- delete<br/> DELETE /api/surveys/:id

## Description

```javascript
// Example survey
const survey = {
  _id: '5e2ee761b0aadd000181151a', // Survey id
  name: 'Example Survey',
  dateCreated: '2020-01-27T13:59:31.989Z',
  dateModified: '2020-01-27T14:15:29.811Z',
  latestVersion: 1, // default initial version starts at 1
  creator: '5e452119c5117c000185f275', // user reference
  group: {
    id: '5e6f8bbeea14550001470c28', // group reference
    path: '/our-sci/',
  },
  specVersion: 1,
  revisions: [
    {
      dateCreated: '2020-01-27T14:15:29.811Z',
      version: 1, // default initial version starts at 1
      // controls
      controls: [
        {
          name: 'fav_color',
          label: 'Favorite Color',
          type: 'inputText',
          // options
          options: {
            readOnly: false,
            required: false,
            relevance: '',
            constraint: '',
            calculate: '',
          },
        },
        {
          name: 'personal_group',
          label: 'Personal Group',
          type: 'group', // group
          children: [
            // group has children
            {
              name: 'full_name',
              label: 'Full Name',
              type: 'inputText',
              options: {
                readOnly: false,
                required: false,
                relevance: '',
                constraint: '',
                calculate: '',
              },
            },
            {
              name: 'age',
              label: 'Age',
              type: 'inputNumeric',
              options: {
                readOnly: false,
                required: false,
                relevance: '',
                constraint: '',
                calculate: '',
              },
            },
          ],
          options: {
            readOnly: false,
            required: false,
            relevance: '',
            constraint: '',
            calculate: '',
          },
        },
      ],
    },
  ],
};
```
