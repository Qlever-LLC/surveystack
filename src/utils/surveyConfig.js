import _ from 'lodash';

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

export const createControlInstance = (control) => {
  const clone = _.cloneDeep(control);

  const cloneWithDefaultOptions = Object.assign(clone, {
    options: _.cloneDeep(defaultControlOptions),
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
    // icon: 'mdi-card-text-outline',
    // icon: 'mdi-card-text',
    // icon: 'mdi-sign-text',
    // icon: 'mdi-format-list-text',
    // icon: 'mdi-clipboard-text',
    icon: 'mdi-clipboard-text-outline',
    // icon: 'mdi-note-text',
    // icon: 'mdi-note-text-outline',
    // icon: 'mdi-text',
    // icon: 'mdi-text-box',
    // icon: 'mdi-text-box-outline',
  },
  {
    name: 'text',
    label: 'Enter some text',
    type: 'string',
    icon: 'mdi-format-text-variant',
    // icon: 'mdi-format-text',
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
    // icon: 'mdi-order-bool-descending',
    // icon: 'mdi-checkbox-multiple-blank-circle-outline',
    icon: 'mdi-radiobox-marked',
  },
  {
    name: 'checkboxes',
    label: 'Checkboxes',
    type: 'selectMultiple',
    // icon: 'mdi-order-bool-ascending-variant',
    // icon: 'mdi-format-list-checks',
    // icon: 'mdi-check-box-outline',
    // icon: 'mdi-checkbox-multiple-marked-outline',
    // icon: 'mdi-checkbox-marked',
    icon: 'mdi-checkbox-marked-outline',

  },
  {
    name: 'dropdown',
    label: 'Dropdown',
    type: 'ontology',
    // icon: 'mdi-text-search',
    // icon: 'mdi-view-list',
    // icon: 'mdi-box-search',
    // icon: 'mdi-format-list-bulleted-type',
    // icon: 'mdi-textbox',
    icon: 'mdi-arrow-down-drop-circle',
    // icon: 'mdi-arrow-down-drop-circle-outline',

  },
  {
    name: 'farmos-field',
    label: 'Farmos Field',
    type: 'farmOsField',
    // icon: 'mdi-text-search',
    // icon: 'mdi-view-list',
    // icon: 'mdi-box-search',
    // icon: 'mdi-format-list-bulleted-type',
    // icon: 'mdi-textbox',
    icon: 'mdi-leaf',
    // icon: 'mdi-arrow-down-drop-circle-outline',

  },
  {
    name: 'farmos-planting',
    label: 'Farmos Planting',
    type: 'farmOsPlanting',
    // icon: 'mdi-text-search',
    // icon: 'mdi-view-list',
    // icon: 'mdi-box-search',
    // icon: 'mdi-format-list-bulleted-type',
    // icon: 'mdi-textbox',
    icon: 'mdi-leaf',
    // icon: 'mdi-arrow-down-drop-circle-outline',

  },
];
