const { ObjectId } = jest.requireActual('mongodb');

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

const stringData = (overrides = {}, index = 1, inRequestFormat = false) => ({
  [`text_${index}`]: {
    value: 'Mock string',
    meta: {
      type: 'string',
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
    },
    ...overrides,
  },
});

const numberData = (overrides = {}, index = 1, inRequestFormat = false) => ({
  [`number_${index}`]: {
    value: 123,
    meta: {
      type: 'number',
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
    },
    ...overrides,
  },
});

const dateData = (overrides = {}, index = 1, inRequestFormat = false) => ({
  [`date_${index}`]: {
    value: '2022-10-01T00:00:00.000Z',
    meta: {
      type: 'date',
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
    },
    ...overrides,
  },
});

const locationData = (overrides = {}, index = 1, inRequestFormat = false) => ({
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
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
    },
    ...overrides,
  },
});

const selectSingleData = (overrides = {}, index = 1, inRequestFormat = false) => ({
  [`multiple_choice_${index}`]: {
    value: ['item_1'],
    meta: {
      type: 'selectSingle',
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
    },
    ...overrides,
  },
});

const selectMultipleData = (overrides = {}, index = 1, inRequestFormat = false) => ({
  [`checkboxes_${index}`]: {
    value: ['item_1', 'item_2'],
    meta: {
      type: 'selectMultiple',
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
    },
    ...overrides,
  },
});

const ontologyData = (overrides = {}, index = 1, inRequestFormat = false) => ({
  [`dropdown_${index}`]: {
    value: ['item_1', 'item_2'],
    meta: {
      type: 'ontology',
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
    },
    ...overrides,
  },
});

const matrixData = (overrides = {}, index = 1, inRequestFormat = false) => ({
  [`matrix_${index}`]: {
    value: [
      { property_1: { value: 1 }, property_2: { value: 'ABC' } },
      { property_1: { value: 2 }, property_2: { value: 'def' } },
    ],
    meta: {
      type: 'matrix',
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
    },
    ...overrides,
  },
});

const imageData = (overrides = {}, index = 1, inRequestFormat = false) => ({
  [`image_${index}`]: {
    value: ['resources/mock-resource-id/file1.jpg'],
    meta: {
      type: 'image',
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
    },
    ...overrides,
  },
});

const fileData = (overrides = {}, index = 1, inRequestFormat = false) => ({
  [`file_${index}`]: {
    value: ['resources/mock-resource-id/file1.jpg'],
    meta: {
      type: 'file',
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
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

const farmOsFieldData = (overrides = {}, index = 1, inRequestFormat = false) => ({
  [`farmos_field_${index}`]: {
    value: [
      {
        farmName: 'Mock farm name',
        url: 'Mock url',
        name: 'Mock name',
        id: inRequestFormat ? new ObjectId().toString() : new ObjectId(),
      },
    ],
    meta: {
      type: 'farmOsField',
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
    },
    ...overrides,
  },
});

const farmOsPlantingData = (overrides = {}, index = 1, inRequestFormat = false) => ({
  [`farmos_planting_${index}`]: {
    value: [
      {
        farmName: 'Mock farm name',
        url: 'Mock url',
        name: 'Mock name',
        id: inRequestFormat ? new ObjectId().toString() : new ObjectId(),
        archived: true,
        location: [
          {
            id: inRequestFormat ? new ObjectId().toString() : new ObjectId(),
            name: 'Mock location name',
          },
        ],
        hash: 'Mock hash',
      },
    ],
    meta: {
      type: 'farmOsPlanting',
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
    },
    ...overrides,
  },
});

const farmOsFarmData = (overrides = {}, index = 1, inRequestFormat = false) => ({
  [`farmos_farm_${index}`]: {
    value: [{ url: 'Mock url' }],
    meta: {
      type: 'farmOsFarm',
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
    },
    ...overrides,
  },
});

const geoJSONData = (overrides = {}, index = 1, inRequestFormat = false) => ({
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
      dateModified: inRequestFormat ? new Date().toISOString() : new Date(),
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
    string: stringData,
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
