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

  //console.log('farms distinct by URL', uniqueFarmsByURL);

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

const webhookCallback = async (req, res, next) => {
  try {
    const { key } = req.query

    //console.log("req", req)
    if (!key) {
      throw boom.unauthorized("key missing")
    }

    if (!process.env.FARMOS_CALLBACK_KEY) {
      throw boom.badRequest("server does not support farmos webhooks")
    }

    if (key !== process.env.FARMOS_CALLBACK_KEY) {
      throw boom.unauthorized("unauthorized")
    }

    const { url, plan, status } = req.body

    if (status !== "ready") {
      throw boom.badRequest("expecting status ready")
    }

    return farmosService.handleWebhookCallback(req, res, url, plan)
  } catch (error) {
    console.log("error", error)
    if (boom.isBoom(error)) {
      return next(error)
    } else {
      return res.send({
        status: "error"
      })
    }
  }

}

const testConnection = async (req, res) => {
  const aggregator = req.body;

  if (!aggregator.data.url) {
    throw boom.badRequest("argument data.url missing")
  }

  if (!aggregator.data.apiKey) {
    throw boom.badRequest("argument data.apiKey missing")
  }

  const agentOptions = {
    host: aggregator.data.url,
    port: '443',
    path: '/',
    rejectUnauthorized: false,
  };

  const agent = new https.Agent(agentOptions);

  try {
    const r = await axios.get(
      `https://${aggregator.data.url}/api/v1/farms/`,
      {
        headers: {
          accept: 'application/json',
          'api-key': aggregator.data.apiKey,
        },
        httpsAgent: agent,
      }
    );

    if (r.status === 200) {
      return res.send({
        status: "success"
      })
    } else {
      throw Error("unable to connect to aggregator")
    }
  } catch (error) {
    return res.send({
      status: "error",
      message: error.message
    })
  }
}

const getMembersByFarmAndGroup = async (req, res) => {
  const { farmUrl, group, aggregator } = req.query;
  if (!farmUrl || !group || !aggregator) {
    throw boom.badRequest("missing farmUrl, group or aggregator")
  }


  const access = await rolesService.hasAdminRole(res.locals.auth.user._id, group);
  if (!access) {
    throw boom.unauthorized("permission denied: not group admin")
  }


  const pipeline = [
    {
      '$match': {
        'data.url': farmUrl,
        'type': 'farmos-farm',
        'data.aggregator': new ObjectId(aggregator)
      }
    }, {
      '$lookup': {
        'from': 'memberships',
        'localField': 'membership',
        'foreignField': '_id',
        'as': 'm'
      }
    }, {
      '$project': {
        'membership': {
          '$arrayElemAt': [
            '$m', 0
          ]
        }
      }
    }, {
      '$match': {
        'membership.group': new ObjectId(group)
      }
    }, {
      '$lookup': {
        'from': 'users',
        'localField': 'membership.user',
        'foreignField': '_id',
        'as': 'user'
      }
    }
  ]

  const entities = await db
    .collection('integrations.memberships')
    .aggregate(pipeline)
    .toArray();

  return res.send(entities);
};

export default {
  getFields,
  getAssets,
  getIntegrationFarms,
  webhookCallback,
  testConnection,
  getMembersByFarmAndGroup
};
