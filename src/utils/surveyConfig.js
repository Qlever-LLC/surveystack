export const defaultControlOptions = {
  readOnly: false,
  required: false,
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
    name: 'single select',
    label: 'Select One',
    type: 'select_single',
    // icon: 'mdi-order-bool-descending',
    icon: 'mdi-checkbox-multiple-blank-circle-outline',
  },
  {
    name: 'multi select',
    label: 'Select All that Apply',
    type: 'select_multiple',
    // icon: 'mdi-order-bool-ascending-variant',
    // icon: 'mdi-check-box-outline',
    icon: 'mdi-checkbox-multiple-marked-outline',
  },
];
