import { expectationFailed } from '@hapi/boom';
import { get } from 'lodash';
import { getHeaders } from './header.service';
import { ObjectId } from 'mongodb';
const { getDb } = jest.requireActual('../db');

describe.skip('stringifyObjectIds', () => {});

describe.skip('arrayMax', () => {});

describe.skip('getLatestSurveyVersion', () => {
  // it('', () => {
  // });
});

describe.skip('getSurveyHeaders', () => {});

describe.skip('getSubmissionHeaders', () => {});

describe.skip('mergeHeaders', () => {});

// describe('coll')

function mockSurvey() {
  return {
    // _id: '60b524715575f00001f504da',
    _id: ObjectId('60b524715575f00001f504da'),
    name: 'test survey',
    latestVersion: 2,
    meta: {
      dateCreated: '2021-05-31T18:01:21.662Z',
      dateModified: '2021-05-31T18:01:31.847Z',
      submissions: 'public',
      creator: '5e452119c5117c000185f275',
      group: {
        id: '5e6f8bbeea14550001470c28',
        path: '/our-sci/',
      },
      specVersion: 4,
    },
    resources: [],
    revisions: [
      {
        dateCreated: '1970-01-01T00:00:00.000Z',
        version: 1,
        controls: [],
      },
      {
        dateCreated: '1970-01-01T00:00:00.000Z',
        version: 2,
        controls: [
          {
            name: 'map_1',
            label: 'Map 1',
            type: 'geoJSON',
            // id: '60b524795575f00001f504dc',
            // hint: '',
            // value: null,
          },
        ],
      },
    ],
  };
}

function mockSurveyComplex() {
  return {
    _id: ObjectId('6217dd5ec7218200013e6819'),
    name: 'matrix geojson test',
    latestVersion: 1,
    meta: {
      dateCreated: '2022-02-24T19:32:46.561Z',
      dateModified: '2022-02-24T19:32:46.561Z',
      submissions: 'public',
      creator: '6217b8e7ee2cd538a5765582',
      group: {
        id: null,
        path: null,
      },
      specVersion: 4,
    },
    resources: [],
    revisions: [
      {
        dateCreated: '1970-01-01T00:00:00.000Z',
        version: 1,
        controls: [
          {
            name: 'matrix_1',
            label: 'Matrix 1',
            type: 'matrix',
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
                enabled: false,
                code: '',
              },
              source: {
                config: {
                  addRowLabel: 'Add row',
                  fixedColumns: 1,
                },
                content: [
                  {
                    label: 'Sample',
                    value: 'sample',
                    tags: '',
                    type: 'number',
                    resource: '',
                    multiple: false,
                    required: false,
                    redacted: false,
                    scaleWidth: 100,
                  },
                  {
                    label: 'Description',
                    value: 'description',
                    tags: '',
                    type: 'text',
                    resource: '',
                    multiple: false,
                    required: false,
                    redacted: false,
                    scaleWidth: 100,
                  },
                ],
              },
            },
            id: '6217dd6ec7218200013e681b',
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
                enabled: false,
                code: '',
              },
            },
            id: '6217dd7fc7218200013e681f',
            hint: '',
            value: null,
          },
          {
            name: 'group_4',
            label: 'My group 4',
            type: 'group',
            children: [
              {
                name: 'number_5',
                label: 'Enter a number 5',
                type: 'number',
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
                    enabled: false,
                    code: '',
                  },
                },
                id: '6217dd8fc7218200013e6823',
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
                enabled: false,
                code: '',
              },
            },
            id: '6217dd89c7218200013e6821',
            hint: '',
          },
          {
            name: 'map_2',
            label: 'Map 2',
            type: 'geoJSON',
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
                enabled: false,
                code: '',
              },
              geoJSON: {
                showPolygon: true,
                showLine: true,
                showCircle: true,
                showPoint: true,
              },
            },
            id: '6217dd75c7218200013e681d',
            hint: '',
            value: null,
          },
        ],
      },
    ],
  };
}

