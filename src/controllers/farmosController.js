import { db } from '../db';
import axios from 'axios';
import boom from '@hapi/boom';
import https from 'https';

const common = async (endpoint, req, res) => {
  // TODO check auth
  // TODO get API Key
  // Get List of Farms available to user

  const farms = [
    {
      name: 'farmOS Test',
      url: 'https://test.farmos.net',
      aggregatorURL: 'oursci.farmos.group',
      aggregatorApiKey: process.env.FARMOS_AGGREGATOR_APIKEY,
    },
    {
      name: 'Our Sci Test	',
      url: 'https://ourscitest.farmos.net',
      aggregatorURL: 'oursci.farmos.group',
      aggregatorApiKey: process.env.FARMOS_AGGREGATOR_APIKEY,
    },
  ];

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

export default {
  getFields,
  getAssets,
};
