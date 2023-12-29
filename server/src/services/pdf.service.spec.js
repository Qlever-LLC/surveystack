import { cloneDeep } from 'lodash';
import { createSurvey, getControlGenerator } from '../testUtils';
import pdfService from './pdf.service';
import mockAxios from 'axios';
const { ObjectId } = jest.requireActual('mongodb');

describe('pdf.service', () => {
  let surveyGenerator, submissionGenerator;
  let survey, submission;

  beforeAll(async () => {
    const { survey: mockSurvey, createSubmission } = await createSurvey([
      'page',
      'group',
      'instructions',
      'instructionsImageSplit',
      'text',
      'number',
      'date',
      'location',
      'selectSingle',
      'selectMultiple',
      'ontology',
      'matrix',
      'image',
      'file',
      'script',
      'farmOsField',
      'farmOsPlanting',
      'farmOsFarm',
      'geoJSON',
    ]);
    const { submission: mockSubmission } = await createSubmission();

    survey = mockSurvey;
    submission = mockSubmission;
    submission.meta.group.name = 'Mock Group Name';
    submission.meta.creator = {
      name: 'Mock Creator',
      email: 'mockcreator@email.com',
    };
    surveyGenerator = new pdfService.PdfGenerator(survey);
    submissionGenerator = new pdfService.PdfGenerator(survey, submission);
  });

  describe('formatDate', () => {
    it('should parse and format ISO date to custom format', () => {
      const date = pdfService.formatDate('2023-05-29T18:01:25.907Z', 'MMM D, YYYY');
      expect(date).toBe('May 29, 2023');
    });

    it('should return the date if parse failed', () => {
      const date = pdfService.formatDate('wrong date');
      expect(date).toBe('wrong date');
    });
  });

  describe('transformValueToLabel', () => {
    const source = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
      { value: 3, label: 'Three' },
    ];

    it('should transform a value to label from the given source', () => {
      expect(pdfService.transformValueToLabel(1, source)).toBe('One');
    });

    it('should transform values to labels from the given source', () => {
      expect(pdfService.transformValueToLabel([2, 3], source)).toEqual(['Two', 'Three']);
    });

    it('should return the value if not found the corresponding label', () => {
      expect(pdfService.transformValueToLabel([1, 5], source)).toEqual(['One', 5]);
    });
  });

  describe('PdfGenerator', () => {
    it('should throws error if the survey is not set', () => {
      expect(() => new pdfService.PdfGenerator(null, {})).toThrow();
    });

    describe('filename', () => {
      it('should contains the survey name when printable pdf', () => {
        const filename = surveyGenerator.filename();
        expect(filename).toContain('Mock Survey Name');
      });

      it('should contains the survey name when submitted pdf', () => {
        const filename = submissionGenerator.filename();
        expect(filename).toContain('Mock Survey Name');
      });

      it('should contains the last 6 characters of the submission ID when submitted pdf', () => {
        const filename = submissionGenerator.filename();
        expect(filename).toContain(String(submission._id).slice(-6));
      });

      it('should contains the date of the submission in the existence order of submitted, modified and created', () => {
        const filename = submissionGenerator.filename();
        expect(filename).toContain(
          pdfService.formatDate(submission.meta.dateSubmitted, 'YYYY-MM-DD-HH-mm-ss')
        );
      });
    });

    describe('generateInfo', () => {
      it('should generate info definition', () => {
        surveyGenerator.generateInfo();

        expect(surveyGenerator.docDefinition.info).toEqual({
          title: 'Mock Survey Name - SurveyStack',
          author: 'Our-Sci SurveyStack Team',
          subject: `Report of the SurveyStack survey`,
          keywords: 'SurveyStack, Survey, FarmOS, OurSci, what else?',
        });
      });
    });

    describe('generateMeta', () => {
      it('should generate meta definition', () => {
        surveyGenerator.generateMeta();
        expect(surveyGenerator.docDefinition.content).toEqual([
          {
            text: 'Mock Survey Name',
            style: 'header',
          },
          {
            columns: [
              { width: '*', text: '' },
              {
                width: 'auto',
                table: {
                  body: [
                    expect.arrayContaining(['Generated on']),
                    [
                      'Generated by',
                      {
                        text: [
                          'SurveyStack',
                          expect.objectContaining({ text: ' (www.surveystack.io)' }),
                        ],
                      },
                    ],
                  ],
                },
                layout: 'noBorders',
                style: 'meta',
              },
            ],
          },
        ]);

        submissionGenerator.generateMeta();
        expect(submissionGenerator.docDefinition.content).toEqual([
          {
            text: 'Mock Survey Name',
            style: 'header',
          },
          {
            columns: [
              { width: '*', text: '' },
              {
                width: 'auto',
                table: {
                  body: [
                    ['Submitted to', 'Mock Group Name (/group-1/)'],
                    ['Submitted on', pdfService.formatDate(submission.meta.dateSubmitted)],
                    [
                      'Submitted by',
                      {
                        text: [
                          'Mock Creator',
                          expect.objectContaining({ text: ' (mockcreator@email.com)' }),
                        ],
                      },
                    ],
                    [
                      'Generated by',
                      {
                        text: [
                          'SurveyStack',
                          expect.objectContaining({ text: ' (www.surveystack.io)' }),
                        ],
                      },
                    ],
                  ],
                },
                layout: 'noBorders',
                style: 'meta',
              },
            ],
          },
        ]);
      });
    });

    // Test survey level options
    describe('getValidControls', () => {
      it('should always exclude hidden controls', () => {
        const controls = [
          getControlGenerator('text')(),
          getControlGenerator('number')(),
          {
            ...getControlGenerator('group')(),
            options: { ...getControlGenerator('group')().options, hidden: true },
          },
        ];

        expect(surveyGenerator.getValidControls(controls).length).toBe(2);
      });

      it('should exclude instructions/instructionsImageSplit questions when `survey.meta.printOptions.showInstruction=false` if submitted PDF', () => {
        const controls = [
          getControlGenerator('text')(),
          getControlGenerator('instructions')(),
          getControlGenerator('instructionsImageSplit')(),
        ];
        const surveyEntity = cloneDeep(survey);
        surveyEntity.meta.printOptions.showInstruction = false;
        surveyEntity.meta.printOptions.showUnanswered = true;
        const generator = new pdfService.PdfGenerator(surveyEntity, submission);

        expect(generator.getValidControls(controls).length).toBe(1);
      });

      it('should always exclude the questions of `meta.relevant=false` if submitted PDF', () => {
        const controls = [
          getControlGenerator('text')({ name: 'text_5' }),
          getControlGenerator('number')({ name: 'number_6' }),
          getControlGenerator('date')({ name: 'date_7' }),
        ];
        const surveyEntity = cloneDeep(survey);
        surveyEntity.meta.printOptions.showInstruction = true;
        surveyEntity.meta.printOptions.showUnanswered = true;

        const submissionEntity = cloneDeep(submission);
        submissionEntity.data.text_5.meta.relevant = false;

        const generator = new pdfService.PdfGenerator(surveyEntity, submissionEntity);

        expect(generator.getValidControls(controls).length).toBe(2);
      });

      it("should exclude the questions that doesn't have a value when `meta.printOptions.showUnanswered=false` if submitted PDF", () => {
        const controls = [
          getControlGenerator('instructions')({ name: 'instructions_3' }),
          getControlGenerator('instructionsImageSplit')({ name: 'instructions_split_4' }),
          getControlGenerator('text')({ name: 'text_5' }),
          getControlGenerator('number')({ name: 'number_6' }),
        ];
        const surveyEntity = cloneDeep(survey);
        surveyEntity.meta.printOptions.showInstruction = true;
        surveyEntity.meta.printOptions.showUnanswered = false;

        const submissionEntity = cloneDeep(submission);
        submissionEntity.data.instructions_split_4.value = null;
        submissionEntity.data.text_5.value = null;

        const generator = new pdfService.PdfGenerator(surveyEntity, submissionEntity);

        expect(generator.getValidControls(controls).length).toBe(3);
      });
    });

    // Test control level options
    describe('control.options.printLayout', () => {
      describe('showAllOptions', () => {
        it('should render all options for selectSingle/selectMultiple/ontology questions when `showAllOptions=true`', async () => {
          const { survey, createSubmission } = await createSurvey(['selectSingle']);
          const { submission } = await createSubmission();
          const control = survey.revisions[1].controls[0];
          control.options.printLayout.showAllOptions = true;
          control.options.printLayout.columns = 1;
          control.index = [1];

          const generator = new pdfService.PdfGenerator(survey, submission);

          await generator.generateControl(control);

          expect(generator.docDefinition.content).toContainEqual(
            expect.objectContaining({
              columns: [
                [
                  {
                    table: {
                      widths: [12, 'auto'],
                      body: [expect.arrayContaining([expect.objectContaining({ text: 'Item 1' })])],
                    },
                    layout: 'noBorders',
                  },
                  {
                    table: {
                      widths: [12, 'auto'],
                      body: [expect.arrayContaining([expect.objectContaining({ text: 'Item 2' })])],
                    },
                    layout: 'noBorders',
                  },
                ],
              ],
            })
          );
        });

        it('should render value(s) only for selectSingle/selectMultiple/ontology questions when `showAllOptions=false`', async () => {
          const { survey, createSubmission } = await createSurvey(['selectMultiple']);
          const { submission } = await createSubmission();
          const control = survey.revisions[1].controls[0];
          control.options.printLayout.showAllOptions = false;
          control.index = [1];

          const generator = new pdfService.PdfGenerator(survey, submission);

          await generator.generateControl(control);

          expect(generator.docDefinition.content).toContainEqual({
            text: 'Item 1, Item 2',
            style: 'answer',
          });
        });
      });

      describe('columns', () => {
        it('should render column layout with given columns for selectSingle/selectMultiple/ontology questions', async () => {
          const { survey, createSubmission } = await createSurvey(['ontology']);
          const { submission } = await createSubmission();
          const control = survey.revisions[1].controls[0];
          control.options.printLayout.showAllOptions = true;
          control.options.printLayout.columns = 2;
          control.options.source =
            control.options.source instanceof ObjectId
              ? String(control.options.source)
              : control.options.source;
          control.index = [1];

          const generator = new pdfService.PdfGenerator(survey, submission);

          await generator.generateControl(control);

          expect(generator.docDefinition.content).toContainEqual(
            expect.objectContaining({
              columns: [
                [
                  {
                    table: {
                      widths: [12, 'auto'],
                      body: [expect.arrayContaining([expect.objectContaining({ text: 'Item 1' })])],
                    },
                    layout: 'noBorders',
                  },
                ],
                [
                  {
                    table: {
                      widths: [12, 'auto'],
                      body: [expect.arrayContaining([expect.objectContaining({ text: 'Item 2' })])],
                    },
                    layout: 'noBorders',
                  },
                ],
              ],
            })
          );
        });
      });

      describe('showAllOptionsPrintable', () => {
        it('should render all options for selectSingle/selectMultiple/ontology questions when `showAllOptionsPrintable=true` if paper PDF', async () => {
          const { survey } = await createSurvey(['selectMultiple']);
          const control = survey.revisions[1].controls[0];
          control.options.printLayout.showAllOptionsPrintable = true;
          control.options.printLayout.columns = 2;
          control.index = [1];

          const generator = new pdfService.PdfGenerator(survey);

          await generator.generateControl(control);

          expect(generator.docDefinition.content).toContainEqual(
            expect.objectContaining({
              columns: [
                [
                  {
                    table: {
                      widths: [12, 'auto'],
                      body: [expect.arrayContaining([expect.objectContaining({ text: 'Item 1' })])],
                    },
                    layout: 'noBorders',
                  },
                ],
                [
                  {
                    table: {
                      widths: [12, 'auto'],
                      body: [expect.arrayContaining([expect.objectContaining({ text: 'Item 2' })])],
                    },
                    layout: 'noBorders',
                  },
                ],
              ],
            })
          );
        });

        it('should render empty space for selectSingle/selectMultiple/ontology questions when `showAllOptionsPrintable=false` if paper PDF', async () => {
          const { survey } = await createSurvey(['selectSingle']);
          const control = survey.revisions[1].controls[0];
          control.options.printLayout.showAllOptionsPrintable = false;
          control.index = [1];

          const generator = new pdfService.PdfGenerator(survey);

          await generator.generateControl(control);

          expect(generator.docDefinition.content).toContainEqual({
            layout: {
              hLineWidth: expect.anything(),
              hLineColor: expect.anything(),
              hLineStyle: expect.anything(),
            },
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    border: [false, false, false, true],
                    text: ' ',
                    fontSize: 20,
                  },
                ],
                [
                  {
                    border: [false, false, false, true],
                    text: ' ',
                    fontSize: 20,
                  },
                ],
              ],
            },
            margin: [12, 0, 0, 0],
          });
        });
      });

      describe('preview', () => {
        it('should render preview of image for image/file questions when `preview=true` if submitted PDF', async () => {
          const { survey, createSubmission } = await createSurvey(['file']);
          const { submission } = await createSubmission();
          const control = survey.revisions[1].controls[0];
          control.options.printLayout.preview = true;
          control.index = [1];

          const generator = new pdfService.PdfGenerator(survey, submission);

          mockAxios.get.mockImplementation(() =>
            Promise.resolve({ data: 'some byte array of file' })
          );
          await generator.generateControl(control);

          expect(generator.docDefinition.content).toContainEqual(
            expect.objectContaining({
              stack: [
                {
                  text: 'resources/mock-resource-id/file1.jpg',
                  link: 'https://surveystack-test.s3.amazonaws.com/resources/mock-resource-id/file1.jpg',
                  style: 'link',
                },
                {
                  image: expect.stringContaining('data:image/jpg;base64,'),
                  fit: [300, 300],
                  margin: [0, 8, 0, 8],
                },
              ],
            })
          );
        });

        it('should not render preview of image for image/file questions when `preview=false` if submitted PDF', async () => {
          const { survey, createSubmission } = await createSurvey(['image']);
          const { submission } = await createSubmission();
          const control = survey.revisions[1].controls[0];
          control.options.printLayout.preview = false;
          control.options.source.allowMultiple = true;
          control.index = [1];

          const generator = new pdfService.PdfGenerator(survey, submission);

          await generator.generateControl(control);

          expect(generator.docDefinition.content).toContainEqual({
            ul: [
              expect.objectContaining({
                stack: [
                  {
                    text: 'resources/mock-resource-id/file1.jpg',
                    link: 'https://surveystack-test.s3.amazonaws.com/resources/mock-resource-id/file1.jpg',
                    style: 'link',
                  },
                ],
              }),
            ],
          });
        });
      });

      describe('table', () => {
        it('should render table view of matrix questions when `table=true` if submitted PDF', async () => {
          const { survey, createSubmission } = await createSurvey(['matrix']);
          const { submission } = await createSubmission();
          const control = survey.revisions[1].controls[0];
          control.options.printLayout.table = true;
          control.index = [1];

          const generator = new pdfService.PdfGenerator(survey, submission);

          await generator.generateControl(control);

          expect(generator.docDefinition.content).toContainEqual(
            expect.objectContaining({
              table: {
                widths: ['50%', '50%'],
                headerRows: 1,
                body: [
                  ['Sample', 'Description'],
                  [1, 'ABC'],
                  [2, 'def'],
                ],
              },
            })
          );
        });

        it('should render list view of matrix question when `table=false` if submitted PDF', async () => {
          const { survey, createSubmission } = await createSurvey(['matrix']);
          const { submission } = await createSubmission();
          const control = survey.revisions[1].controls[0];
          control.options.printLayout.table = false;
          control.index = [1];

          const generator = new pdfService.PdfGenerator(survey, submission);

          await generator.generateControl(control);

          expect(generator.docDefinition.content).toContainEqual({
            style: 'answer',
            ul: [
              'Row 1',
              {
                type: 'circle',
                ul: [{ text: ['Sample: ', 1] }, { text: ['Description: ', 'ABC'] }],
                margin: [0, 0, 0, 4],
              },
              'Row 2',
              {
                type: 'circle',
                ul: [{ text: ['Sample: ', 2] }, { text: ['Description: ', 'def'] }],
                margin: [0, 0, 0, 4],
              },
            ],
          });
        });
      });
    });
  });
});
