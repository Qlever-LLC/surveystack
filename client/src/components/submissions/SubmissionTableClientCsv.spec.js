import { transformHeaders, clickedRecord } from './SubmissionTableClientCsv.vue';

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

  describe('clickedRecord', () => {
    it('should return the correct header value and item Id that was clicked', () => {
      const expected = clickedRecord('header value', 'item id');
      expect(expected).toEqual('header value_item id');
    });
  });
});
