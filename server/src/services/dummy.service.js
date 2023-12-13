import { ObjectId } from 'mongodb';

import { db } from '../db';

const randomString = () => Math.random().toString(36).substring(7);

const createSurveyResult = ({ surveyObject }) => {
  const data = [];
  surveyObject.controls.forEach((control) => {
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

export const createDummyResults = async ({ survey, amount = 100 }) => {
  const surveyObject = await db.collection('surveys').findOne({ _id: new ObjectId(survey) });
  console.log(surveyObject);

  const results = [];

  for (let i = 0; i < amount; i++) {
    results.push(createSurveyResult({ surveyObject }));
  }

  await db.collection('submissions').insertMany(results);

  return true;
};
