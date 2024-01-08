import uniqueId from 'lodash/uniqueId';

const defaultOptions = {
  readOnly: false,
  required: false,
  redacted: false,
  relevance: {
    enabled: false,
    code: '',
  },
  initialize: {
    enabled: false,
    code: '',
  },
  constraint: {
    enabled: false,
    code: '',
  },
  calculate: {
    enabled: false,
    code: '',
  },
  apiCompose: {
    enabled: false,
    code: '',
  },
};

const defaultFarmOsOptions = {
  hasMultipleSelections: false,
};

const defaultChoiceSource = [
  {
    value: 'item_1',
    label: 'Item 1',
  },
  {
    value: 'item_2',
    label: 'Item 2',
  },
];

const defaultFileSource = {
  types: [],
  typesImmutable: true,
  allowMultiple: false,
};

const pageControl = (overrides = {}, index = 1) => ({
  name: `page_${index}`,
  label: `My page ${index}`,
  type: 'page',
  children: [],
  options: defaultOptions,
  hint: '',
  ...overrides,
});

const groupControl = (overrides = {}, index = 1) => ({
  name: `group_${index}`,
  label: `My group ${index}`,
  type: 'group',
  children: [],
  options: defaultOptions,
  hint: '',
  ...overrides,
});

const instructionsControl = (overrides = {}, index = 1) => ({
  name: `instructions_${index}`,
  label: `Instructions ${index}`,
  type: 'instructions',
  options: {
    ...defaultOptions,
    source: '',
  },
  hint: '',
  value: null,
  ...overrides,
});

const instructionsImageSplitControl = (overrides = {}, index = 1) => ({
  name: `instructions_split_${index}`,
  label: `Instructions Split ${index}`,
  type: 'instructionsImageSplit',
  options: {
    ...defaultOptions,
    source: {
      body: '',
      images: [],
    },
  },
  hint: '',
  value: null,
  ...overrides,
});

const stringControl = (overrides = {}, index = 1) => ({
  name: `text_${index}`,
  label: `Enter some text ${index}`,
  type: 'string',
  options: defaultOptions,
  hint: '',
  value: null,
  ...overrides,
});

const numberControl = (overrides = {}, index = 1) => ({
  name: `number_${index}`,
  label: `Enter a number ${index}`,
  type: 'number',
  options: defaultOptions,
  hint: '',
  value: null,
  ...overrides,
});

const dateControl = (overrides = {}, index = 1) => ({
  name: `date_${index}`,
  label: `Enter a date ${index}`,
  type: 'date',
  options: defaultOptions,
  hint: '',
  value: null,
  ...overrides,
});

const locationControl = (overrides = {}, index = 1) => ({
  name: `location_${index}`,
  label: `Pick Location ${index}`,
  type: 'location',
  options: defaultOptions,
  hint: '',
  value: null,
  ...overrides,
});

const selectSingleControl = (overrides = {}, index = 1) => ({
  name: `multiple_choice_${index}`,
  label: `Multiple Choice ${index}`,
  type: 'selectSingle',
  options: {
    ...defaultOptions,
    source: defaultChoiceSource,
    printLayout: {
      showAllOptionsPrintable: true,
      showAllOptions: false,
      columns: 3,
    },
  },
  hint: '',
  value: null,
  ...overrides,
});

const selectMultipleControl = (overrides = {}, index = 1) => ({
  name: `checkboxes_${index}`,
  label: `Checkboxes ${index}`,
  type: 'selectMultiple',
  options: {
    ...defaultOptions,
    source: defaultChoiceSource,
    printLayout: {
      showAllOptionsPrintable: true,
      showAllOptions: false,
      columns: 3,
    },
  },
  hint: '',
  value: null,
  ...overrides,
});

const ontologyControl = (overrides = {}, index = 1, source = uniqueId()) => ({
  name: `dropdown_${index}`,
  label: `Dropdown ${index}`,
  type: 'ontology',
  options: {
    ...defaultOptions,
    source,
    printLayout: {
      showAllOptionsPrintable: true,
      showAllOptions: false,
      columns: 3,
    },
    allowAutocomplete: false,
    hasMultipleSelections: true,
  },
  hint: '',
  value: null,
  ...overrides,
});

