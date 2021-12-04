import { db } from '../db';
import { ObjectId } from 'mongodb';

import axios from 'axios';
import boom from '@hapi/boom';
import https from 'https';
import { ping } from '../services/farmos-2/area';

const areaPing = () => {
  ping();
}

export default {
  areaPing
};