import {
  transformSubmissionQuestionTypes,
  geojsonTransformer,
  matrixTransformer,
  ExpandableCell,
} from './csv.service';


function mockSubmissions() {
  return [{
    _id: '60b52489fe387f0001339266',
    meta: {
      dateCreated: '2021-05-31T18:01:45.771Z',
      dateModified: '2021-05-31T18:01:51.153Z',
      dateSubmitted: '2021-05-31T18:01:54.979Z',
      survey: {
        id: '60b524715575f00001f504da',
        version: 2,
      },
      revision: 1,
      permissions: [],
      status: [{
        type: 'READY_TO_SUBMIT',
        value: {
          at: '2021-05-31T18:01:54.902Z',
        },
      }],
      group: {
        id: '5e6f8bbeea14550001470c28',
        path: '/our-sci/',
      },
      specVersion: 3,
      creator: '5e452119c5117c000185f275',
      creatorDetail: {
        email: 'bob@our-sci.net',
        name: 'Bob',
      },
    },
    data: {
      map_1: {
        value: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-6.562507152557395, 30.54964053646397],
                  [16.406257152557362, 5.382682618676981],
                  [-18.281250000000018, 5.382682618676981],
                  [-6.562507152557395, 30.54964053646397],
                ],
              ],
            },
            properties: null,
            id: 'measureFeature0',
          }],
        },
        meta: {
          type: 'geoJSON',
          dateModified: '2021-05-31T14:01:51.153-04:00',
        },
      },
    },
  }];
}

function mockSubmissionsNested() {
  return [
    {
      _id: '60c7fe761ff66100016309a1',
      meta: {
        dateCreated: '2021-06-15T01:12:22.005Z',
        dateModified: '2021-06-15T01:12:36.811Z',
        dateSubmitted: '2021-06-15T01:12:41.494Z',
        survey: {
          id: '60c7fdfa1ff6610001630983',
          version: 3,
        },
        revision: 1,
        permissions: [],
        status: [
          {
            type: 'READY_TO_SUBMIT',
            value: {
              at: '2021-06-15T01:12:41.424Z',
            },
          },
        ],
        group: {
          id: '5e6f8bbeea14550001470c28',
          path: '/our-sci/',
        },
        specVersion: 3,
        creator: '5e452119c5117c000185f275',
        creatorDetail: {
          email: 'admin@our-sci.net',
          name: 'Default Our-Sci Admin',
        },
      },
      data: {
        group_1: {
          meta: {
            type: 'group',
          },
          map_2: {
            value: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [
                      [
                        [
                          -53.27271580696107,
                          17.17991416542307,
                        ],
                        [
                          -68.61362099647523,
                          -9.991468170475883,
                        ],
                        [
                          -71.80963397026063,
                          21.995843855472643,
                        ],
                        [
                          -53.27271580696107,
                          17.17991416542307,
                        ],
                      ],
                    ],
                  },
                  properties: null,
                  id: 'measureFeature2',
                },
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [
                      [
                        [
                          -34.416164159774794,
                          -2.37136642189715,
                        ],
                        [
                          -17.796853780746478,
                          -37.47986176111076,
                        ],
                        [
                          1.059676408767693,
                          -1.1687685082695793,
                        ],
                        [
                          -34.416164159774794,
                          -2.37136642189715,
                        ],
                      ],
                    ],
                  },
                  properties: null,
                  id: 'measureFeature3',
                },
              ],
            },
            meta: {
              type: 'geoJSON',
              dateModified: '2021-06-14T21:12:30.817-04:00',
            },
          },
          text_1: {
            value: 'ss',
            meta: {
              type: 'string',
              dateModified: '2021-06-14T21:12:33.839-04:00',
            },
          },
        },
        text_3: {
          value: 'mvmvmv',
          meta: {
            type: 'string',
            dateModified: '2021-06-14T21:12:36.811-04:00',
          },
        },
      },
    },
    {
      _id: '60c7fe561ff66100016309a0',
      meta: {
        dateCreated: '2021-06-15T01:11:50.400Z',
        dateModified: '2021-06-15T01:12:12.878Z',
        dateSubmitted: '2021-06-15T01:12:16.862Z',
        survey: {
          id: '60c7fdfa1ff6610001630983',
          version: 3,
        },
        revision: 1,
        permissions: [],
        status: [
          {
            type: 'READY_TO_SUBMIT',
            value: {
              at: '2021-06-15T01:12:16.767Z',
            },
          },
        ],
        group: {
          id: '5e6f8bbeea14550001470c28',
          path: '/our-sci/',
        },
        specVersion: 3,
        creator: '5e452119c5117c000185f275',
        creatorDetail: {
          email: 'admin@our-sci.net',
          name: 'Default Our-Sci Admin',
        },
      },
      data: {
        group_1: {
          meta: {
            type: 'group',
          },
          map_2: {
            value: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [
                      [
                        [
                          -0.8579313755035645,
                          26.081006368966726,
                        ],
                        [
                          35.89631438255311,
                          -1.0935721366739273,
                        ],
                        [
                          -16.198836565017714,
                          -9.045876654517969,
                        ],
                        [
                          -0.8579313755035645,
                          26.081006368966726,
                        ],
                      ],
                    ],
                  },
                  properties: null,
                  id: 'measureFeature1',
                },
              ],
            },
            meta: {
              type: 'geoJSON',
              dateModified: '2021-06-14T21:12:06.585-04:00',
            },
          },
          text_1: {
            value: 'a',
            meta: {
              type: 'string',
              dateModified: '2021-06-14T21:12:08.997-04:00',
            },
          },
        },
        text_3: {
          value: 'dddd',
          meta: {
            type: 'string',
            dateModified: '2021-06-14T21:12:12.878-04:00',
          },
        },
      },
    },
  ];
}

