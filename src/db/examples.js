import { ObjectId } from 'mongodb';

export const exampleSurvey = {
  _id: new ObjectId('5e3038dbea0cf40001aef63b'),
  name: 'Favorite Colors',
  dateCreated: new Date('2020-01-28T13:36:13.031Z'),
  dateModified: new Date('2020-01-28T13:36:13.031Z'),
  versions: [
    {
      dateCreated: new Date('2020-01-28T13:36:13.031Z'),
      controls: [
        {
          name: 'favorite_color',
          label: 'What is your favorite color?',
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
          name: 'personal_group',
          label: 'Personal Group',
          type: 'group',
          children: [
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
    },
  ],
};

export const exampleSubmission = {
  _id: new ObjectId('5e303982ea0cf40001aef63c'),
  meta: {
    survey: new ObjectId('5e3038dbea0cf40001aef63b'),
    dateCreated: new Date('2020-01-28T13:39:14.544Z'),
    version: 0,
  },
  data: [
    {
      name: 'favorite_color',
      type: 'inputText',
      value: 'blue',
    },
    {
      name: 'personal_group',
      type: 'group',
      children: [
        {
          name: 'full_name',
          type: 'inputText',
          value: 'Andreas Rudolf',
        },
        {
          name: 'age',
          type: 'inputNumeric',
          value: 35,
        },
      ],
    },
  ],
  dateCreated: new Date('2020-01-28T13:39:31.574Z'),
};
