import { db } from '../db';
import { ObjectId } from 'mongodb';

import axios from 'axios';
import boom from '@hapi/boom';
import https from 'https';
import farmosService from '../services/farmos.service';
import rolesService from '../services/roles.service';

const getFarms = async (req, res) => {
  let farms;
  try {
    farms = await farmosService.getCredentials(res.locals.auth.user);
  } catch (exception) {
    console.error(exception);
    throw boom.badData();
  }

  return res.send(farms.map(f => ({ name: f.name, url: f.url })));
}

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

      console.log("fetching fields", farm.aggregatorURL, endpoint, farm.url);

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


const getAreas = async (req, res) => {
  const { aggregator, farmurl } = req.params;

  const ag = await db
    .collection('integrations.groups')
    .findOne({ _id: new ObjectId(aggregator), type: 'farmos-aggregator' });

  if (!ag) {
    throw boom.notFound();
  }

  const hasAdminRole = await rolesService.hasAdminRole(res.locals.auth.user._id, ag.group);
  if (!hasAdminRole) {
    throw boom.unauthorized();
  }


  const apiKey = ag.data.apiKey;
  if (!apiKey) {
    throw boom.internal('api key missing for aggregator ' + ag._id);
  }


  try {
    const agentOptions = {
      host: ag.data.url,
      port: '443',
      path: '/',
      rejectUnauthorized: false,
    };

    const agent = new https.Agent(agentOptions);

    const r = await axios.get(
      `https://${ag.data.url}/api/v1/farms/areas/?farm_url=${encodeURIComponent(
        farmurl
      )}`,
      {
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
        },
        httpsAgent: agent,
      }
    );
    return res.send({
      status: "success",
      areas: r.data
    })
  } catch (exception) {
    console.error(exception);
    throw boom.badData();
  }
};


const createFieldRequest = async (ag, apiKey, farmurl, name, wkt) => {
  const agentOptions = {
    host: ag.data.url,
    port: '443',
    path: '/',
    rejectUnauthorized: false,
  };

  const agent = new https.Agent(agentOptions);

  const vr = await axios.get(
    `https://${ag.data.url}/api/v1/farms/info/?use_cached=false&farm_url=${encodeURIComponent(
      farmurl
    )}`,
    {
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
      },
      httpsAgent: agent,
    }
  );

  console.log("ag", ag);
  console.log("url", farmurl);
  console.log("info response", vr.data);

  const fid = Object.keys(vr.data)[0];
  const vid = vr.data[fid]['info']['resources']['taxonomy_term']['farm_areas'].vid;


  const r = await axios.post(
    `https://${ag.data.url}/api/v1/farms/areas/?farm_url=${encodeURIComponent(
      farmurl
    )}`,
    {
      "vocabulary": vid + "",
      "name": name,
      "description": "",
      "area_type": "field",
      "geofield": [
        {
          "geom": wkt,
        },
      ],
    },
    {
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
      },
      httpsAgent: agent,
    }
  );

  return r;
}


const createField = async (req, res) => {
  const { aggregator, farmurl } = req.params;
  const { name, wkt } = req.body;

  const ag = await db
    .collection('integrations.groups')
    .findOne({ _id: new ObjectId(aggregator), type: 'farmos-aggregator' });

  if (!ag) {
    throw boom.notFound();
  }

  const hasAdminRole = await rolesService.hasAdminRole(res.locals.auth.user._id, ag.group);
  if (!hasAdminRole) {
    throw boom.unauthorized();
  }


  const apiKey = ag.data.apiKey;
  if (!apiKey) {
    throw boom.internal('api key missing for aggregator ' + ag._id);
  }

  if (!name) {
    boom.badData("missing name");
  }

  if (!wkt) {
    boom.badData("missing wkt");
  }

  try {
    const r = await createFieldRequest(ag, apiKey, farmurl, name, wkt);
    return res.send({
      status: "success",
      areas: r.data
    })
  } catch (exception) {
    console.error(exception);
    throw boom.badData(exception.message);
  }
};

