import { transformHeaders, getCellKey } from './SubmissionTableClientCsv.vue';
import { fireEvent } from '@testing-library/vue';
import { within } from '@testing-library/dom';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import SubmissionTableClientCsv from './SubmissionTableClientCsv.vue';

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
    ],
  };
};

function mockHeaders() {
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
    'meta.creatorDetail.email',
    'meta.creatorDetail.name',
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
    'data.group_1.map_2.value.type',
    'data.group_1.text_1.value',
    'data.text_3.value',
  ];
}

describe('SubmissionTableClientCsv', () => {
  describe('transformHeaders', () => {
    it('collapses geojson features', () => {
      const expected = [
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
        'meta.creatorDetail.email',
        'meta.creatorDetail.name',
        'data.group_1.map_2.value.features.0',
        'data.group_1.map_2.value.features.1',
        'data.group_1.map_2.value.type',
        'data.group_1.text_1.value',
        'data.text_3.value',
      ];
      expect(transformHeaders(mockHeaders())).toEqual(expected);
    });
  });

  describe('getCellKey', () => {
    it('should return the correct header value and item Id that was clicked', () => {
      const expected = getCellKey('header value', 'item id');
      expect(expected).toEqual('header value_item id');
    });
  });

  describe('SubmissionTableClientCsv UI Tests', () => {
    it('should check that the modal text content is the same with the clicked table cell', async () => {
      const { getByText, getByRole } = renderWithVuetify(SubmissionTableClientCsv, {
        propsData: { submissions: mockSubmissions(), selected: [] },
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
});
