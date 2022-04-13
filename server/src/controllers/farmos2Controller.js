import { db } from '../db';
import { ObjectId } from 'mongodb';

import _, { isString } from 'lodash';
import axios from 'axios';
import boom from '@hapi/boom';
import https from 'https';
import { getRoles, hasAdminRole } from '../services/roles.service';
import {
  listFarmOSInstancesForUser,
  getSuperAllFarmosMappings,
  addFarmToSurveystackGroup,
  removeFarmFromSurveystackGroup,
  addFarmToUser,
  removeFarmFromUser,
} from '../services/farmos-2/manage';
import { aggregator } from '../services/farmos-2/aggregator';

const config = () => {
  if (!process.env.FARMOS_AGGREGATOR_URL || !process.env.FARMOS_AGGREGATOR_APIKEY) {
    console.log('env not set');
    return;
  }

  return aggregator(process.env.FARMOS_AGGREGATOR_URL, process.env.FARMOS_AGGREGATOR_APIKEY);
};

const requireUserId = (res) => {
  const userId = res.locals.auth.user._id;

  if (!userId) {
    throw boom.unauthorized();
  }
  return userId;
};

const requireGroupdAdmin = (req, res) => {
  const { group } = req.body;
  const userId = res.locals.auth.user._id;

  if (!userId) {
    throw boom.unauthorized();
  }

  if (!group) {
    throw boom.unauthorized();
  }

  if (!hasAdminRole(userId, group)) {
    throw boom.unauthorized();
  }
  return userId;
};

/**
 *
 * Return a list of farmos instances associated with user
 *
 */
export const getFarmOSInstances = async (req, res) => {
  /**
   * A flat list of instances the user has access to for the farm question type
   */

  const userId = requireUserId(res);
  console.log('userid', userId);

  const r = await listFarmOSInstancesForUser(userId);

  return res.send(r);
};
/**
 *
 *
 * get a list of assets (fields, plantings, etc.)
 */
export const getAssets = async (req, res) => {
  const userId = requireUserId(res);

  /**
   * A list of assets the user has access to for the farm question type
   * include instance url for each asset
   */

  const allowedBundles = ['plant', 'location', 'equipment', 'land'];

  const { bundle } = req.query;

  if (!bundle || !isString(bundle)) {
    console.log('bundle', bundle);
    throw boom.badData("argument 'bundle' not valid");
  }

  if (!allowedBundles.includes(bundle)) {
    throw boom.badData(`unknown bundle: ${bundle}`);
  }

  const instances = await listFarmOSInstancesForUser(userId);

  const cfg = config();

  const assets = [];
  const errors = [];
  for (const instance of instances) {
    try {
      const axiosResponse = await cfg.getAssets(instance.instanceName, bundle);

      const assetList = axiosResponse.data.data.map((a) => {
        return {
          name: a.attributes.name,
          id: a.id,
          instanceName: instance.instanceName,
          archived: a.attributes.archived,
          location: a.relationships.location.data,
        };
      });
      assets.push(...assetList);
    } catch (error) {
      console.log(error);
      errors.push(error);
    }
  }

  return res.send({
    assets,
    errors,
  });
};

/**
 * get list of logs
 */
export const getLogs = async (req, res) => {
  /**
   * A list of logs the user has access to
   * include instance url for each log
   */

  const userId = res.locals.auth.user._id;
  if (!userId) {
    throw boom.forbidden('not signed in');
  }

  const { bundle } = req.body;

  if (!bundle || !isString(bundle)) {
    throw boom.badData("argument 'bundle' not valid");
  }

  const instances = await listFarmOSInstancesForUser(userId);
  const cfg = config();

  const assets = [];
  const errors = [];
  for (const instance of instances) {
    try {
      const axiosResponse = await cfg.getLogs(instance.instanceName, bundle);
      const assetList = axiosResponse.data.data.map((a) => {
        return {
          name: a.attributes.name,
          id: a.id,
          instance: instance.instanceName,
        };
      });
      assets.push(...assetList);
    } catch (error) {
      errors.push(error);
    }
  }

  return res.send({
    assets,
    errors,
  });
};

export const superAdminGetAllInstances = async (req, res) => {
  const r = await getSuperAllFarmosMappings();
  return res.send(r);
};

export const superAdminMapFarmosInstance = async (req, res) => {
  const { group } = req.body;
  if (!group) {
    throw boom.badData('group missing');
  }

  const { instanceName } = req.body;
  if (!instanceName) {
    throw boom.badData('instance name missing');
  }

  await addFarmToSurveystackGroup(instanceName, group);
  return res.send({
    status: 'success',
  });
};

export const superAdminUnMapFarmosInstance = async (req, res) => {
  const { group, instanceName } = req.body;
  if (!group) {
    throw boom.badData('group missing');
  }

  if (!instanceName) {
    throw boom.badData('instance name missing');
  }

  await removeFarmFromSurveystackGroup(instanceName, group);
  return res.send({
    status: 'success',
  });
};

export const superAdminMapFarmosInstanceToUser = async (req, res) => {
  const { user, group, owner, instanceName } = req.body;
  if (!user) {
    throw boom.badData('user missing');
  }

  if (!instanceName) {
    throw boom.badData('instance name missing');
  }

  if (typeof owner == undefined) {
    throw boom.badData('owner attribute missing');
  }

  await addFarmToUser(instanceName, user, group, !!owner);
  return res.send({
    status: 'success',
  });
};

export const superAdminUnMapFarmosInstanceFromUser = async (req, res) => {
  const { user, group, instanceName } = req.body;
  if (!user) {
    throw boom.badData('user missing');
  }

  if (!instanceName) {
    throw boom.badData('instance name missing');
  }

  await removeFarmFromUser(instanceName, user, group);
  return res.send({
    status: 'success',
  });
};

