import SubmissionTableClientCsv, {
  getPropertiesFromMatrix,
  transformGeoJsonHeaders,
  transformMatrixHeaders,
} from './SubmissionTableClientCsv.vue';
import { fireEvent } from '@testing-library/vue';
import { within } from '@testing-library/dom';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import router from '@/router';
import { createStoreObject } from '@/store';

const mockSubmissions = () => {
  return {
    content: [
      {
        _id: '61bd8891ff21c10001c986aa',
        meta: {
          dateCreated: '2021-12-18T07:06:57.796Z',
          dateModified: '2021-12-18T07:08:27.341Z',
          dateSubmitted: '2021-12-18T07:08:31.938Z',
          survey: {
            id: '61bb38d155512900019e1619',
            name: 'Test Survey',
            version: 2,
          },
          revision: 1,
          permissions: [],
          status: [
            {
              type: 'READY_TO_SUBMIT',
              value: {
                at: '2021-12-18T07:08:31.875Z',
              },
            },
          ],
          group: {
            id: '6184f9b7fd7bde0001ece881',
            path: '/bionutrient/',
          },
          specVersion: 3,
          creator: '615e9accafc2378922091c2c',
          creatorDetail: {
            email: 'super@our-sci.net',
            name: 'Default Super Admin',
          },
        },
        data: {
          text_1: {
            value:
              'That is because you have positioned your pseudo-element absolutely in the <a> element, and this causes it to be stacked on top of the text node, which has static positioning.',
            meta: {
              type: 'string',
              dateModified: '2021-12-18T08:07:11.058+01:00',
            },
          },
          text_2: {
            value: 'You can use the overflow property when you want to have better control of the layout. The overflow',
            meta: {
              type: 'string',
              dateModified: '2021-12-18T08:07:32.385+01:00',
            },
          },
          text_3: {
            value:
              'Ahead of the 2021 Afcon, not many Nigerian players are currently grabbing headlines as much as the Rangers star  Joe Aribo has been instrumental to the Scottish Premier League champions’ title defence and is indeed arguably the best player in the Scottish top-flight at the moment',
            meta: {
              type: 'string',
              dateModified: '2021-12-18T08:08:27.341+01:00',
            },
          },
          matrix_1: {
            value: [
              {
                sample: { value: 'sample 1' },
                number: { value: 23 },
                choose: { value: 'a' },
              },
              {
                sample: { value: 'sample 2' },
                number: { value: 2348 },
                choose: { value: 'b' },
              },
            ],
            meta: {
              type: 'matrix',
              dateModified: '2022-10-18T11:45:47.715-04:00',
            },
          },
        },
      },
      {
        _id: '61c1ccab39ce6f00017d1abc',
        meta: {
          dateCreated: '2021-12-21T12:46:35.520Z',
          dateModified: '2021-12-21T12:47:33.610Z',
          dateSubmitted: '2021-12-21T12:47:40.395Z',
          survey: {
            id: '61bb38d155512900019e1619',
            name: 'Test Survey',
            version: 2,
          },
          revision: 1,
          permissions: [],
          status: [
            {
              type: 'READY_TO_SUBMIT',
              value: {
                at: '2021-12-21T12:47:40.251Z',
              },
            },
          ],
          group: {
            id: '6184f9b7fd7bde0001ece881',
            path: '/bionutrient/',
          },
          specVersion: 3,
          creator: '615e9accafc2378922091c2c',
          creatorDetail: {
            email: 'super@our-sci.net',
            name: 'Default Super Admin',
          },
        },
        data: {
          text_1: {
            value:
              'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout',
            meta: {
              type: 'string',
              dateModified: '2021-12-21T13:47:10.336+01:00',
            },
          },
          text_2: {
            value:
              'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000',
            meta: {
              type: 'string',
              dateModified: '2021-12-21T13:47:21.061+01:00',
            },
          },
          text_3: {
            value:
              'The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from by Cicero are also reproduced in their exact',
            meta: {
              type: 'string',
              dateModified: '2021-12-21T13:47:33.610+01:00',
            },
          },
          matrix_1: {
            value: [
              {
                sample: { value: 'sample 1' },
                number: { value: 23 },
                choose: { value: 'a' },
              },
              {
                sample: { value: 'sample 2' },
                number: { value: 2348 },
                choose: { value: 'b' },
              },
            ],
            meta: {
              type: 'matrix',
              dateModified: '2022-10-18T11:45:47.715-04:00',
            },
          },
        },
      },
    ],
    pagination: {
      total: 1,
      skip: 0,
      limit: 10,
    },
    headers: [
      '_id',
      'meta.dateCreated',
      'meta.dateModified',
      'meta.dateSubmitted',
      'meta.survey.id',
      'meta.survey.name',
      'meta.survey.version',
      'meta.revision',
      'meta.permissions',
      'meta.status.0.type',
      'meta.status.0.value.at',
      'meta.group.id',
      'meta.group.path',
      'meta.specVersion',
      'meta.creator',
      'meta.creatorDetail.email',
      'meta.creatorDetail.name',
      'data.text_1.value',
      'data.text_2.value',
      'data.text_3.value',
      'data.matrix_1.value.0.sample.value',
      'data.matrix_1.value.0.number.value',
      'data.matrix_1.value.0.choose.value',
      'data.matrix_1.value.1.sample.value',
      'data.matrix_1.value.1.number.value',
      'data.matrix_1.value.1.choose.value',
    ],
  };
};

