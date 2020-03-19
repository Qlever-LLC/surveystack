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
};

export const createControlInstance = (control) => {
  const clone = _.cloneDeep(control);

  const cloneWithDefaultOptions = Object.assign(clone, {
    options: _.cloneDeep(defaultControlOptions),
  });

  if (control.type === 'selectSingle' || control.type === 'selectMultiple' || control.type === 'ontology') {
    cloneWithDefaultOptions.options.source = [];
  }

  delete cloneWithDefaultOptions.icon;
  return cloneWithDefaultOptions;
};


export const availableControls = [
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
    name: 'group',
    label: 'My group',
    type: 'group',
    children: [],
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
    name: 'multiple_choice',
    label: 'Multiple Choice',
    type: 'selectSingle',
    icon: 'mdi-order-bool-descending',
    // icon: 'mdi-checkbox-multiple-blank-circle-outline',
  },
  {
    name: 'checkboxes',
    label: 'Checkboxes',
    type: 'selectMultiple',
    // icon: 'mdi-order-bool-ascending-variant',
    icon: 'mdi-format-list-checks',
    // icon: 'mdi-check-box-outline',
    // icon: 'mdi-checkbox-multiple-marked-outline',
  },
  {
    name: 'dropdown',
    label: 'Dropdown',
    type: 'ontology',
    // icon: 'mdi-text-search',
    // icon: 'mdi-view-list',
    // icon: 'mdi-box-search',
    icon: 'mdi-format-list-bulleted-type',
  },
];
