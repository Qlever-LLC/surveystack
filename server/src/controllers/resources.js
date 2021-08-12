import assert from 'assert';
import boom from '@hapi/boom';

import { ObjectId } from 'mongodb';

import { db } from '../db';

const col = 'resources';

const serve = (req, res) => {
  const { id } = req.params;
  return res.send(`this is the resource: ${id}`);
};

export default {
  serve,
};
