import { db } from '../db';
import { ObjectId } from 'mongodb'
import headerService from '../services/header.service';
import submissionController from './submissionController';
import { expectationFailed } from '@hapi/boom';

const { getSubmissionsCsv, prepareSubmissionsToQSLs } = submissionController;

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
    'data.map_1.value.features.0',
    'data.map_1.value.type'
  ];
}

const sampleQSLConsumerControls = [
  {
    "name": "text_3",
    "label": "Enter some text 3",
    "type": "string",
    "options": {
      "readOnly": false,
      "required": false,
      "redacted": false,
      "relevance": {
        "enabled": false,
        "code": ""
      },
      "constraint": {
        "enabled": false,
        "code": ""
      },
      "calculate": {
        "enabled": false,
        "code": ""
      },
      "apiCompose": {
        "enabled": false,
        "code": ""
      }
    },
    "id": "617aaa2f5487fa0001188268",
    "hint": "",
    "value": null
  },
  {
    "name": "qslone",
    "label": "qsl-one",
    "type": "group",
    "children": [
      {
        "name": "text_1",
        "label": "Enter some text 1",
        "type": "string",
        "options": {
          "readOnly": false,
          "required": false,
          "redacted": false,
          "relevance": {
            "enabled": false,
            "code": ""
          },
          "constraint": {
            "enabled": false,
            "code": ""
          },
          "calculate": {
            "enabled": false,
            "code": ""
          },
          "apiCompose": {
            "enabled": false,
            "code": ""
          }
        },
        "id": "617aa9e95487fa000118824e",
        "hint": "",
        "value": null,
        "libraryId": "617aa95e5487fa0001188204",
        "libraryVersion": 3,
        "libraryIsInherited": true
      }
    ],
    "options": {
      "readOnly": false,
      "required": false,
      "redacted": false,
      "relevance": {
        "enabled": false,
        "code": ""
      },
      "constraint": {
        "enabled": false,
        "code": ""
      },
      "calculate": {
        "enabled": false,
        "code": ""
      },
      "apiCompose": {
        "enabled": false,
        "code": ""
      }
    },
    "id": "617aa9e95487fa000118824c",
    "isLibraryRoot": true,
    "libraryId": "617aa95e5487fa0001188204",
    "libraryVersion": 3
  },
  {
    "name": "qsltwo",
    "label": "qsl-two",
    "type": "group",
    "children": [
      {
        "name": "text_1",
        "label": "Enter some text 1",
        "type": "string",
        "options": {
          "readOnly": false,
          "required": false,
          "redacted": true,
          "relevance": {
            "enabled": false,
            "code": ""
          },
          "constraint": {
            "enabled": false,
            "code": ""
          },
          "calculate": {
            "enabled": false,
            "code": ""
          },
          "apiCompose": {
            "enabled": false,
            "code": ""
          }
        },
        "id": "617ab1ad78c2ff00016bd40e",
        "hint": "",
        "value": null,
        "libraryId": "617aa98a5487fa0001188218",
        "libraryVersion": 4,
        "libraryIsInherited": true
      }
    ],
    "options": {
      "readOnly": false,
      "required": false,
      "redacted": false,
      "relevance": {
        "enabled": false,
        "code": ""
      },
      "constraint": {
        "enabled": false,
        "code": ""
      },
      "calculate": {
        "enabled": false,
        "code": ""
      },
      "apiCompose": {
        "enabled": false,
        "code": ""
      }
    },
    "id": "617ab1ad78c2ff00016bd40c",
    "isLibraryRoot": true,
    "libraryId": "617aa98a5487fa0001188218",
    "libraryVersion": 4
  },
  {
    "name": "page_2",
    "label": "My page 2",
    "type": "page",
    "children": [
      {
        "name": "qsltwo",
        "label": "qsl-two",
        "type": "group",
        "children": [
          {
            "name": "text_1",
            "label": "Enter some text 1",
            "type": "string",
            "options": {
              "readOnly": false,
              "required": false,
              "redacted": false,
              "relevance": {
                "enabled": false,
                "code": ""
              },
              "constraint": {
                "enabled": false,
                "code": ""
              },
              "calculate": {
                "enabled": false,
                "code": ""
              },
              "apiCompose": {
                "enabled": false,
                "code": ""
              }
            },
            "id": "617aaa105487fa000118825c",
            "hint": "",
            "value": null,
            "libraryId": "617aa98a5487fa0001188218",
            "libraryVersion": 3,
            "libraryIsInherited": true
          }
        ],
        "options": {
          "readOnly": false,
          "required": false,
          "redacted": false,
          "relevance": {
            "enabled": false,
            "code": ""
          },
          "constraint": {
            "enabled": false,
            "code": ""
          },
          "calculate": {
            "enabled": false,
            "code": ""
          },
          "apiCompose": {
            "enabled": false,
            "code": ""
          }
        },
        "id": "617aaa105487fa000118825a",
        "isLibraryRoot": true,
        "libraryId": "617aa98a5487fa0001188218",
        "libraryVersion": 3
      }
    ],
    "options": {
      "readOnly": false,
      "required": false,
      "redacted": false,
      "relevance": {
        "enabled": false,
        "code": ""
      },
      "constraint": {
        "enabled": false,
        "code": ""
      },
      "calculate": {
        "enabled": false,
        "code": ""
      },
      "apiCompose": {
        "enabled": false,
        "code": ""
      }
    },
    "id": "617aa9f95487fa0001188253",
    "hint": "",
    "value": null
  },
  {
    "name": "qslthree",
    "label": "qsl-three",
    "type": "group",
    "children": [
      {
        "name": "text_1",
        "label": "Enter some text 1",
        "type": "string",
        "options": {
          "readOnly": false,
          "required": false,
          "redacted": false,
          "relevance": {
            "enabled": false,
            "code": ""
          },
          "constraint": {
            "enabled": false,
            "code": ""
          },
          "calculate": {
            "enabled": false,
            "code": ""
          },
          "apiCompose": {
            "enabled": false,
            "code": ""
          }
        },
        "id": "617aaa265487fa0001188263",
        "hint": "",
        "value": null,
        "libraryId": "617aa9965487fa000118821f",
        "libraryVersion": 4,
        "libraryIsInherited": true
      },
      {
        "name": "qslthree",
        "label": "qsl-three",
        "type": "group",
        "children": [
          {
            "name": "text_1",
            "label": "Enter some text 1",
            "type": "string",
            "options": {
              "readOnly": false,
              "required": false,
              "redacted": false,
              "relevance": {
                "enabled": false,
                "code": ""
              },
              "constraint": {
                "enabled": false,
                "code": ""
              },
              "calculate": {
                "enabled": false,
                "code": ""
              },
              "apiCompose": {
                "enabled": false,
                "code": ""
              }
            },
            "id": "617aaa265487fa0001188266",
            "hint": "",
            "value": null,
            "libraryId": "617aa9965487fa000118821f",
            "libraryVersion": 3,
            "libraryIsInherited": true
          }
        ],
        "options": {
          "readOnly": false,
          "required": false,
          "redacted": false,
          "relevance": {
            "enabled": false,
            "code": ""
          },
          "constraint": {
            "enabled": false,
            "code": ""
          },
          "calculate": {
            "enabled": false,
            "code": ""
          },
          "apiCompose": {
            "enabled": false,
            "code": ""
          }
        },
        "id": "617aaa265487fa0001188265",
        "isLibraryRoot": true,
        "libraryId": "617aa9965487fa000118821f",
        "libraryVersion": 3,
        "libraryIsInherited": true
      }
    ],
    "options": {
      "readOnly": false,
      "required": false,
      "redacted": false,
      "relevance": {
        "enabled": false,
        "code": ""
      },
      "constraint": {
        "enabled": false,
        "code": ""
      },
      "calculate": {
        "enabled": false,
        "code": ""
      },
      "apiCompose": {
        "enabled": false,
        "code": ""
      }
    },
    "id": "617aaa265487fa0001188261",
    "isLibraryRoot": true,
    "libraryId": "617aa9965487fa000118821f",
    "libraryVersion": 4
  }
];

