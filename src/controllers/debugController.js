import _ from 'lodash';
import boom from '@hapi/boom';

import { db } from '../db';
import { exampleSurvey, exampleSubmission } from '../db/examples';
import { createDummyResults } from '../services/dummy.service';

const getDefault = async (req, res) => {
  return res.send('This is the debug route');
};

const throwError = async (req, res) => {
  throw boom.badRequest("It's a bad request");
};

const createDummySubmissions = async (req, res) => {
  const { survey } = req.body;
  const r = createDummyResults({ survey });
  return res.send(r);
};

// TODO: delete this endpoint in production!
const tabulaRasa = async (req, res) => {
  console.log('inside tabula rasa');
  await db.collection('surveys').deleteMany({});
  await db.collection('submissions').deleteMany({});

  const survey = _.cloneDeep(exampleSurvey);
  await db.collection('surveys').insertOne(survey);

  const submission = _.cloneDeep(exampleSubmission);
  await db.collection('submissions').insertOne(submission);

  console.log('end of tabula rasa');
  return res.send('OK');
};

export default {
  getDefault,
  throwError,
  createDummySubmissions,
  tabulaRasa,
};
