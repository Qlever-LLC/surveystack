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
  },
  {
    name: 'number',
    label: 'Enter a number',
    type: 'number',
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
  },
  {
    name: 'script',
    label: 'Script',
    type: 'script',
  },
];
