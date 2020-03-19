# Submissions

Represents a specific - partially or completely - `filled out version` of a survey, which can be submitted to the server.

## Endpoints

API endpoint `/api/submissions`

- list<br/>GET /api/submissions
- detail<br/>GET /api/submissions/:id
- create<br/> POST /api/submissions
- update<br/> PUT /api/submissions/:id
- delete<br/> DELETE /api/submissions/:id

## Description

```javascript
// Example submissions
const submissions = [
  {
    _id: '5e2eed723c98557ae2c1d967', // submission id
    survey: '5e2eecc36f371d00015775af', // survey reference
    meta: {
      dateCreated: '2020-01-27T14:10:41.623Z',
      dateModified: '2020-01-27T14:11:56.301Z',
      version: 1, // survey version
      group: '5e6f8bbeea14550001470c28',
      path: '/our-sci',
    }
    // data from controls
    data: {
      fav_color: {
        value: 'blue',
        meta: {
          type: 'string',
        }
      },
      personal_group: {
        full_name: {
          value: 'Andreas Rudolf',
          meta: {
            type: 'string',
          }
        },
        age: {
          value: 35,
          meta: {
            type: 'number'
          }
        },
        meta: {
          type: 'group',
          permissions: ['admin'],
        }
      }
    }
  },
  {
    _id: '5e2eed803c98557ae2c1d968',
    survey: '5e2eecc36f371d00015775af',
    meta: {
      dateCreated: '2020-01-27T14:12:24.730Z',
      dateModified: '2020-01-27T14:15:33.901Z',
      version: 3,
      group: '5e6f8bbeea14550001470c28',
      path: '/our-sci',
    },
    data: {
      fav_color: {
        value: 'green',
        meta: {
          type: 'string',
        }
      },
      personal_group: {
        full_name: {
          value: 'Philipp Rudolf',
          meta: {
            type: 'string',
          }
        },
        age: {
          value: 3,
          meta: {
            type: 'number'
          }
        },
        meta: {
          type: 'group',
          permissions: ['admin'],
        }
      }
    },
  },
];
```
