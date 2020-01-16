export const defaultControlOptions = {
  readOnly: false,
  required: false,
  relevance: '',
  constraint: '',
  calculate: '',
};

export const availableControls = [
  { name: 'text', label: 'Enter some text', type: 'inputText' },
  { name: 'numeric', label: 'Enter a number', type: 'inputNumeric' },
  {
    name: 'group', label: 'My group', type: 'group', children: [],
  },
];
