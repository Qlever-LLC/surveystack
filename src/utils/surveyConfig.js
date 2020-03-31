import { cloneDeep } from 'lodash';

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
};

export const createControlInstance = (control) => {
  const clone = cloneDeep(control);

  const cloneWithDefaultOptions = Object.assign(clone, {
    options: cloneDeep(defaultControlOptions),
  });

  if (control.type === 'selectSingle' || control.type === 'selectMultiple' || control.type === 'ontology') {
    cloneWithDefaultOptions.options.source = [];
  }

  if (control.type === 'instructions') {
    cloneWithDefaultOptions.options.source = '';
  }

  delete cloneWithDefaultOptions.icon;
  return cloneWithDefaultOptions;
};


export const availableControls = [
  {
    name: 'instructions',
    label: 'Instructions',
    type: 'instructions',
    icon: 'mdi-clipboard-text-outline',
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
    name: 'group',
    label: 'My group',
    type: 'group',
    children: [],
    icon: 'mdi-group',
  },
  {
    name: 'location',
    label: 'Pick Location',
    type: 'location',
    icon: 'mdi-map-marker-plus',
  },
  {
    name: 'script',
    label: 'Script',
    type: 'script',
    icon: 'mdi-code-braces',
  },
  {
    name: 'multiple choice',
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
    icon: 'mdi-arrow-down-drop-circle',

  },
  {
    name: 'farmos-field',
    label: 'Farmos Field',
    type: 'farmOsField',
    icon: 'mdi-leaf',

  },
  {
    name: 'farmos-planting',
    label: 'Farmos Planting',
    type: 'farmOsPlanting',
    icon: 'mdi-leaf',
  },
];
