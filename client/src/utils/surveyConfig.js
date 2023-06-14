import { cloneDeep } from 'lodash';
import ObjectId from 'bson-objectid';

export const defaultControlOptions = {
  readOnly: false,
  required: false,
  redacted: false,
  relevance: {
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

const createDefaultMatrixSource = () => ({
  config: { addRowLabel: 'Add row', fixedColumns: 1 },
  content: [
    {
      label: 'Sample',
      value: 'sample',
      tags: '',
      type: 'number',
      options: {},
      resource: '',
      multiple: false,
      required: false,
      redacted: false,
      scaleWidth: 100,
    },
    {
      label: 'Description',
      value: 'description',
      tags: '',
      type: 'text',
      options: {},
      resource: '',
      multiple: false,
      required: false,
      redacted: false,
      scaleWidth: 100,
    },
  ],
});

export const createControlInstance = (control) => {
  const clone = cloneDeep(control);

  const cloneWithDefaultOptions = Object.assign(clone, {
    options: control.options || cloneDeep(defaultControlOptions),
    id: new ObjectId().toString(),
  });

  if (control.type === 'page') {
    cloneWithDefaultOptions.options.compact = false;
  } else if (control.type === 'selectSingle' || control.type === 'selectMultiple') {
    cloneWithDefaultOptions.options.source = [];
    cloneWithDefaultOptions.options.printLayout = {
      showAllOptionsPrintable: true,
      showAllOptions: false,
      columns: 3,
    };
  } else if (control.type === 'matrix') {
    cloneWithDefaultOptions.options.source = createDefaultMatrixSource();
    cloneWithDefaultOptions.options.printLayout = {
      table: true,
    };
  } else if (control.type === 'ontology') {
    cloneWithDefaultOptions.options.source = '';
    cloneWithDefaultOptions.options.printLayout = {
      showAllOptionsPrintable: true,
      showAllOptions: false,
      columns: 3,
    };
  } else if (control.type === 'instructions') {
    cloneWithDefaultOptions.options.source = '';
  } else if (control.type === 'geoJSON') {
    cloneWithDefaultOptions.options.geoJSON = {
      showPolygon: true,
      showLine: true,
      showCircle: true,
      showPoint: true,
    };
  } else if (control.type === 'instructionsImageSplit') {
    cloneWithDefaultOptions.options.source = {
      body: '',
      images: [],
    };
  } else if (control.type === 'file') {
    cloneWithDefaultOptions.options.source = {
      types: [],
      typesImmutable: false,
      allowMultiple: false,
    };
    cloneWithDefaultOptions.options.printLayout = {
      preview: false,
    };
  } else if (control.type === 'image') {
    cloneWithDefaultOptions.options.source = {
      types: ['image/*'],
      typesImmutable: true,
      allowMultiple: false,
    };
    cloneWithDefaultOptions.options.printLayout = {
      preview: false,
    };
  } else if (control.type === 'farmOsUuid') {
    cloneWithDefaultOptions.options.farmOsTypes = ['field', 'planting'];
    cloneWithDefaultOptions.options.farmOsType = 'field';
  }

  if (control.type !== 'group' && control.type !== 'page' && control.value === undefined) {
    control.value = null;
    control.defaultValue = null;
  }

  delete cloneWithDefaultOptions.icon;
  return cloneWithDefaultOptions;
};

export const availableControls = [
  {
    name: 'group',
    label: 'My group',
    type: 'group',
    children: [],
    icon: 'mdi-format-list-group',
  },
  {
    name: 'page',
    label: 'My page',
    type: 'page',
    children: [],
    icon: 'mdi-file-outline',
  },
  {
    name: 'instructions',
    label: 'Instructions',
    type: 'instructions',
    icon: 'mdi-clipboard-text-outline',
  },
  {
    name: 'instructions_split',
    label: 'Instructions Split',
    type: 'instructionsImageSplit',
    icon: 'mdi-view-split-vertical',
  },
  {
    name: 'text',
    label: 'Enter some text',
    type: 'string',
    icon: 'mdi-format-text-variant',
  },
  {
    name: 'number',
    label: 'Enter a number',
    type: 'number',
    icon: 'mdi-numeric',
  },
  {
    name: 'date',
    label: 'Enter a date',
    type: 'date',
    icon: 'mdi-calendar',
  },
  {
    name: 'location',
    label: 'Pick Location',
    type: 'location',
    icon: 'mdi-map-marker-plus',
  },
  {
    name: 'multiple_choice',
    label: 'Multiple Choice',
    type: 'selectSingle',
    icon: 'mdi-radiobox-marked',
  },
  {
    name: 'checkboxes',
    label: 'Checkboxes',
    type: 'selectMultiple',
    icon: 'mdi-checkbox-marked-outline',
  },
  {
    name: 'dropdown',
    label: 'Dropdown',
    type: 'ontology',
    icon: 'mdi-arrow-down-drop-circle-outline',
  },
  {
    name: 'matrix',
    label: 'Matrix',
    type: 'matrix',
    icon: 'mdi-matrix',
  },
  {
    name: 'image',
    label: 'Upload an image',
    type: 'image',
    icon: 'mdi-file-upload-outline',
  },
  {
    name: 'file',
    label: 'Upload a file',
    type: 'file',
    icon: 'mdi-file-upload-outline',
  },
  {
    name: 'script',
    label: 'Script',
    type: 'script',
    icon: 'mdi-code-braces',
  },
  {
    name: 'map',
    label: 'Map',
    type: 'geoJSON',
    icon: 'mdi-map',
  },
  {
    name: 'farmos_field',
    label: 'Farmos Field',
    type: 'farmOsField',
    icon: 'mdi-leaf',
  },
  {
    name: 'farmos_planting',
    label: 'Farmos Planting',
    type: 'farmOsPlanting',
    icon: 'mdi-leaf',
  },
  {
    name: 'farmos_farm',
    label: 'Farmos Farm',
    type: 'farmOsFarm',
    icon: 'mdi-leaf',
  },
  {
    name: 'farmos_uuid',
    label: 'FarmOS ID',
    type: 'farmOsUuid',
    icon: 'mdi-leaf',
  },
];