const sampleSubmissionContainingQsl = {
  "_id": "617ab24178c2ff00016bd417",
  "meta": {
    "dateCreated": "2021-10-28T14:22:57.082Z",
    "dateModified": "2021-10-28T14:23:01.024Z",
    "dateSubmitted": "2021-10-28T14:23:12.789Z",
    "survey": {
      "id": "617aa9de5487fa0001188248",
      "version": 3
    },
    "revision": 1,
    "permissions": [],
    "status": [
      {
        "type": "READY_TO_SUBMIT",
        "value": {
          "at": "2021-10-28T14:23:12.754Z"
        }
      }
    ],
    "specVersion": 3,
    "creator": "61517c38a7fd000001faae55"
  },
  "data": {
    "text_3": {
      "value": "1",
      "meta": {
        "type": "string",
        "dateModified": "2021-10-28T16:22:58.055+02:00"
      }
    },
    "qslone": {
      "meta": {
        "type": "group"
      },
      "text_1": {
        "value": "2",
        "meta": {
          "type": "string",
          "dateModified": "2021-10-28T16:22:58.855+02:00"
        }
      }
    },
    "qsltwo": {
      "meta": {
        "type": "group"
      },
      "text_1": {
        "value": "3",
        "meta": {
          "type": "string",
          "dateModified": "2021-10-28T16:22:59.376+02:00",
          "permissions": [
            "admin"
          ]
        }
      }
    },
    "page_2": {
      "meta": {
        "type": "page"
      },
      "qsltwo": {
        "meta": {
          "type": "group"
        },
        "text_1": {
          "value": "4",
          "meta": {
            "type": "string",
            "dateModified": "2021-10-28T16:22:59.872+02:00"
          }
        }
      }
    },
    "qslthree": {
      "meta": {
        "type": "group"
      },
      "text_1": {
        "value": "5",
        "meta": {
          "type": "string",
          "dateModified": "2021-10-28T16:23:00.375+02:00"
        }
      },
      "qslthree": {
        "meta": {
          "type": "group"
        },
        "text_1": {
          "value": "6",
          "meta": {
            "type": "string",
            "dateModified": "2021-10-28T16:23:01.024+02:00"
          }
        }
      }
    }
  }
};

