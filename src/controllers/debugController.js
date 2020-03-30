import _ from 'lodash';
import boom from '@hapi/boom';

import { db } from '../db';
import { exampleSurvey, exampleSubmissions, exampleGroups, exampleUsers } from '../db/examples';
import { createDummyResults } from '../services/dummy.service';
import { initAdmins } from '../services/admin.service';

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
  await db.collection('scripts').deleteMany({});
  await db.collection('groups').deleteMany({});
  await db.collection('users').deleteMany({});

  const survey = _.cloneDeep(exampleSurvey);
  await db.collection('surveys').insertOne(survey);

  exampleSubmissions.forEach(async exampleSubmission => {
    await db.collection('submissions').insertOne(exampleSubmission);
  });

  exampleGroups.forEach(async exampleGroup => {
    await db.collection('groups').insertOne(exampleGroup);
  });

  await initAdmins();
  exampleUsers.forEach(async exampleUser => {
    const user = _.cloneDeep(exampleUser);
    await db.collection('users').insertOne(user);
  });

  console.log('end of tabula rasa');
  return res.send('OK');
};

export default {
  getDefault,
  throwError,
  createDummySubmissions,
  tabulaRasa,
};
