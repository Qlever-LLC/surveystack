import { transformHeaders, truncate } from './SubmissionTableClientCsv.vue';

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

  const longText =
    'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.';

  describe('truncate', () => {
    it('truncates long text', () => {
      expect(truncate(longText, 36, '...')).toEqual('Lorem Ipsum is simply dummy text of ...');
    });
  });
});