describe('CSV Service ', () => {
  describe('transformQuestionTypes', () => {
    // it('applies function to submissions object', () => {
    //   const submissions = mockSubmissions();
    //   console.log(geojsonTransformer);
    //   const actual = transformQuestionTypes(submissions[0].data, geojsonTransformer);
    //   expect(submissions[0].data);
    //   console.log(submissions[0].data.map_1.value.features[0]);
    // });

    it('applies geojsonTransformer function to submissions object', () => {
      const submissions = mockSubmissions();
      const actual = transformSubmissionQuestionTypes(
        submissions[0].data, 
        { geoJSON: geojsonTransformer }
      );
      expect(actual.map_1.value.features.length).toBe(1);
      expect(actual.map_1.value.features[0]).toBe(
        JSON.stringify(submissions[0].data.map_1.value.features[0])
      );
    });

    it('applies geojsonTransformer function correctly to nested submissions object', () => {
      const submissions = mockSubmissionsNested();
      const actual = transformSubmissionQuestionTypes(
        submissions[0].data,
        { geoJSON: geojsonTransformer },
      );
      expect(actual.group_1.map_2.value.features[0]).toBe(
        JSON.stringify(submissions[0].data.group_1.map_2.value.features[0])
      );
      expect(actual.group_1.map_2.value.features[1]).toBe(
        JSON.stringify(submissions[0].data.group_1.map_2.value.features[1])
      );
    });

    it('does not modify structure incorrectly', () => {
      const submissions = mockSubmissionsNested();
      const actual = transformSubmissionQuestionTypes(
        submissions[0].data,
        { geoJSON: geojsonTransformer },
      );

      expect(actual).toMatchObject({
        group_1: {
          meta: {
            type: 'group',
          },
          map_2: {
            value: {
              type: 'FeatureCollection',
              // features: expect.arrayContaining(expect.any(String)),
            },
            meta: {
              type: 'geoJSON',
              dateModified: expect.any(String),
            }
          },
          text_1: {
            value: 'ss',
            meta: {
              type: 'string',
              dateModified: '2021-06-14T21:12:33.839-04:00',
            },
          },
        },
        text_3: {
          value: 'mvmvmv',
          meta: {
            type: 'string',
            dateModified: '2021-06-14T21:12:36.811-04:00',
          },
        },
      });
    });

    describe('matrixTransformer', () => {
      const mockMatrix = (headers, rows) => {
        const value = rows.map((row) =>
          headers.reduce(
            (rowValue, colName, i) => ({ ...rowValue, [colName]: { value: row[i] } }),
            {}
          )
        );
        return {
          value,
          meta: {
            type: 'matrix',
            dateModified: '2021-10-11T16:11:52.123+02:00',
          },
        };
      };

      describe('test options', () => {
        [
          [{}, false],
          [{ expandAllMatrices: true }, true],
          [{ expandMatrix: ['matrix_1'] }, true],
          [{ expandMatrix: ['other_matrix'] }, false],
        ].forEach(([options, shouldExpand]) => {
          it(`${
            shouldExpand ? 'Expands' : "Doesn't expand"
          } 'matrix_1' when options=${JSON.stringify(options)}`, () => {
            const matrix = mockMatrix(
              ['foo', 'bar'],
              [
                [1, 2],
                [3, 4],
              ]
            );
            const transformed = matrixTransformer(matrix, 'matrix_1', options);

            if (shouldExpand) {
              expect(transformed.value.foo).toBeInstanceOf(ExpandableCell);
              expect(transformed.value.foo.read()).toEqual([1, 3]);
              expect(transformed.value.bar.read()).toEqual([2, 4]);
            } else {
              expect(transformed.value).toBe(JSON.stringify(matrix.value));
            }
          });
        });
      });

      describe('test expanding', () => {
        const matchHeadersAndRows = (matrix, headers, rows) => {
          const transformed = matrixTransformer(matrix, 'matrix_1', { expandAllMatrices: true });

          for (const [i, colName] of headers.entries()) {
            const col = rows.map((row) => row[i]);
            expect(transformed.value[colName].read()).toEqual(col);
          }
        };
        it('keeps null values', () => {
          const headers = ['foo', 'bar', 'quz'];
          const rows = [
            [1, null, 'baz'],
            [null, 'fuz', null],
            [null, null, null],
          ];
          const matrix = mockMatrix(headers, rows);
          matchHeadersAndRows(matrix, headers, rows);
        });

        it('handles when row has missing fields', () => {
          const headers = ['col1', 'col2', 'col3'];
          const rows = [
            ['a1', null, null],
            ['b1', null, 'b3'],
            ['c1', 'c2', 'c3'],
          ];
          const matrix = mockMatrix(headers, rows);
          delete matrix.value[0].col2;
          delete matrix.value[0].col3;
          delete matrix.value[1].col2;

          matchHeadersAndRows(matrix, headers, rows);
        });

        it('handles when values are objects', () => {
          const headers = ['col1', 'col2'];
          const rows = [
            [
              { a: 1, b: 2 },
              { c: 3, d: { e: 4, f: { g: 5 } } },
            ],
            [
              { a: 6, b: 7 },
              { c: 8, d: { e: 9, f: { g: 10 } } },
            ],
            [{ a: 11 }, { c: 12, d: { e: 13 } }],
          ];
          const matrix = mockMatrix(headers, rows);

          const expected_headers = ['col1.a', 'col1.b', 'col2.c', 'col2.d.e', 'col2.d.f.g'];
          const expected_rows = [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, null, 12, 13, null],
          ];
          matchHeadersAndRows(matrix, expected_headers, expected_rows);
        });
      });
    });
  });
});
