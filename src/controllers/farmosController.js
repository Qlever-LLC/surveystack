import { db } from '../db';
import { ObjectId } from 'mongodb';

import axios from 'axios';
import boom from '@hapi/boom';
import https from 'https';
import farmosService from '../services/farmos.service';
import rolesService from '../services/roles.service';

const common = async (endpoint, req, res) => {
  const farms = await farmosService.getCredentials(res.locals.auth.user);
  const uniqueFarmsByURL = [];
  farms.forEach((f) => {
    if (!uniqueFarmsByURL.find((u) => u.url === f.url)) {
      uniqueFarmsByURL.push(f);
    }
  });

  console.log('farms distinct by URL', uniqueFarmsByURL);

  const farmosFields = [];

  try {
    for (const farm of uniqueFarmsByURL) {
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

const getIntegrationFarms = async (req, res) => {
  const { id } = req.params;
  const { tags } = req.query;

  const aggregator = await db
    .collection('integrations.groups')
    .findOne({ _id: new ObjectId(id), type: 'farmos-aggregator' });

  if (!aggregator) {
    throw boom.notFound();
  }

  const hasAdminRole = await rolesService.hasAdminRole(res.locals.auth.user._id, aggregator.group);
  if (!hasAdminRole) {
    throw boom.unauthorized();
  }

  const { data: farms } = await axios.get(`https://${aggregator.data.url}/api/v1/farms/`, {
    headers: {
      accept: 'application/json',
      'api-key': aggregator.data.apiKey,
    },
  });
  return res.send(farms);
};

export default {
  getFields,
  getAssets,
  getIntegrationFarms,
};
