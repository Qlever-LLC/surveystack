import {
  transformSubmissionQuestionTypes,
  geojsonTransformer,
  matrixTransformer,
  ExpandableCell,
  removeMetaFromQuestions,
  expandCells,
  fileTransformer,
} from './csv.service';
import _ from 'lodash';
import { createSurvey, getSubmissionDataGenerator } from '../testUtils';

describe('CSV Service', () => {
  describe('transformQuestionTypes', () => {
    describe('with geojsonTransformer', () => {
      // it('applies function to submissions object', () => {
      //   const submissions = mockSubmissions();
      //   console.log(geojsonTransformer);
      //   const actual = transformQuestionTypes(submissions[0].data, geojsonTransformer);
      //   expect(submissions[0].data);
      //   console.log(submissions[0].data.map_1.value.features[0]);
      // });

      it('applies geojsonTransformer function to submissions object', async () => {
        const { createSubmission } = await createSurvey('geoJSON');
        const { submission } = await createSubmission();
        const actual = transformSubmissionQuestionTypes(submission.data, {
          geoJSON: geojsonTransformer,
        });
        expect(actual.map_1.value.features.length).toBe(1);
        expect(actual.map_1.value.features[0]).toBe(
          JSON.stringify(submission.data.map_1.value.features[0])
        );
      });

      it('applies geojsonTransformer function correctly to nested submissions object', async () => {
        const { createSubmission } = await createSurvey('group');
        const { submission } = await createSubmission();
        submission.data.group_1 = {
          ...submission.data.group_1,
          ...getSubmissionDataGenerator('geoJSON')({}, 2),
        };
        const actual = transformSubmissionQuestionTypes(submission.data, {
          geoJSON: geojsonTransformer,
        });
        expect(actual.group_1.map_2.value.features[0]).toBe(
          JSON.stringify(submission.data.group_1.map_2.value.features[0])
        );
      });

      it('does not modify structure incorrectly', async () => {
        const { createSubmission } = await createSurvey('group');
        const { submission } = await createSubmission();
        submission.data.group_1 = {
          ...submission.data.group_1,
          ...getSubmissionDataGenerator('text')(),
          ...getSubmissionDataGenerator('geoJSON')({}, 2),
        };
        const expected = _.cloneDeep(submission.data);
        expected.group_1.map_2.value.features = [
          JSON.stringify(expected.group_1.map_2.value.features[0]),
        ];
        const actual = transformSubmissionQuestionTypes(submission.data, {
          geoJSON: geojsonTransformer,
        });
        expect(actual).toMatchObject(expected);
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
              expect(transformed.value.foo.toArray()).toEqual([1, 3]);
              expect(transformed.value.bar.toArray()).toEqual([2, 4]);
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
            expect(transformed.value[colName].toArray()).toEqual(col);
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

    describe('fileTransformer', () => {
      it('applies fileTransformer function to files in submissions object', async () => {
        const { createSubmission } = await createSurvey('file');
        const { submission } = await createSubmission();
        const actual = transformSubmissionQuestionTypes(submission.data, {
          file: fileTransformer,
        });
        expect(
          actual.file_1.value[0].startsWith('https://surveystack-test.s3.amazonaws.com/')
        ).toBeTruthy();
      });

      it('applies fileTransformer function to images in submissions object', async () => {
        const { createSubmission } = await createSurvey('image');
        const { submission } = await createSubmission();
        const actual = transformSubmissionQuestionTypes(submission.data, {
          image: fileTransformer,
        });
        expect(
          actual.image_1.value[0].startsWith('https://surveystack-test.s3.amazonaws.com/')
        ).toBeTruthy();
      });
    });
  });

  describe('expandCells(flatSubmissions)', () => {
    it('expands ExpandableCell types into new rows', () => {
      const flatSubmission = {
        foo: 'bar',
        baz: ExpandableCell.fromArray([1, 2, 3]),
      };
      const transformed = expandCells([flatSubmission]);

      expect(transformed).toHaveLength(flatSubmission.baz.toArray().length + 1);
      expect(transformed[0].foo).toBe(flatSubmission.foo);
      expect(transformed[0].baz).toBeUndefined();
      expect(transformed[1].baz).toBe(flatSubmission.baz.toArray()[0]);
      expect(transformed[2].baz).toBe(flatSubmission.baz.toArray()[1]);
      expect(transformed[3].baz).toBe(flatSubmission.baz.toArray()[2]);
    });

    it('handles when submission has no expandable cells', () => {
      const flatSubmission = {
        foo: 'bar',
        fuz: 'baz',
      };
      const transformed = expandCells([flatSubmission]);
      expect(transformed).toHaveLength(1);
      expect(transformed[0]).toEqual(flatSubmission);
    });

    it('adds as many rows as the longes column requires', () => {
      const flatSubmission = {
        foo: 'bar',
        baz1: ExpandableCell.fromArray(['a', 'b', 'c']),
        baz2: ExpandableCell.fromArray(['d', 'e', 'f', 'g', 'h', 'i']),
      };
      const transformed = expandCells([flatSubmission]);
      expect(transformed).toHaveLength(flatSubmission.baz2.toArray().length + 1);
      expect(transformed[3]).toEqual({ baz1: 'c', baz2: 'f' });
      expect(transformed[4]).toEqual({ baz2: 'g' });
      expect(transformed[6]).toEqual({ baz2: 'i' });
    });

    it('handles empty ExpandableCell', () => {
      const flatSubmission = {
        foo: 'bar',
        baz: ExpandableCell.fromArray([]),
      };
      const transformed = expandCells([flatSubmission]);
      expect(transformed).toHaveLength(1);
      expect(transformed[0]).toEqual({ foo: 'bar' });
    });

    it('transforms all submissions', () => {
      const flatSubmissions = [
        {
          foo: 'bar1',
          baz: ExpandableCell.fromArray([1, 2]),
        },
        {
          foo: 'bar2',
          baz: ExpandableCell.fromArray([3, 4, 5]),
        },
        {
          foo: 'bar3',
          baz: ExpandableCell.fromArray([6]),
        },
      ];
      const transformed = expandCells(flatSubmissions);
      expect(transformed).toHaveLength(9);
      expect(transformed[7]).toEqual({ foo: 'bar3' });
      expect(transformed[8]).toEqual({ baz: 6 });
    });
  });

  describe('removeMetaFromQuestions(data)', () => {
    const getData = () => ({
      group_1: {
        meta: {
          type: 'group',
        },
        map_2: {
          value: { foo: 'bar' },
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
    });
    it('removes unnecessary fields from question data', () => {
      const data = getData();
      const transformed = removeMetaFromQuestions(data);
      expect(transformed.group_1.meta).toBeUndefined();
      expect(transformed.group_1.map_2).toEqual(data.group_1.map_2.value);
      expect(transformed.group_1.text_1).toEqual(data.group_1.text_1.value);
      expect(transformed.text_3).toEqual(data.text_3.value);
    });
    it("doesn't modify questions with unknown types", () => {
      const data = getData();
      data.text_3.meta.type = 'unknown type';
      const transformed = removeMetaFromQuestions(data);
      expect(transformed.text_3.meta).toEqual(data.text_3.meta);
      expect(transformed.text_3.value).toEqual(data.text_3.value);
    });
  });

  describe('ExpandableCell', () => {
    it('returns an equal array', () => {
      const data = [1, 'foo', { aa: { bb: true } }];
      const cell = ExpandableCell.fromArray(data);
      expect(cell.toArray()).toEqual(data);
    });

    it('is also a String type', () => {
      const cell = ExpandableCell.fromArray([]);
      expect(cell).toBeInstanceOf(String);
      expect(cell).toBeInstanceOf(ExpandableCell);
    });

    it('throws if data is not array', () => {
      const error = 'Cell data has to be an array';
      expect(() => ExpandableCell.fromArray('string')).toThrow(error);
      expect(() => ExpandableCell.fromArray({})).toThrow(error);
    });

    it('can be cloned with lodash', () => {
      const cell = ExpandableCell.fromArray([1, 2, 3]);
      const cloned = _.clone(cell);
      expect(cloned.toArray()).toEqual(cell.toArray());
    });
  });
});
