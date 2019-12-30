import boom from '@hapi/boom';

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

export default {
  getDefault,
  throwError,
  createDummySubmissions,
};
