export const defaultControlOptions = {
  readOnly: false,
  required: false,
  relevance: '',
  constraint: '',
  calculate: '',
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
    toString(value) {
      return `lat: ${value.lat} lon: ${value.lon}`;
    },
    definition() {

    },
  },
];
