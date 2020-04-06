import { db } from '../db';
import axios from 'axios';
import boom from '@hapi/boom';
import https from 'https';
import farmosService from '../services/farmos.service';

const common = async (endpoint, req, res) => {
  const farms = await farmosService.getCredentials(res.locals.auth.user);

  const farmosFields = [];

  try {
    for (const farm of farms) {
      console.log('farm', farm);
      const agentOptions = {
        host: farm.aggregatorURL,
        port: '443',
        path: '/',
        rejectUnauthorized: false,
      };

      const agent = new https.Agent(agentOptions);

      const r = await axios.get(
        `https://${farm.aggregatorURL}/api/v1/farms/${endpoint}/?farm_url=${encodeURIComponent(
          farm.url
        )}`,
        {
          headers: {
            accept: 'application/json',
            'api-key': farm.aggregatorApiKey,
          },
          httpsAgent: agent,
        }
      );
      farmosFields.push({ farm: farm.name, url: farm.url, data: r.data });
    }
  } catch (exception) {
    console.error(exception);
    throw boom.badData();
  }

  return res.send(farmosFields);
};

const getFields = async (req, res) => {
  return common('areas', req, res);
};

const getAssets = async (req, res) => {
  return common('assets', req, res);
};

const getAggregatorFarms = async (req, res) => {
  // TODO: try not to pass api key from front-end
  const { url, apiKey, tags } = req.query;
  const { data } = await axios.get(`https://${url}/api/v1/farms/`, {
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
    },
  });
  return res.send(data);
};

export default {
  getFields,
  getAssets,
  getAggregatorFarms,
};
