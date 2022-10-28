import { uniqueId } from 'lodash';

const now = new Date();

const pageData = (overrides = {}, index = 1) => ({
  [`page_${index}`]: {
    meta: { type: 'page' },
    ...overrides,
  },
});

const groupData = (overrides = {}, index = 1) => ({
  [`group_${index}`]: {
    meta: { type: 'group' },
    ...overrides,
  },
});

const instructionsData = (overrides = {}, index = 1) => ({
  [`instructions_${index}`]: {
    value: 'Mock instructions',
    meta: { type: 'instructions', dateModified: null },
    ...overrides,
  },
});

const instructionsImageSplitData = (overrides = {}, index = 1) => ({
  [`instructions_split_${index}`]: {
    value: 'Mock instructions split',
    meta: { type: 'instructionsImageSplit', dateModified: null },
    ...overrides,
  },
});

const stringData = (overrides = {}, index = 1) => ({
  [`text_${index}`]: {
    value: 'Mock string',
    meta: {
      type: 'string',
      dateModified: now,
    },
    ...overrides,
  },
});

const numberData = (overrides = {}, index = 1) => ({
  [`number_${index}`]: {
    value: 123,
    meta: {
      type: 'number',
      dateModified: now,
    },
    ...overrides,
  },
});

const dateData = (overrides = {}, index = 1) => ({
  [`date_${index}`]: {
    value: '2022-10-01T00:00:00.000Z',
    meta: {
      type: 'date',
      dateModified: now,
    },
    ...overrides,
  },
});

const locationData = (overrides = {}, index = 1) => ({
  [`location_${index}`]: {
    value: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-79.37741155949999, 43.71842556691027],
      },
      properties: { accuracy: null },
    },
    meta: {
      type: 'location',
      dateModified: now,
    },
    ...overrides,
  },
});

const selectSingleData = (overrides = {}, index = 1) => ({
  [`multiple_choice_${index}`]: {
    value: ['item_1'],
    meta: {
      type: 'selectSingle',
      dateModified: now,
    },
    ...overrides,
  },
});

const selectMultipleData = (overrides = {}, index = 1) => ({
  [`checkboxes_${index}`]: {
    value: ['item_1', 'item_2'],
    meta: {
      type: 'selectMultiple',
      dateModified: now,
    },
    ...overrides,
  },
});

const ontologyData = (overrides = {}, index = 1) => ({
  [`dropdown_${index}`]: {
    value: ['item_1'],
    meta: {
      type: 'ontology',
      dateModified: now,
    },
    ...overrides,
  },
});

const matrixData = (overrides = {}, index = 1) => ({
  [`matrix_${index}`]: {
    value: [
      { property_1: { value: 'Mock property 1-1' }, property_2: { value: 'Mock Property 2-1' } },
      { property_1: { value: 'Mock property 1-2' }, property_2: { value: 'Mock Property 2-2' } },
    ],
    meta: {
      type: 'matrix',
      dateModified: now,
    },
    ...overrides,
  },
});

const imageData = (overrides = {}, index = 1) => ({
  [`image_${index}`]: {
    value: [`resources/${uniqueId()}/file1.jpg`],
    meta: {
      type: 'image',
      dateModified: now,
    },
    ...overrides,
  },
});

const fileData = (overrides = {}, index = 1) => ({
  [`file_${index}`]: {
    value: [`resources/${uniqueId()}/file1.jpg`],
    meta: {
      type: 'file',
      dateModified: now,
    },
    ...overrides,
  },
});

const scriptData = (overrides = {}, index = 1) => ({
  [`script_${index}`]: {
    value: null,
    meta: { type: 'script', dateModified: null },
    ...overrides,
  },
});

const farmOsFieldData = (overrides = {}, index = 1) => ({
  [`farmos_field_${index}`]: {
    value: [
      {
        farmName: 'Mock farm name',
        url: 'Mock url',
        name: 'Mock name',
        fieldId: uniqueId(),
      },
    ],
    meta: {
      type: 'farmOsField',
      dateModified: now,
    },
    ...overrides,
  },
});

const farmOsPlantingData = (overrides = {}, index = 1) => ({
  [`farmos_planting_${index}`]: {
    value: [
      {
        farmId: uniqueId(),
        farmName: 'Mock farm name',
        url: 'Mock url',
        name: 'Mock name',
        assetId: uniqueId(),
        archived: true,
        location: [
          {
            id: uniqueId(),
            name: 'Mock location name',
          },
        ],
        hash: 'Mock hash',
      },
    ],
    meta: {
      type: 'farmOsPlanting',
      dateModified: now,
    },
    ...overrides,
  },
});

const farmOsFarmData = (overrides = {}, index = 1) => ({
  [`farmos_farm_${index}`]: {
    value: [{ url: 'Mock url' }],
    meta: {
      type: 'farmOsFarm',
      dateModified: now,
    },
    ...overrides,
  },
});

const geoJSONData = (overrides = {}, index = 1) => ({
  [`map_${index}`]: {
    value: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-79.39869321685993, 43.65614580273717],
                [-79.39799841596073, 43.6460912513611],
                [-79.37263818314015, 43.645085703645464],
                [-79.3698589795434, 43.657653840263464],
                [-79.39869321685993, 43.65614580273717],
              ],
            ],
          },
          properties: null,
          id: 'measureFeature0',
        },
      ],
    },
    meta: {
      type: 'geoJSON',
      dateModified: now,
    },
    ...overrides,
  },
});

const getSubmissionDataGenerator = (control = '') =>
  ({
    page: pageData,
    group: groupData,
    instructions: instructionsData,
    instructionsImageSplit: instructionsImageSplitData,
    text: stringData,
    number: numberData,
    date: dateData,
    location: locationData,
    selectSingle: selectSingleData,
    selectMultiple: selectMultipleData,
    ontology: ontologyData,
    matrix: matrixData,
    image: imageData,
    file: fileData,
    script: scriptData,
    farmOsField: farmOsFieldData,
    farmOsPlanting: farmOsPlantingData,
    farmOsFarm: farmOsFarmData,
    geoJSON: geoJSONData,
  }[control]);

export default getSubmissionDataGenerator;