const getIntegrationFarms = async (req, res) => {
  const { id } = req.params;

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

  const tags = aggregator.data.parameters;
  if (!tags) {
    return res.send(farms);
  }

  console.log("filtering for tags", tags);
  const arr = tags.split(",");
  return res.send(farms.filter(f => {
    console.log('farm tags', f.tags)
    if (!f.tags) {
      return false;
    }

    const farr = f.tags.toLowerCase().split(" ");
    for (const t of arr) {
      if (farr.includes(t)) {
        return true;
      }
    }

    return false;
  }))
};


const runPendingFarmOSOperations = async (url, plan) => {
  console.log("running pending ops")

  try {
    const pendingOp = await db
      .collection('farmos.fields')
      .findOne({ url: url });

    if (!pendingOp) {
      return; // success, no pending ops
    }

    const { fields, aggregator } = pendingOp;
    const ag = await db
      .collection('integrations.groups')
      .findOne({ _id: new ObjectId(aggregator), type: 'farmos-aggregator' });

    const apiKey = ag.data.apiKey;
    if (!apiKey) {
      throw new Error('api key missing for aggregator ' + ag._id);
    }


    for (const field of fields) {
      try {
        await createFieldRequest(ag, apiKey, `${url}`, field.name, field.wkt)
        db.collection("farmos.webhookrequests").insertOne({
          url,
          plan,
          created: new Date(),
          state: "success",
          message: `created field ${field.name} for ${url}`,
        })
      } catch (error) {
        db.collection("farmos.webhookrequests").insertOne({
          url,
          plan,
          created: new Date(),
          state: "failed-field",
          message: error.message,
        })
      }
    }
  } catch (error) {
    console.log("error");
    db.collection("farmos.webhookrequests").insertOne({
      url,
      plan,
      created: new Date(),
      state: "failed",
      message: error.message,
    })
  }

  // finally delete all entries with url
  await db.collection('farmos.fields').deleteMany({ url });
}

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

    if (!url) {
      throw boom.badRequest("url is missing")
    }

    if (!plan) {
      throw boom.badRequest("plan is missing")
    }


    db.collection("farmos.webhookrequests").insertOne({
      url,
      plan,
      created: new Date()
    })

    await runPendingFarmOSOperations(url, plan);

    return res.send({
      status: "success"
    })


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
  const aggregator = req.body.data;

  if (!aggregator.url) {
    throw boom.badRequest("argument url missing")
  }

  if (!aggregator.apiKey) {
    throw boom.badRequest("argument apiKey missing")
  }

  try {
    await farmosService.testAggregatorConnection(aggregator.url, aggregator.apiKey);

    if (aggregator.planName && aggregator.planKey) {
      try {
        await farmosService.isFarmosUrlAvailable("oursci", aggregator.planKey);
        return res.send({
          status: "success"
        })
      } catch (error) {
        console.log("inner error", error);
        return res.send({
          status: "error",
          message: "plan key unauthorized"
        })
      }
    }
    return res.send({
      status: "success"
    })
  } catch (error) {
    console.log("outer error", error);
    res.send({
      status: "error",
      message: error.message
    })
  }
}

