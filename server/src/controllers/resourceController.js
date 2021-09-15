import assert from 'assert';
import boom from '@hapi/boom';

import { ObjectId } from 'mongodb';

import { db } from '../db';

import { queryParam } from '../helpers';
import mailService from '../services/mail.service';
import membershipService from '../services/membership.service';
import rolesService from '../services/roles.service';

const col = 'resources';

const getResources = async (req, res) => {
  return res.send([]);
};

export default {
  getResources,
};