describe('submissionController', () => {
  describe('getSubmissionsCsv', () => {
    it('returns expected CSV for geojson question type', async () => {
      
      const mockReq = { 
        query: {}, 
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
      const expected = `_id,meta.dateCreated,meta.dateModified,meta.dateSubmitted,meta.survey.id,meta.survey.version,meta.revision,meta.permissions,meta.status.0.type,meta.status.0.value.at,meta.group.id,meta.group.path,meta.specVersion,meta.creator,data.map_1.value.features.0,data.map_1.value.type\r\n60b52489fe387f0001339266,2021-05-31T18:01:45.771Z,2021-05-31T18:01:51.153Z,2021-05-31T18:01:54.979Z,60b524715575f00001f504da,2,1,,READY_TO_SUBMIT,2021-05-31T18:01:54.902Z,5e6f8bbeea14550001470c28,/our-sci/,3,5e452119c5117c000185f275,"{""type"":""Feature"",""geometry"":{""type"":""Polygon"",""coordinates"":[[[-6.562507152557395,30.54964053646397],[16.406257152557362,5.382682618676981],[-18.281250000000018,5.382682618676981],[-6.562507152557395,30.54964053646397]]]},""properties"":null,""id"":""measureFeature0""}",FeatureCollection`;
      expect(mockRes.send).toHaveBeenCalledWith(expected);

    })
  });
  describe('prepareSubmissionsToQSLs', () => {
    it('returns no submission for empty params', async () => {
      const controls = [];
      let submission = {};
      const QSLSubmissions = await prepareSubmissionsToQSLs(controls, submission);
      expect(QSLSubmissions.length).toBe(0);
    });
    it('returns one submission for each used question set library in controls', async () => {
      let controls = sampleQSLConsumerControls; //contains 5 qsl usages
      let submission = sampleSubmissionContainingQsl;
      const QSLSubmissions = await prepareSubmissionsToQSLs(controls, submission);
      expect(QSLSubmissions.length).toBe(5);
    });
    it('keeps private data marked with permissions=admin for all child submissions', async () => {
      let controls = sampleQSLConsumerControls; //contains 5 qsl usages
      let submission = sampleSubmissionContainingQsl;
      const QSLSubmissions = await prepareSubmissionsToQSLs(controls, submission);
      expect(QSLSubmissions[1].data.text_1.meta.permissions).toStrictEqual(['admin']);
      expect(QSLSubmissions[2].data.text_1.meta.permissions).toStrictEqual(['admin']);
    });
  });
});