const buildMembersByFarmAndGroupPipeline = (farmUrl, aggregator, group) => {
  return [
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


  const pipeline = buildMembersByFarmAndGroupPipeline(farmUrl, aggregator, group)

  const entities = await db
    .collection('integrations.memberships')
    .aggregate(pipeline)
    .toArray();

  return res.send(entities);
};

const setFarmMemberships = async (req, res) => {
  const { memberships, group, farmUrl, farmId, aggregator } = req.body

  if (!group) {
    throw boom.badRequest("missing group")
  }

  const access = await rolesService.hasAdminRole(res.locals.auth.user._id, group);
  if (!access) {
    throw boom.unauthorized("permission denied: not group admin")
  }

  if (!farmUrl || !farmId || !aggregator) {
    throw boom.badRequest("parameter missing (farmUrl || farmId || aggregator)")
  }

  if (!memberships || !Array.isArray(memberships)) {
    throw boom.badRequest("memberships must be an array of strings")
  }

  const r = /^[a-f\d]{24}$/
  if (!memberships.every(m => typeof m === "string") || !memberships.every(m => r.test(m))) {
    throw boom.badRequest("memberships must be an array of ObjectId")
  }

  // clear all membership integrations of farm,aggregator in group
  const pipeline = buildMembersByFarmAndGroupPipeline(farmUrl, aggregator, group)


  const entities = await db
    .collection('integrations.memberships')
    .aggregate(pipeline)
    .toArray()

  const toDelete = entities.map(e => new ObjectId(e._id))
  console.log("deleting", toDelete)

  const delRes = await db.collection('integrations.memberships').deleteMany({
    _id: {
      $in: toDelete
    }
  })

  if (!delRes.ok === 1) {
    throw boom.internal("error updating memberships, delete entries failed")
  }

  const toInsert = memberships.map(m => ({
    name: farmUrl,
    membership: new ObjectId(m),
    type: "farmos-farm",
    data: {
      name: farmUrl,
      url: farmUrl,
      aggregator: new ObjectId(aggregator),
      farm: farmId
    }

  }))
  // add all new integrations for farm,aggregator in group for membership
  const created = await db.collection('integrations.memberships').insertMany(toInsert)
  res.send(created)
}

const checkUrl = async (req, res) => {
  console.log("checking url");

  const { url, apiKey } = req.body;

  if (!url || !apiKey) {
    throw boom.badRequest("missing url or apikey");
  }

  try {
    return res.send({
      status: await farmosService.isFarmosUrlAvailable(url, apiKey) ? "free" : "taken"
    })

  } catch (error) {
    return res.send({
      status: "error",
      message: error.message
    })
  }
}

const createFarmOsInstance = async (req, res) => {

  console.log("creating farmos instance", req.body)


  const nameRule = s => !/[!"#$%()*+,\-./:;<=>?@[\\\]^_{|}~]/gi.test(`${s}`);
  const validEmail = (e) => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(e + '')



  const { url, email, site_name, registrant, location, units, plan, apiKey, group, fields, aggregator } = req.body;

  if (!nameRule(site_name)) {
    throw boom.badData("site_name contains invalid characters")
  }

  if (!nameRule(registrant)) {
    throw boom.badData("registrant contains invalid characters")
  }

  if (!validEmail(email)) {
    throw boom.badData("invalid email address")
  }

  const access = await rolesService.hasAdminRole(res.locals.auth.user._id, group);
  if (!access) {
    throw boom.unauthorized("permission denied: not group admin")
  }

  const groupId = typeof group === 'string' ? new ObjectId(group) : group;
  const groupEntity = await db.collection('groups').findOne({ _id: groupId });
  const { path: groupPath } = groupEntity;

  console.log("groupPath", groupEntity, groupPath)


  const agentOptions = {
    host: "account.farmos.net",
    port: '443',
    path: '/',
    rejectUnauthorized: false,
  };

  const agent = new https.Agent(agentOptions);
  const body = {
    url: `${url}.farmos.net`,
    email,
    site_name,
    registrant,
    location,
    units,
    plan,
    tags: [groupPath],
    agree: true,
  }

  console.log("body for request", body)

  try {
    const r = await axios.post(
      `https://account.farmos.net/api/v1/farms`,
      body,
      {
        headers: {
          accept: 'application/json',
          apikey: apiKey
        },
        httpsAgent: agent,
      }
    );

    // TODO add farmos instance to "pending" list
    db.collection("farmos.fields").insertOne({
      url: `${url}.farmos.net`,
      created: new Date(),
      fields,
      aggregator,
    })


    res.send({
      "status": "success",
      response: r.data
    })
  } catch (error) {
    return res.send({
      status: "error",
      message: error.message
    })
  }
}

export default {
  getFields,
  getAreas,
  getAssets,
  getIntegrationFarms,
  webhookCallback,
  testConnection,
  getMembersByFarmAndGroup,
  setFarmMemberships,
  checkUrl,
  createFarmOsInstance,
  createField,
  getFarms,
};