/**
 * Return all instances for group with mappings
 */
export const getInstancesForGroup = async (req, res) => {
  const userId = requireUserId(res);
  const groupId = requireGroupdAdmin(req, res);

  return res.send([]);
};

/**
 * get list of farms that are connectable to users of group
 */
export const getConnectableFarmsForGroup = async (req, res) => {
  /**
   * 1. only admins can do this, they pass a user from a group or subgroup
   * 2. get tagged farms from aggregator for this group and its subgroups
   */
};

/**
 * update mapped instances for group
 */
export const updateInstancesForGroup = async (req, res) => {
  return res.send([]);
};

/**
 * get list of instances for user, including who has access to them
 */
export const getInstancesForUser = async (req, res) => {
  /**
   * 1. For this user list all instances that the user has access to
   * 2. indicate if owner or not
   * 3. list groups with access to the farm if owner
   * 4. list other users with access to the farm
   */
  return res.send([]);
};

/**
 * add / remove instance from user
 */
export const updateInstancesForUser = async (req, res) => {
  return res.send([]);
};

/**
 * change ownership of an instance
 */
export const changeOwnershipForInstace = async (req, res) => {
  return res.send([]);
};

/**
 * Super Admin can map instance to any user
 */
export const assignFarmOSInstanceToUser = async (req, res) => {
  return res.send([]);
};

const runPendingFarmOSOperations = async (url, plan) => {
  try {
    const pendingOp = await db.collection('farmos.fields').findOne({ url: url });

    if (!pendingOp) {
      return; // success, no pending ops
    }

    const { fields } = pendingOp;

    for (const field of fields) {
      try {
        const { create } = config();

        const payload = {
          data: {
            type: 'asset--land',
            attributes: {
              name: field.name,
              status: 'active',
              intrinsic_geometry: {
                value: field.wkt,
              },
              land_type: 'field',
            },
          },
        };
        const response = await create(url, 'asset', 'land', payload);
        db.collection('farmos.webhookrequests').insertOne({
          url,
          plan,
          created: new Date(),
          state: 'success',
          message: `created field ${field.name} with id ${response.data.id} for ${url}`,
        });
      } catch (error) {
        db.collection('farmos.webhookrequests').insertOne({
          url,
          plan,
          created: new Date(),
          state: 'failed-field',
          message: error.message,
        });
      }
    }
  } catch (error) {
    console.log('error');
    db.collection('farmos.webhookrequests').insertOne({
      url,
      plan,
      created: new Date(),
      state: 'failed',
      message: error.message,
    });
  }

  // finally delete all entries with url
  await db.collection('farmos.fields').deleteMany({ url });
};

export const webhookCallback = async (req, res, next) => {
  try {
    const { key } = req.query;

    //console.log("req", req)
    if (!key) {
      throw boom.unauthorized('key missing');
    }

    if (!process.env.FARMOS_CALLBACK_KEY) {
      throw boom.badRequest('server does not support farmos webhooks');
    }

    if (key !== process.env.FARMOS_CALLBACK_KEY) {
      throw boom.unauthorized('unauthorized');
    }

    const { url, plan, status } = req.body;

    if (status !== 'ready') {
      throw boom.badRequest('expecting status ready');
    }

    if (!url) {
      throw boom.badRequest('url is missing');
    }

    if (!plan) {
      throw boom.badRequest('plan is missing');
    }

    db.collection('farmos.webhookrequests').insertOne({
      url,
      plan,
      created: new Date(),
    });

    await runPendingFarmOSOperations(url, plan);

    return res.send({
      status: 'success',
    });
  } catch (error) {
    console.log('error', error);
    if (boom.isBoom(error)) {
      return next(error);
    } else {
      return res.send({
        status: 'error',
      });
    }
  }
};

export const createFarmOsInstance = async (req, res) => {
  console.log('creating farmos instance', req.body);

  const nameRule = (s) => !/[!"#$%()*+,\-./:;<=>?@[\\\]^_{|}~]/gi.test(`${s}`);
  const validEmail = (e) =>
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      e + ''
    );

  const apiKey = process.env.FARMOS_CREATE_KEY;

  const { url, email, site_name, registrant, location, units, group, fields, timezone, planName } =
    req.body;

  if (!nameRule(site_name)) {
    throw boom.badData('site_name contains invalid characters');
  }

  if (!nameRule(registrant)) {
    throw boom.badData('registrant contains invalid characters');
  }

  if (!validEmail(email)) {
    throw boom.badData('invalid email address');
  }

  if (!planName) {
    throw boom.badData('plan name missing');
  }

  const access = await hasAdminRole(res.locals.auth.user._id, group);
  if (!access) {
    throw boom.unauthorized('permission denied: not group admin');
  }

  const groupId = typeof group === 'string' ? new ObjectId(group) : group;
  const groupEntity = await db.collection('groups').findOne({ _id: groupId });
  const { path: groupPath } = groupEntity;

  console.log('groupPath', groupEntity, groupPath);

  const agentOptions = {
    host: 'account.farmos.net',
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
    plan: planName,
    tags: [groupPath],
    agree: true,
    timezone: timezone,
  };

  console.log('body for request', body);

  // also add instances to users

  try {
    const r = await axios.post(`https://account.farmos.net/api/v1/farms`, body, {
      headers: {
        accept: 'application/json',
        apikey: apiKey,
      },
      httpsAgent: agent,
    });

    db.collection('farmos.fields').insertOne({
      url: `${url}.farmos.net`,
      created: new Date(),
      fields,
    });

    res.send({
      status: 'success',
      response: r.data,
    });
  } catch (error) {
    return res.send({
      status: 'error',
      message: error.message,
    });
  }
};