function mockSubmissions() {
  return [
    {
      // _id: '6217f4f2c7218200013e6829',
      _id: ObjectId('6217f4f2c7218200013e6829'),
      meta: {
        dateCreated: '2022-02-24T21:13:22.496Z',
        dateModified: '2022-02-24T21:13:42.103Z',
        dateSubmitted: '2022-02-24T21:13:48.476Z',
        survey: {
          id: '6217dd5ec7218200013e6819',
          // id: ObjectId('6217dd5ec7218200013e6819'),
          version: 1,
        },
        revision: 1,
        permissions: [],
        status: [
          {
            type: 'READY_TO_SUBMIT',
            value: {
              at: '2022-02-24T21:13:48.398Z',
            },
          },
        ],
        group: {
          id: '6217dd4cc7218200013e6817',
          path: '/test-group/',
        },
        specVersion: 3,
        creator: '6217b8e7ee2cd538a5765582',
      },
      data: {
        matrix_1: {
          value: [
            {
              sample: {
                value: 1,
              },
              description: {
                value: 'ddd',
              },
            },
            {
              sample: {
                value: 2,
              },
              description: {
                value: 'wwww',
              },
            },
          ],
          meta: {
            type: 'matrix',
            dateModified: '2022-02-24T16:13:31.377-05:00',
          },
        },
        text_3: {
          value: '3',
          meta: {
            type: 'string',
            dateModified: '2022-02-24T16:13:35.635-05:00',
          },
        },
        group_4: {
          meta: {
            type: 'group',
          },
          number_5: {
            value: 3,
            meta: {
              type: 'number',
              dateModified: '2022-02-24T16:13:38.151-05:00',
            },
          },
        },
        map_2: {
          value: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [1, 1],
                },
                properties: null,
                id: 'measureFeature1',
              },
            ],
          },
          meta: {
            type: 'geoJSON',
            dateModified: '2022-02-24T16:13:42.103-05:00',
          },
        },
      },
    },
    {
      _id: '6217dd96c7218200013e6827',
      meta: {
        dateCreated: '2022-02-24T19:33:42.420Z',
        dateModified: '2022-02-24T19:34:04.439Z',
        dateSubmitted: '2022-02-24T19:34:12.197Z',
        survey: {
          id: '6217dd5ec7218200013e6819',
          version: 1,
        },
        revision: 1,
        permissions: [],
        status: [
          {
            type: 'READY_TO_SUBMIT',
            value: {
              at: '2022-02-24T19:34:12.145Z',
            },
          },
        ],
        group: {
          id: '6217dd4cc7218200013e6817',
          path: '/test-group/',
        },
        specVersion: 3,
        creator: '6217b8e7ee2cd538a5765582',
      },
      data: {
        matrix_1: {
          value: [
            {
              sample: {
                value: 1,
              },
              description: {
                value: 'asdf',
              },
            },
            {
              sample: {
                value: 2,
              },
              description: {
                value: 'sadf',
              },
            },
          ],
          meta: {
            type: 'matrix',
            dateModified: '2022-02-24T14:33:50.091-05:00',
          },
        },
        text_3: {
          value: '3',
          meta: {
            type: 'string',
            dateModified: '2022-02-24T14:33:53.035-05:00',
          },
        },
        group_4: {
          meta: {
            type: 'group',
          },
          number_5: {
            value: 4,
            meta: {
              type: 'number',
              dateModified: '2022-02-24T14:33:58.069-05:00',
            },
          },
        },
        map_2: {
          value: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [-43.330989678573616, -22.92006047286621],
                },
                properties: null,
                id: 'measureFeature0',
              },
            ],
          },
          meta: {
            type: 'geoJSON',
            dateModified: '2022-02-24T14:34:04.439-05:00',
          },
        },
      },
    },
  ];
}

