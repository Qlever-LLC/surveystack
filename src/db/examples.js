import { ObjectId } from 'mongodb';

export const exampleSurvey = {
  _id: new ObjectId('5e3038dbea0cf40001aef63b'),
  name: 'Favorite Colors',
  dateCreated: new Date('2020-01-28T13:36:13.031Z'),
  dateModified: new Date('2020-01-28T13:36:13.031Z'),
  latestVersion: 1,
  versions: [
    {
      dateCreated: new Date('2020-01-28T13:36:13.031Z'),
      version: 1,
      controls: [
        {
          name: 'favorite_color',
          label: 'What is your favorite color?',
          type: 'string',
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
              type: 'string',
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
              type: 'number',
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

export const exampleSubmissionDep = {
  _id: new ObjectId('5e303982ea0cf40001aef63c'),
  survey: new ObjectId('5e3038dbea0cf40001aef63b'),
  meta: {
    dateCreated: new Date('2020-01-28T13:39:14.544Z'),
    version: 1,
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
};

export const exampleSubmission = {
  _id: new ObjectId('5e303982ea0cf40001aef63c'),
  survey: new ObjectId('5e3038dbea0cf40001aef63b'),
  meta: {
    dateCreated: new Date('2020-01-28T13:39:14.544Z'),
    version: 1,
  },
  data: {
    favorite_color: {
      value: 'blue',
      type: 'string',
    },
    personal_group: {
      full_name: {
        value: 'Andreas Rudolf',
        type: 'string',
      },
      age: {
        value: 35,
        type: 'number',
      },
      type: 'group',
    },
  },
};
