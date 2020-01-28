# Submissions

## Endpoints

API endpoint `/api/submissions`

- list<br/>GET /api/submissions
- detail<br/>GET /api/submissions/:id
- create<br/> POST /api/submissions
- update<br/> PUT /api/submissions/:id
- delete<br/> DELETE /api/submissions/:id

## Description

```javascript
// Example submission
const submissions = [
  {
    _id: '5e2eed723c98557ae2c1d967', // submission id
    survey: '5e2eecc36f371d00015775af', // survey reference
    dateCreated: '2020-01-27T14:10:41.623Z',
    // data from controls
    data: [
      {
        name: 'fav_color',
        type: 'inputText',
        value: 'blue',
      },
      {
        name: 'personal_group',
        type: 'group',
        children: [
          {
            name: 'full_name',
            type: 'inputText',
            value: 'Andreas Rudolf',
          },
          {
            name: 'age',
            type: 'inputNumeric',
            value: 35,
          },
        ],
      },
    ],
  },
  {
    _id: '5e2eed803c98557ae2c1d968',
    survey: '5e2eecc36f371d00015775af',
    dateCreated: '2020-01-27T14:12:24.730Z',
    data: [
      {
        name: 'fav_color',
        type: 'inputText',
        value: 'green',
      },
      {
        name: 'personal_group',
        type: 'group',
        children: [
          {
            name: 'full_name',
            type: 'inputText',
            value: 'Manuel Di Cerbo',
          },
          {
            name: 'age',
            type: 'inputNumeric',
            value: 35,
          },
        ],
      },
    ],
  },
];
```
