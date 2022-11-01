export const submission = {
  _id: '6310b4cd72c84c00015454eb',
  meta: {
    dateCreated: '2022-09-01T15:34:05.390+02:00',
    dateModified: '2022-09-01T15:34:18.561+02:00',
    dateSubmitted: null,
    survey: {
      id: '6310ad9d72c84c0001545464',
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
      value: 'a',
      meta: {
        type: 'string',
        dateModified: '2022-09-01T15:34:11.810+02:00',
        apiCompose: {
          number: 1,
        },
      },
    },
    group_2: {
      meta: {
        type: 'group',
        apiCompose: {
          number: 5,
        },
      },
      group_5: {
        meta: {
          type: 'group',
          apiCompose: {
            number: 4,
          },
        },
        group_6: {
          meta: {
            type: 'group',
            apiCompose: {
              number: 3,
            },
          },
          text_7: {
            value: 'b',
            meta: {
              type: 'string',
              dateModified: '2022-09-01T15:34:13.416+02:00',
              apiCompose: {
                number: 2,
              },
            },
          },
        },
      },
    },
    page_3: {
      meta: {
        type: 'page',
        apiCompose: {
          number: 8,
        },
      },
      group_8: {
        meta: {
          type: 'group',
          apiCompose: {
            number: 7,
          },
        },
        text_9: {
          value: 'c',
          meta: {
            type: 'string',
            dateModified: '2022-09-01T15:34:15.066+02:00',
            apiCompose: {
              number: 6,
            },
          },
        },
      },
    },
    page_4: {
      meta: {
        type: 'page',
        apiCompose: {
          number: 11,
        },
      },
      text_10: {
        value: 'd',
        meta: {
          type: 'string',
          dateModified: '2022-09-01T15:34:16.631+02:00',
          apiCompose: {
            number: 9,
          },
        },
      },
      text_11: {
        value: 'e',
        meta: {
          type: 'string',
          dateModified: '2022-09-01T15:34:18.561+02:00',
          apiCompose: {
            number: 10,
          },
        },
      },
    },
  },
};

export const survey = {
  _id: '6310ad9d72c84c0001545464',
  name: 'Survey 2',
  latestVersion: 1,
  meta: {
    dateCreated: '2022-09-01T15:03:25.928+02:00',
    dateModified: '2022-09-01T15:34:04.813+02:00',
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
      dateCreated: '2022-09-01T15:03:25.928+02:00',
      version: 1,
      controls: [],
    },
    {
      dateCreated: '2022-09-01T15:34:04.813+02:00',
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
              code: 'function apiCompose(submission, survey, parent) {\n  console.warn(1);\n  return {number:1};\n}',
            },
          },
          id: '6310b17c72c84c0001545466',
          hint: '',
          value: null,
        },
        {
          name: 'group_2',
          label: 'My group 2',
          type: 'group',
          children: [
            {
              name: 'group_5',
              label: 'My group 5',
              type: 'group',
              children: [
                {
                  name: 'group_6',
                  label: 'My group 6',
                  type: 'group',
                  children: [
                    {
                      name: 'text_7',
                      label: 'Enter some text 7',
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
                          code: 'function apiCompose(submission, survey, parent) {\n  console.warn(2);\n  return {number:2};\n}',
                        },
                      },
                      id: '6310b45072c84c000154549f',
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
                      code: 'function apiCompose(submission, survey, parent) {\n  console.warn(3);\n  return {number:3};\n}',
                    },
                  },
                  id: '6310b44d72c84c000154549d',
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
                  code: 'function apiCompose(submission, survey, parent) {\n  console.warn(4);\n  return {number:4};\n}',
                },
              },
              id: '6310b44872c84c000154549b',
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
              code: 'function apiCompose(submission, survey, parent) {\n  console.warn(5);\n  return {number:5};\n}',
            },
          },
          id: '6310b43172c84c0001545494',
          hint: '',
        },
        {
          name: 'page_3',
          label: 'My page 3',
          type: 'page',
          children: [
            {
              name: 'group_8',
              label: 'My group 8',
              type: 'group',
              children: [
                {
                  name: 'text_9',
                  label: 'Enter some text 9',
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
                      code: 'function apiCompose(submission, survey, parent) {\n  console.warn(6);\n  return {number:6};\n}',
                    },
                  },
                  id: '6310b45b72c84c00015454a3',
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
                  code: 'function apiCompose(submission, survey, parent) {\n  console.warn(7);\n  return {number:7};\n}',
                },
              },
              id: '6310b45872c84c00015454a1',
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
              code: 'function apiCompose(submission, survey, parent) {\n  console.warn(8);\n  return {number:8};\n}',
            },
          },
          id: '6310b43772c84c0001545496',
          hint: '',
        },
        {
          name: 'page_4',
          label: 'My page 4',
          type: 'page',
          children: [
            {
              name: 'text_10',
              label: 'Enter some text 10',
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
                  code: 'function apiCompose(submission, survey, parent) {\n  console.warn(9);\n  return {number:9};\n}',
                },
              },
              id: '6310b45f72c84c00015454a5',
              hint: '',
              value: null,
            },
            {
              name: 'text_11',
              label: 'Enter some text 11',
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
                  code: 'function apiCompose(submission, survey, parent) {\n  console.warn(10);\n  return {number:10};\n}',
                },
              },
              id: '6310b46172c84c00015454a7',
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
              code: 'function apiCompose(submission, survey, parent) {\n  console.warn(11);\n  return {number:11};\n}',
            },
          },
          id: '6310b43f72c84c0001545498',
          hint: '',
        },
      ],
    },
  ],
};