function mockHeaders(type = 'all') {
  return [
    '_id',
    'meta.dateCreated',
    'meta.dateModified',
    'meta.dateSubmitted',
    'meta.survey.id',
    'meta.survey.name',
    'meta.survey.version',
    'meta.revision',
    'meta.permissions',
    'meta.status.0.type',
    'meta.status.0.value.at',
    'meta.group.id',
    'meta.group.path',
    'meta.specVersion',
    'meta.creator',
    'meta.creatorDetail.email',
    'meta.creatorDetail.name',
    ...(type !== 'geojson'
      ? [
          'data.group_1.map_2.value.features.0.geometry.coordinates.0.0.0',
          'data.group_1.map_2.value.features.0.geometry.coordinates.0.0.1',
          'data.group_1.map_2.value.features.0.geometry.coordinates.0.1.0',
          'data.group_1.map_2.value.features.0.geometry.coordinates.0.1.1',
          'data.group_1.map_2.value.features.0.geometry.coordinates.0.2.0',
          'data.group_1.map_2.value.features.0.geometry.coordinates.0.2.1',
          'data.group_1.map_2.value.features.0.geometry.coordinates.0.3.0',
          'data.group_1.map_2.value.features.0.geometry.coordinates.0.3.1',
          'data.group_1.map_2.value.features.0.geometry.type',
          'data.group_1.map_2.value.features.0.id',
          'data.group_1.map_2.value.features.0.properties',
          'data.group_1.map_2.value.features.0.type',
          'data.group_1.map_2.value.features.1.geometry.coordinates.0.0.0',
          'data.group_1.map_2.value.features.1.geometry.coordinates.0.0.1',
          'data.group_1.map_2.value.features.1.geometry.coordinates.0.1.0',
          'data.group_1.map_2.value.features.1.geometry.coordinates.0.1.1',
          'data.group_1.map_2.value.features.1.geometry.coordinates.0.2.0',
          'data.group_1.map_2.value.features.1.geometry.coordinates.0.2.1',
          'data.group_1.map_2.value.features.1.geometry.coordinates.0.3.0',
          'data.group_1.map_2.value.features.1.geometry.coordinates.0.3.1',
          'data.group_1.map_2.value.features.1.geometry.type',
          'data.group_1.map_2.value.features.1.id',
          'data.group_1.map_2.value.features.1.properties',
          'data.group_1.map_2.value.features.1.type',
        ]
      : ['data.group_1.map_2.value.features.0', 'data.group_1.map_2.value.features.1']),
    'data.group_1.map_2.value.type',
    'data.group_1.text_1.value',
    'data.group_1.input_1.0.name.value',
    'data.group_1.input_1.0.description.value',
    'data.group_1.input_1.1.name.value',
    'data.group_1.input_1.1.description.value',
    'data.text_3.value',
    ...(type !== 'matrix'
      ? [
          'data.matrix_1.value.0.sample.value',
          'data.matrix_1.value.0.number.value',
          'data.matrix_1.value.0.choose.value',
          'data.matrix_1.value.1.sample.value',
          'data.matrix_1.value.1.number.value',
          'data.matrix_1.value.1.choose.value',
        ]
      : ['data.matrix_1.value']),
  ];
}

