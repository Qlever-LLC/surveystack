export const submission = {
  _id: '630f34f87f5f6e0001c86487',
  meta: {
    dateCreated: '2022-08-31T12:16:24.739+02:00',
    dateModified: '2022-08-31T12:16:24.739+02:00',
    dateSubmitted: null,
    survey: {
      id: '630f32407f5f6e0001c86425',
      version: 2,
    },
    revision: 1,
    permissions: [],
    status: [],
    group: {
      id: '5f6392a929cb540001b31a85',
      path: '/rfc-test/',
    },
    specVersion: 3,
  },
  data: {
    text_1: {
      value: null,
      meta: {
        type: 'string',
        dateModified: null,
        apiCompose: {
          number: 1,
        },
      },
    },
    group_1: {
      meta: {
        type: 'group',
        apiCompose: {
          number: 5,
        },
      },
      text_3: {
        value: null,
        meta: {
          type: 'string',
          dateModified: null,
          apiCompose: {
            number: 3,
          },
        },
      },
      group_2: {
        meta: {
          type: 'group',
          apiCompose: {
            number: 4,
          },
        },
        text_2: {
          value: null,
          meta: {
            type: 'string',
            dateModified: null,
            apiCompose: {
              number: 3,
            },
          },
        },
      },
    },
  },
};

export const survey = {
  _id: '630f32407f5f6e0001c86425',
  name: 'Survey 1',
  latestVersion: 1,
  meta: {
    dateCreated: '2022-08-31T12:04:48.645+02:00',
    dateModified: '2022-08-31T12:06:08.285+02:00',
    submissions: 'public',
    creator: '5ea9a4761add4b6cb222d51d',
    group: {
      id: '5f6392a929cb540001b31a85',
      path: '/rfc-test/',
    },
    specVersion: 4,
  },
  resources: [],
  revisions: [
    {
      dateCreated: '2022-08-31T12:04:48.645+02:00',
      version: 1,
      controls: [],
    },
    {
      dateCreated: '2022-08-31T12:06:08.285+02:00',
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
              code: '\n/* eslint-disable */\n\n/**\n * ApiCompose\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction apiCompose(submission, survey, parent) {\n  console.warn(1);\n  return {\n    number: 1,\n  };\n}\n\n\n',
            },
          },
          id: '630f32497f5f6e0001c86427',
          hint: '',
          value: null,
        },
        {
          name: 'group_1',
          label: 'My group 1',
          type: 'group',
          children: [
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
                  code: 'function apiCompose(submission, survey, parent) {\n  console.warn(2);\n  return {\n    number: 3,\n  };\n}',
                },
              },
              id: '630f324d7f5f6e0001c8642b',
              hint: '',
              value: null,
            },
            {
              name: 'group_2',
              label: 'My group 2',
              type: 'group',
              children: [
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
                      code: 'function apiCompose(submission, survey, parent) {\n  console.warn(3);\n  return {\n    number: 3,\n  };\n}',
                    },
                  },
                  id: '630f324b7f5f6e0001c86429',
                  hint: '',
                  value: null,
                },
              ],
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
                  code: 'function apiCompose(submission, survey, parent) {\n  console.warn(4);\n  return {\n    number: 4,\n  };\n}',
                },
              },
              id: '630f33cf7f5f6e0001c86454',
              hint: '',
            },
          ],
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
              code: 'function apiCompose(submission, survey, parent) {\n  console.warn(5);\n  return {\n    number: 5,\n  };\n}',
            },
          },
          id: '630f33c87f5f6e0001c86451',
          hint: '',
        },
      ],
    },
  ],
};
