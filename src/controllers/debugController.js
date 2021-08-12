import _ from 'lodash';
import boom from '@hapi/boom';

import { db } from '../db';
import {
  exampleSurveys,
  exampleSubmissions,
  exampleGroups,
  exampleUsers,
  exampleMemberships,
} from '../db/examples';
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

const tabulaRasa = async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    throw boom.badRequest('Can only tabula rasa on development server');
  }
  console.log('inside tabula rasa');

  // clear collections
  await db.collection('surveys').deleteMany({});
  await db.collection('submissions').deleteMany({});
  await db.collection('scripts').deleteMany({});
  await db.collection('groups').deleteMany({});
  await db.collection('users').deleteMany({});
  await db.collection('memberships').deleteMany({});
  await db.collection('integrations.groups').deleteMany({});
  await db.collection('integrations.memberships').deleteMany({});
  await db.collection('integrations.users').deleteMany({});

  // insert examples
  await db.collection('surveys').insertMany(exampleSurveys);
  await db.collection('submissions').insertMany(exampleSubmissions);
  await db.collection('groups').insertMany(exampleGroups);
  await db.collection('users').insertMany(exampleUsers);
  await db.collection('memberships').insertMany(exampleMemberships);

  // create initial admin
  await initAdmins();

  console.log('end of tabula rasa');
  return res.send('OK');
};

export default {
  getDefault,
  throwError,
  createDummySubmissions,
  tabulaRasa,
};
