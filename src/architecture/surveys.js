// Example survey
const survey = {
  _id: '5e2ee761b0aadd000181151a', // Survey id
  name: 'Example Survey',
  dateCreated: '2020-01-27T13:59:31.989Z',
  // controls
  controls: [
    {
      name: 'fav_color',
      label: 'Favorite Color',
      type: 'inputText',
      // options
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: '',
      },
    },
    {
      name: 'personal_group',
      label: 'Personal Group',
      type: 'group', // group
      children: [
        // group has children
        {
          name: 'full_name',
          label: 'Full Name',
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
          name: 'age',
          label: 'Age',
          type: 'inputNumeric',
          options: {
            readOnly: false,
            required: false,
            relevance: '',
            constraint: '',
            calculate: '',
          },
        },
      ],
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: '',
      },
    },
  ],
};