const matrixControl = (overrides = {}, index = 1) => ({
  name: `matrix_${index}`,
  label: `Matrix ${index}`,
  type: 'matrix',
  options: {
    ...defaultOptions,
    source: {
      config: {
        addRowLabel: 'Add row',
        fixedColumns: 1,
      },
      content: [
        {
          label: 'Sample',
          value: 'property_1',
          tags: '',
          type: 'number',
          resource: '',
          multiple: false,
          required: false,
          redacted: false,
          scaleWidth: 100,
        },
        {
          label: 'Description',
          value: 'property_2',
          tags: '',
          type: 'text',
          resource: '',
          multiple: false,
          required: false,
          redacted: false,
          scaleWidth: 100,
        },
      ],
    },
    printLayout: {
      table: true,
    },
  },
  hint: '',
  value: null,
  ...overrides,
});

const imageControl = (overrides = {}, index = 1) => ({
  name: `image_${index}`,
  label: `Upload an image ${index}`,
  type: 'image',
  options: {
    ...defaultOptions,
    source: { ...defaultFileSource, types: ['image/*'] },
    printLayout: {
      preview: false,
    },
  },
  hint: '',
  value: null,
  ...overrides,
});

const fileControl = (overrides = {}, index = 1) => ({
  name: `file_${index}`,
  label: `Upload a file ${index}`,
  type: 'file',
  options: {
    ...defaultOptions,
    source: { ...defaultFileSource, typesImmutable: false },
    printLayout: {
      preview: false,
    },
  },
  hint: '',
  value: null,
  ...overrides,
});

const scriptControl = (overrides = {}, index = 1, source = uniqueId()) => ({
  name: `script_${index}`,
  label: `Script ${index}`,
  type: 'script',
  options: {
    ...defaultOptions,
    source,
    buttonLabel: 'Run Script',
  },
  hint: '',
  value: null,
  ...overrides,
});

const farmOsFieldControl = (overrides = {}, index = 1) => ({
  name: `farmos_field_${index}`,
  label: `Farmos Field ${index}`,
  type: 'farmOsField',
  options: {
    ...defaultOptions,
    ...defaultFarmOsOptions,
  },
  hint: '',
  value: null,
  ...overrides,
});

const farmOsPlantingControl = (overrides = {}, index = 1) => ({
  name: `farmos_planting_${index}`,
  label: `Farmos Planting ${index}`,
  type: 'farmOsPlanting',
  options: {
    ...defaultOptions,
    ...defaultFarmOsOptions,
  },
  hint: '',
  value: null,
  ...overrides,
});

const farmOsFarmControl = (overrides = {}, index = 1) => ({
  name: `farmos_farm_${index}`,
  label: `Farmos Farm ${index}`,
  type: 'farmOsFarm',
  options: {
    ...defaultOptions,
    ...defaultFarmOsOptions,
  },
  hint: '',
  value: null,
  ...overrides,
});

const geoJSONControl = (overrides = {}, index = 1) => ({
  name: `map_${index}`,
  label: `Map ${index}`,
  type: 'geoJSON',
  options: {
    ...defaultOptions,
    geoJSON: {
      showPolygon: true,
      showLine: true,
      showCircle: true,
      showPoint: true,
      showGeoTrace: false,
    },
  },
  hint: '',
  value: null,
  ...overrides,
});

const getControlGenerator = (control = '') =>
  ({
    page: pageControl,
    group: groupControl,
    instructions: instructionsControl,
    instructionsImageSplit: instructionsImageSplitControl,
    string: stringControl,
    number: numberControl,
    date: dateControl,
    location: locationControl,
    selectSingle: selectSingleControl,
    selectMultiple: selectMultipleControl,
    ontology: ontologyControl,
    matrix: matrixControl,
    image: imageControl,
    file: fileControl,
    script: scriptControl,
    farmOsField: farmOsFieldControl,
    farmOsPlanting: farmOsPlantingControl,
    farmOsFarm: farmOsFarmControl,
    geoJSON: geoJSONControl,
  }[control]);

export default getControlGenerator;
