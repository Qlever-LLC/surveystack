import { ObjectId } from 'mongodb';

import { db } from '../models';

const randomString = () =>
  Math.random()
    .toString(36)
    .substring(7);

const exampleSurvey = {
  _id: ObjectId('5dad91cd925e13de6f174644'),
  name: 'Super Heroes 2',
  controls: [
    {
      name: 'hero_name',
      label: 'Hero name',
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
      name: 'hero_ability',
      label: 'Hero ability',
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
};

const createSurveyResult = ({ surveyObject }) => {
  const data = [];
  surveyObject.controls.forEach(control => {
    const { name, type } = control;
    const value = randomString();

    data.push({
      name,
      type,
      value,
    });
  });

  const result = {
    data,
    survey: new ObjectId(surveyObject._id),
    created: new Date(),
  };

  return result;
};

export const createDummyResults = async ({ survey, amount = 100, user }) => {
  const surveyObject = await db.collection('surveys').findOne({ _id: new ObjectId(survey) });
  console.log(surveyObject);

  const results = [];

  for (let i = 0; i < amount; i++) {
    results.push(createSurveyResult({ surveyObject }));
  }

  await db.collection('submissions').insertMany(results);

  return true;
};
