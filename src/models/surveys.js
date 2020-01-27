// Example survey
const survey = {
  _id: '5e2ed0ca2ae9cd0001b8c3d1', // survey id
  name: 'Calculating Survey 2019',
  controls: [
    {
      name: 'first_name',
      label: 'First name',
      type: 'inputText',
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: '',
      },
    },
    {
      name: 'last_name',
      label: 'Last name',
      type: 'inputText',
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: '',
      },
    },
    {
      name: 'full_name',
      label: 'Full name calculation',
      type: 'inputText',
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: "data.first_name + ' ' + data.last_name",
      },
    },
  ],
};
