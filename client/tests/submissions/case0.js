export const submission = {
  _id: '630f6d4d4e9cba0001e49c63',
  meta: {
    dateCreated: '2022-08-31T16:16:45.452+02:00',
    dateModified: '2022-08-31T16:16:56.522+02:00',
    dateSubmitted: null,
    survey: {
      id: '630f6cd84e9cba0001e49c25',
      version: 2,
    },
    revision: 1,
    permissions: [],
    status: [],
    group: {
      id: '627b74a5a5e612000159114f',
      path: '/bionutrient/labs/',
    },
    specVersion: 3,
  },
  data: {
    text_1: {
      value: 'first',
      meta: {
        type: 'string',
        dateModified: '2022-08-31T16:16:49.741+02:00',
        apiCompose: {
          number: 1,
        },
      },
    },
    text_2: {
      value: 'second',
      meta: {
        type: 'string',
        dateModified: '2022-08-31T16:16:53.729+02:00',
        apiCompose: {
          number: 2,
        },
      },
    },
    text_3: {
      value: 'third',
      meta: {
        type: 'string',
        dateModified: '2022-08-31T16:16:56.522+02:00',
        apiCompose: {
          number: 3,
        },
      },
    },
  },
};

export const survey = {
  _id: '630f6cd84e9cba0001e49c25',
  name: 'Survey 0',
  latestVersion: 1,
  meta: {
    dateCreated: '2022-08-31T16:14:48.604+02:00',
    dateModified: '2022-08-31T16:16:44.996+02:00',
    submissions: 'public',
    creator: '60b74b824e103d4e8971bf00',
    group: {
      id: '627b74a5a5e612000159114f',
      path: '/bionutrient/labs/',
    },
    specVersion: 4,
  },
  resources: [],
  revisions: [
    {
      dateCreated: '2022-08-31T16:14:48.604+02:00',
      version: 1,
      controls: [],
    },
    {
      dateCreated: '2022-08-31T16:16:44.996+02:00',
      version: 2,
      controls: [
        {
          name: 'text_1',
          label: 'Enter some text 1',
          type: 'string',
          options: {
            readOnly: false,
            required: false,
            redacted: false,
            relevance: {
              enabled: false,
              code: '',
            },
            constraint: {
              enabled: false,
              code: '',
            },
            calculate: {
              enabled: false,
              code: '',
            },
            apiCompose: {
              enabled: true,
              code: 'function apiCompose(submission, survey, parent) {\n  console.warn(1);\n  return {number: 1};\n}',
            },
          },
          id: '630f6ce84e9cba0001e49c27',
          hint: '',
          value: null,
        },
        {
          name: 'text_2',
          label: 'Enter some text 2',
          type: 'string',
          options: {
            readOnly: false,
            required: false,
            redacted: false,
            relevance: {
              enabled: false,
              code: '',
            },
            constraint: {
              enabled: false,
              code: '',
            },
            calculate: {
              enabled: false,
              code: '',
            },
            apiCompose: {
              enabled: true,
              code: 'function apiCompose(submission, survey, parent) {\n  console.warn(2);\n  return {number: 2};\n}',
            },
          },
          id: '630f6ceb4e9cba0001e49c29',
          hint: '',
          value: null,
        },
        {
          name: 'text_3',
          label: 'Enter some text 3',
          type: 'string',
          options: {
            readOnly: false,
            required: false,
            redacted: false,
            relevance: {
              enabled: false,
              code: '',
            },
            constraint: {
              enabled: false,
              code: '',
            },
            calculate: {
              enabled: false,
              code: '',
            },
            apiCompose: {
              enabled: true,
              code: 'function apiCompose(submission, survey, parent) {\n  console.warn(3);\n  return {number: 3};\n}',
            },
          },
          id: '630f6ced4e9cba0001e49c2b',
          hint: '',
          value: null,
        },
      ],
    },
  ],
};
