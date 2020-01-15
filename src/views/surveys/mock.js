export default [{
  _id: '5dadc4c9988f9df9527f07ac',
  name: 'Generations Survey',
  controls: [
    {
      name: 'name',
      label: 'What is your name?',
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
      label: 'What is your age?',
      type: 'inputNumeric',
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: '',
      },
    },
    {
      name: 'group_old',
      label: 'Old group',
      type: 'group',
      children: [
        {
          name: 'medication',
          label: 'What medication do you use?',
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
          name: 'physical',
          label: 'My group 2',
          type: 'group',
          children: [
            {
              name: 'vision',
              label: 'What is your vision?',
              type: 'inputNumeric',
              options: {
                readOnly: false,
                required: false,
                relevance: '',
                constraint: '',
                calculate: '',
              },
            },
            {
              name: 'time_mile',
              label: 'How long to run one mile?',
              type: 'inputText',
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
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: '',
      },
    },
    {
      name: 'group_young',
      label: 'My group 5',
      type: 'group',
      children: [
        {
          name: 'sports',
          label: 'What sports do you watch?',
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
          name: 'consoles',
          label: 'Which consoles do you own?',
          type: 'inputText',
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
    {
      name: 'goodbye',
      label: 'Say goodbye',
      type: 'inputText',
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: '',
      },
    },
  ],
}];