describe('SubmissionTableClientCsv', () => {
  describe('transformGeoJsonHeaders', () => {
    it('collapses geojson features', () => {
      const expected = mockHeaders('geojson');
      expect(transformGeoJsonHeaders(mockHeaders())).toEqual(expected);
    });
  });

  describe('transformMatrixHeaders', () => {
    it('collapses matrix question type', () => {
      const expected = mockHeaders('matrix');
      expect(transformMatrixHeaders(mockHeaders(), mockSubmissions().content)).toEqual(expected);
    });

    it('collapses nested matrix question type under `Page` or `Group` type', () => {
      const headers = [
        '_id',
        'meta.dateCreated',
        'meta.dateModified',
        'meta.dateSubmitted',
        'meta.survey.id',
        'meta.survey.name',
        'meta.survey.version',
        'meta.revision',
        'meta.permissions',
        'meta.status.0.type',
        'meta.status.0.value.at',
        'meta.group.id',
        'meta.group.path',
        'meta.specVersion',
        'meta.creator',
        'meta.permanentResults',
        'data.page_1.text_2.value',
        'data.page_1.matrix_3.value.0.description.value',
        'data.page_1.matrix_3.value.0.sample.value',
        'data.page_1.matrix_3.value.1.description.value',
        'data.page_1.matrix_3.value.1.sample.value',
        'data.page_1.matrix_3.value.2.description.value',
        'data.page_1.matrix_3.value.2.sample.value',
        'data.page_1.matrix_4.value.0.description.value',
        'data.page_1.matrix_4.value.0.sample.value',
        'data.page_1.matrix_4.value.1.description.value',
        'data.page_1.matrix_4.value.1.sample.value',
      ];
      const data = [
        {
          _id: '6353113c1c423f00016d4e68',
          meta: {
            dateCreated: '2022-10-21T21:38:04.979Z',
            dateModified: '2022-10-21T21:38:24.108Z',
            dateSubmitted: '2022-10-21T21:38:31.806Z',
            survey: { id: '635311081c423f00016d4e4c', version: 2 },
            revision: 1,
            permissions: [],
            status: [
              {
                type: 'READY_TO_SUBMIT',
                value: { at: '2022-10-21T21:38:31.763Z' },
              },
            ],
            group: { id: '62f697a8cb00931dd4a31d7b', path: '/soilstack/' },
            specVersion: 3,
            creator: '630581e20c26b03c040b9655',
            permanentResults: [],
          },
          data: {
            page_1: {
              meta: { type: 'page' },
              text_2: {
                value: 'Test',
                meta: {
                  type: 'string',
                  dateModified: '2022-10-21T15:38:24.108-06:00',
                },
              },
              matrix_3: {
                value: [
                  { sample: { value: 1 }, description: { value: 'a' } },
                  { sample: { value: 2 }, description: { value: 'b' } },
                  { sample: { value: 3 }, description: { value: 'c' } },
                ],
                meta: {
                  type: 'matrix',
                  dateModified: '2022-10-21T15:38:13.107-06:00',
                },
              },
              matrix_4: {
                value: [
                  { sample: { value: 'A' }, description: { value: 'a' } },
                  { sample: { value: 'B' }, description: { value: 'b' } },
                ],
                meta: {
                  type: 'matrix',
                  dateModified: '2022-10-21T15:38:18.666-06:00',
                },
              },
            },
          },
        },
      ];
      const expected = [
        '_id',
        'meta.dateCreated',
        'meta.dateModified',
        'meta.dateSubmitted',
        'meta.survey.id',
        'meta.survey.name',
        'meta.survey.version',
        'meta.revision',
        'meta.permissions',
        'meta.status.0.type',
        'meta.status.0.value.at',
        'meta.group.id',
        'meta.group.path',
        'meta.specVersion',
        'meta.creator',
        'meta.permanentResults',
        'data.page_1.text_2.value',
        'data.page_1.matrix_3.value',
        'data.page_1.matrix_4.value',
      ];
      expect(transformMatrixHeaders(headers, data)).toEqual(expected);
    });
  });

  describe('getPropertiesFromMatrix', () => {
    it('generate properties from the headers for the given matrix header', () => {
      const expected = ['sample.value', 'number.value', 'choose.value'];
      expect(getPropertiesFromMatrix(mockHeaders(), 'data.matrix_1.value')).toEqual(expected);
    });
  });

  describe('SubmissionTableClientCsv UI Tests', () => {
    it('should check that the modal text content is the same with the clicked table cell', async () => {
      const { getByText, getByRole } = renderWithVuetify(SubmissionTableClientCsv, {
        propsData: { submissions: mockSubmissions(), selected: [] },
        router: router,
        store: createStoreObject(),
      });
      const td = getByText(
        'You can use the overflow property when you want to have better control of the layout. The overflow'
      );
      await fireEvent.click(td);
      const modal = getByRole('dialog');
      within(modal).getByText(
        'You can use the overflow property when you want to have better control of the layout. The overflow'
      );
    });

    it('set modal to hidden when overlay is clicked', async () => {
      const { getByTestId, getByText, queryByRole } = renderWithVuetify(SubmissionTableClientCsv, {
        propsData: { submissions: mockSubmissions(), selected: [] },
        router: router,
        store: createStoreObject(),
      });
      const td = getByText(
        'You can use the overflow property when you want to have better control of the layout. The overflow'
      );
      await fireEvent.click(td);
      const overlay = getByTestId('overlay');
      await fireEvent.click(overlay);
      const modal = queryByRole('dialog');
      expect(modal).toBeNull();
    });
  });

  it('should check that the modal text content is the same with the clicked table cell', async () => {
    const { getByText, getByRole } = renderWithVuetify(SubmissionTableClientCsv, {
      propsData: { submissions: mockSubmissions(), selected: [] },
      router: router,
      store: createStoreObject(),
    });
    const td = getByText(
      'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout'
    );
    await fireEvent.click(td);
    const modal = getByRole('dialog');
    within(modal).getByText(
      'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout'
    );
  });

  it('emits update:selected event when submission checkbox is clicked', async () => {
    const { getAllByRole, emitted } = renderWithVuetify(SubmissionTableClientCsv, {
      propsData: { submissions: mockSubmissions(), selected: [] },
      router: router,
      store: createStoreObject(),
    });

    const checkbox = getAllByRole('checkbox');
    await fireEvent.click(checkbox[1]); //checkbox[0] is the toggleSelectAllItems checkbox, so take the second one (index 1)
    expect(emitted()['update:selected']).toBeTruthy();
  });

  it('displays selected text and submission action buttons when the selected prop contains a submission from the submissions prop', async () => {
    const { getByRole, getByText } = renderWithVuetify(SubmissionTableClientCsv, {
      propsData: {
        submissions: mockSubmissions(),
        selected: [
          {
            _id: '61bd8891ff21c10001c986aa',
            'data.text_1.value': 'Test',
          },
        ],
      },
      router: router,
      store: createStoreObject(),
    });
    getByText(/1 submission selected/i);
    getByRole('button', { name: /archive/i });
    getByRole('button', { name: /reassign/i });
    getByRole('button', { name: /resubmit/i });
  });

  it('emits showArchiveModal event when archive button is clicked', async () => {
    const { getByRole, emitted } = renderWithVuetify(SubmissionTableClientCsv, {
      propsData: {
        submissions: mockSubmissions(),
        selected: [
          {
            _id: '61bd8891ff21c10001c986aa',
            'data.text_1.value': 'Test',
          },
        ],
      },
      router: router,
      store: createStoreObject(),
    });

    const archiveButton = getByRole('button', { name: /archive/i });
    await fireEvent.click(archiveButton);
    expect(emitted().showArchiveModal).toBeTruthy();
  });

  it('should emit resubmit event when resubmit button is clicked', async () => {
    const { getByRole, emitted } = renderWithVuetify(SubmissionTableClientCsv, {
      propsData: {
        submissions: mockSubmissions(),
        selected: [
          {
            _id: '61bd8891ff21c10001c986aa',
            'data.text_1.value': 'Test',
          },
        ],
      },
      router: router,
      store: createStoreObject(),
    });

    const resubmitButton = getByRole('button', { name: /resubmit/i });
    await fireEvent.click(resubmitButton);
    expect(emitted().resubmit).toBeTruthy();
  });

  it('should emit reassignment event when reassign button is clicked', async () => {
    const { getByRole, emitted } = renderWithVuetify(SubmissionTableClientCsv, {
      propsData: {
        submissions: mockSubmissions(),
        selected: [
          {
            _id: '61bd8891ff21c10001c986aa',
            'data.text_1.value': 'Test',
          },
        ],
      },
      router: router,
      store: createStoreObject(),
    });

    const reassignButton = getByRole('button', { name: /reassign/i });
    await fireEvent.click(reassignButton);
    expect(emitted().reassignment).toBeTruthy();
  });

  it('should disable reassign Button if actionsAreDisabled prop is set to true', async () => {
    const { getByRole } = renderWithVuetify(SubmissionTableClientCsv, {
      propsData: {
        submissions: mockSubmissions(),
        actionsAreDisabled: true,
        selected: [
          {
            _id: '61bd8891ff21c10001c986aa',
            'data.text_1.value': 'Test',
          },
        ],
      },
      router: router,
      store: createStoreObject(),
    });

    const reassignButton = getByRole('button', { name: /reassign/i });
    expect(reassignButton).toBeDisabled();
  });

  it('should disable resubmit Button if actionsAreDisabled prop is set to true', async () => {
    const { getByRole } = renderWithVuetify(SubmissionTableClientCsv, {
      propsData: {
        submissions: mockSubmissions(),
        actionsAreDisabled: true,
        selected: [
          {
            _id: '61bd8891ff21c10001c986aa',
            'data.text_1.value': 'Test',
          },
        ],
      },
      router: router,
      store: createStoreObject(),
    });

    const resubmitButton = getByRole('button', { name: /resubmit/i });
    expect(resubmitButton).toBeDisabled();
  });

  it('should disable archive Button if actionsAreDisabled prop is set to true', async () => {
    const { getByRole } = renderWithVuetify(SubmissionTableClientCsv, {
      propsData: {
        submissions: mockSubmissions(),
        actionsAreDisabled: true,
        selected: [
          {
            _id: '61bd8891ff21c10001c986aa',
            'data.text_1.value': 'Test',
          },
        ],
      },
      router: router,
      store: createStoreObject(),
    });

    const archiveButton = getByRole('button', { name: /archive/i });
    expect(archiveButton).toBeDisabled();
  });
});
