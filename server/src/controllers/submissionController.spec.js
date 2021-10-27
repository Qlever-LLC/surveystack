import { db } from '../db';
import { ObjectId } from 'mongodb'
import headerService from '../services/header.service';
import submissionController from './submissionController';
import { expectationFailed } from '@hapi/boom';

const { getSubmissionsCsv } = submissionController;

jest.mock('../db', () => ({ db: {
  collection: () => ({
    aggregate: () => ({ toArray: mockDBValue }),
  }),
} }));
jest.mock('../services/header.service', () => ({ getHeaders: mockGetHeaders }));


function mockDBValue() {
  return [
    {
      "_id": ObjectId("60b52489fe387f0001339266"),
      "meta": {
        "dateCreated": "2021-05-31T18:01:45.771Z",
        "dateModified": "2021-05-31T18:01:51.153Z",
        "dateSubmitted": "2021-05-31T18:01:54.979Z",
        "survey": {
          "id": "60b524715575f00001f504da",
          "version": 2
        },
        "revision": 1,
        "permissions": [],
        "status": [
          {
            "type": "READY_TO_SUBMIT",
            "value": {
              "at": "2021-05-31T18:01:54.902Z"
            }
          }
        ],
        "group": {
          "id": "5e6f8bbeea14550001470c28",
          "path": "/our-sci/"
        },
        "specVersion": 3,
        "creator": "5e452119c5117c000185f275"
      },
      "data": {
        "map_1": {
          "value": {
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "geometry": {
                  "type": "Polygon",
                  "coordinates": [
                    [
                      [
                        -6.562507152557395,
                        30.54964053646397
                      ],
                      [
                        16.406257152557362,
                        5.382682618676981
                      ],
                      [
                        -18.281250000000018,
                        5.382682618676981
                      ],
                      [
                        -6.562507152557395,
                        30.54964053646397
                      ]
                    ]
                  ]
                },
                "properties": null,
                "id": "measureFeature0"
              }
            ]
          },
          "meta": {
            "type": "geoJSON",
            "dateModified": "2021-05-31T14:01:51.153-04:00"
          }
        }
      }
    }
  ];
}

function mockGetHeaders() {
  return [
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
    'data.map_1.features.0',
    'data.map_1.type'
  ];
}

describe('submissionController', () => {
  describe('getSubmissionsCsv', () => {
    it('returns expected CSV for geojson question type', async () => {
      
      const mockReq = { 
        query: { showCsvDataMeta: 'true' }, 
        cookies: {}
      };
      const mockRes = {
        set: jest.fn(),
        send: jest.fn(),
        locals: {
          auth: {
            isAuthenticated: false,
            user: {
              _id: new ObjectId(),
            },
            roles: [],
          },
        }
      }
      await getSubmissionsCsv(mockReq, mockRes);
      const expected = `_id,meta.dateCreated,meta.dateModified,meta.dateSubmitted,meta.survey.id,meta.survey.version,meta.revision,meta.permissions,meta.status.0.type,meta.status.0.value.at,meta.group.id,meta.group.path,meta.specVersion,meta.creator,data.map_1.features.0,data.map_1.type\r\n60b52489fe387f0001339266,2021-05-31T18:01:45.771Z,2021-05-31T18:01:51.153Z,2021-05-31T18:01:54.979Z,60b524715575f00001f504da,2,1,,READY_TO_SUBMIT,2021-05-31T18:01:54.902Z,5e6f8bbeea14550001470c28,/our-sci/,3,5e452119c5117c000185f275,"{""type"":""Feature"",""geometry"":{""type"":""Polygon"",""coordinates"":[[[-6.562507152557395,30.54964053646397],[16.406257152557362,5.382682618676981],[-18.281250000000018,5.382682618676981],[-6.562507152557395,30.54964053646397]]]},""properties"":null,""id"":""measureFeature0""}",FeatureCollection`;
      expect(mockRes.send).toHaveBeenCalledWith(expected);

    })
  })
});