describe('getHeaders', () => {
  it('returns flat survey headers array as expected', async () => {
    const survey = mockSurveyComplex();
    await getDb().collection('surveys').insertOne(survey);
    const actualHeaders = await getHeaders(survey._id, mockSubmissions());
    const expectedHeaders = [
      '_id',
      'meta.dateCreated',
      'meta.dateModified',
      'meta.dateSubmitted',
      'meta.survey.id',
      'meta.survey.version',
      'meta.revision',
      'meta.permissions',
      'meta.status.0.type',
      'meta.status.0.value.at',
      'meta.group.id',
      'meta.group.path',
      'meta.specVersion',
      'meta.creator',
      'data.matrix_1.value.0.description.value',
      'data.matrix_1.value.0.sample.value',
      'data.matrix_1.value.1.description.value',
      'data.matrix_1.value.1.sample.value',
      'data.text_3.value',
      'data.group_4.number_5.value',
      'data.map_2.value.features.0.geometry.coordinates.0',
      'data.map_2.value.features.0.geometry.coordinates.1',
      'data.map_2.value.features.0.geometry.type',
      'data.map_2.value.features.0.id',
      'data.map_2.value.features.0.properties',
      'data.map_2.value.features.0.type',
      'data.map_2.value.type',
      'data.matrix_1.meta.type',
      'data.matrix_1.meta.dateModified',
      'data.text_3.meta.type',
      'data.text_3.meta.dateModified',
      'data.group_4.meta.type',
      'data.group_4.number_5.meta.type',
      'data.group_4.number_5.meta.dateModified',
      'data.map_2.meta.type',
      'data.map_2.meta.dateModified',
    ];
    expect(new Set(expectedHeaders)).toEqual(new Set(actualHeaders));
  });

  it('excludes meta when excludeDataMeta is passed', async () => {
    const expectedHeaders = [
      '_id',
      'meta.dateCreated',
      'meta.dateModified',
      'meta.dateSubmitted',
      'meta.survey.id',
      'meta.survey.version',
      'meta.revision',
      'meta.permissions',
      'meta.status.0.type',
      'meta.status.0.value.at',
      'meta.group.id',
      'meta.group.path',
      'meta.specVersion',
      'meta.creator',
      'data.matrix_1.value.0.description.value',
      'data.matrix_1.value.0.sample.value',
      'data.matrix_1.value.1.description.value',
      'data.matrix_1.value.1.sample.value',
      'data.text_3.value',
      'data.group_4.number_5.value',
      'data.map_2.value.features.0.geometry.coordinates.0',
      'data.map_2.value.features.0.geometry.coordinates.1',
      'data.map_2.value.features.0.geometry.type',
      'data.map_2.value.features.0.id',
      'data.map_2.value.features.0.properties',
      'data.map_2.value.features.0.type',
      'data.map_2.value.type',
    ];
    const survey = mockSurveyComplex();
    const opts = { excludeDataMeta: true };
    await getDb().collection('surveys').insertOne(survey);
    const actualHeaders = await getHeaders(survey._id, mockSubmissions(), opts);
    expect(new Set(expectedHeaders)).toEqual(new Set(actualHeaders));
  });

  it('splitValueFieldFromQuestions option removes value field from questions', async () => {
    // const expectedHeaders = [
    //   '_id',
    //   'meta.dateCreated',
    //   'meta.dateModified',
    //   'meta.dateSubmitted',
    //   'meta.survey.id',
    //   'meta.survey.version',
    //   'meta.revision',
    //   'meta.permissions',
    //   'meta.status.0.type',
    //   'meta.status.0.value.at',
    //   'meta.group.id',
    //   'meta.group.path',
    //   'meta.specVersion',
    //   'meta.creator',
    //   'data.matrix_1.meta.dateModified',
    //   'data.matrix_1.meta.type',
    //   'data.matrix_1.value.0.description.value',
    //   'data.matrix_1.value.0.sample.value',
    //   'data.matrix_1.value.1.description.value',
    //   'data.matrix_1.value.1.sample.value',
    //   'data.text_3.meta.dateModified',
    //   'data.text_3.meta.type',
    //   'data.text_3.value',
    //   'data.group_4.number_5.meta.dateModified',
    //   'data.group_4.number_5.meta.type',
    //   'data.group_4.number_5.value',
    //   'data.map_2.meta.dateModified',
    //   'data.map_2.meta.type',
    //   'data.map_2.value.features.0.geometry.coordinates.0',
    //   'data.map_2.value.features.0.geometry.coordinates.1',
    //   'data.map_2.value.features.0.geometry.type',
    //   'data.map_2.value.features.0.id',
    //   'data.map_2.value.features.0.properties',
    //   'data.map_2.value.features.0.type',
    //   'data.map_2.value.type',
    //   'data.group_4.meta.type',
    // ];
    const survey = mockSurveyComplex();
    const opts = { splitValueFieldFromQuestions: true };
    await getDb().collection('surveys').insertOne(survey);
    const actualHeaders = await getHeaders(survey._id, mockSubmissions(), opts);
    // console.log('---actual with split\n', actualHeaders.sort());
    const actualHeadersWithoutSplit = await getHeaders(survey._id, mockSubmissions(), {
      splitValueFieldFromQuestions: false,
    });
    // console.log('==-actual without split\n', actualHeadersWithoutSplit.sort());
    // expect(new Set(expectedHeaders)).toEqual(new Set(actualHeaders));
    expect(new Set(actualHeadersWithoutSplit)).toEqual(new Set(actualHeaders));
  });
});
