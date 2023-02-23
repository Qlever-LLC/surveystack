import { db } from '../db';
import { ObjectId } from 'mongodb';
import Joi from 'joi';
import joiObjectId from 'joi-objectid';
Joi.objectId = joiObjectId(Joi);

import isString from 'lodash/isString';
import uniq from 'lodash/uniq';
import boom from '@hapi/boom';
import { isFarmosUrlAvailable, createInstance } from '../services/farmos.service';
import {
  listFarmOSInstancesForUser,
  getSuperAllFarmosMappings,
  addFarmToSurveystackGroupAndSendNotification,
  removeFarmFromSurveystackGroupAndSendNotification,
  removeFarmFromUser,
  getPlans as manageGetPlans,
  getPlanForGroup as manageGetPlanForGroup,
  createPlan as manageCreatePlan,
  deletePlan as manageDeletePlan,
  mapFarmOSInstanceToUser,
  getGroupInformation,
  enableCoffeeshop,
  disableCoffeeshop,
  enableSubgroupsToJoinCoffeeShop,
  disableSubgroupsToJoinCoffeeShop,
  enableSubgroupsAllowCreateInstances,
  disableSubgroupsAllowCreateInstances,
  getTreeFromGroupId,
  getTree,
} from '../services/farmos/manage';
import { aggregator } from '../services/farmos/aggregator';
import { hasAdminRole } from '../services/roles.service';

export const asMongoId = (source) =>
  source instanceof ObjectId ? source : ObjectId(typeof source === 'string' ? source : source._id);

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

const stringify = (json) => {
  return JSON.stringify(json, getCircularReplacer());
};

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

const requireGroupedAdmin = (req, res) => {
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
 * Validate that the groupId has groupSettings with enabled
 * farmos
 *
 * @param {*} req
 * @param {*} res
 */
const requireFarmOSManageAdmin = async (req, optJoi = {}) => {
  const apiKey = process.env.FARMOS_CREATE_KEY;
  if (!apiKey) {
    throw boom.badImplementation('farmos not configured');
  }

  let schema = Joi.objectId().required();
  const { groupId } = req.params;

  schema = Joi.object({
    groupId: Joi.objectId().required(),
    ...optJoi,
  });

  const validres = schema.validate(
    {
      ...req.body,
      groupId,
    },
    { allowUnknown: true }
  );

  if (validres.error) {
    const errors = validres.error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw boom.badData(`error: ${errors.join(',')}`);
  }

  const groupSetting = await db.collection('farmos-group-settings').findOne({
    groupId: new ObjectId(groupId),
  });

  // TODO could be part of domain

  if (!groupSetting) {
    throw boom.badData('no farmos Settings for group found');
  }

  const keys = Object.keys(req.body)
    .map((a) => {
      if (Object.keys(optJoi).includes(a)) {
        return a;
      } else {
        return null;
      }
    })
    .filter((k) => k != null);

  const r = {};
  for (const key of keys) {
    r[key] = req.body[key];
  }

  return {
    ...r,
    apiKey,
    groupId,
    groupSetting,
  };
};

const requireGroup = async (req, optJoi = {}) => {
  const apiKey = process.env.FARMOS_CREATE_KEY;
  if (!apiKey) {
    throw boom.badImplementation('farmos not configured');
  }

  let schema = Joi.objectId().required();
  const { groupId } = req.params;

  schema = Joi.object({
    groupId: Joi.objectId().required(),
    ...optJoi,
  });

  const validres = schema.validate(
    {
      ...req.body,
      groupId,
    },
    { allowUnknown: true }
  );

  if (validres.error) {
    const errors = validres.error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw boom.badData(`error: ${errors.join(',')}`);
  }
  const group = await db.collection('groups').findOne({ _id: asMongoId(groupId) });

  if (!group) {
    throw boom.notFound();
  }

  const tree = await getTree(group);

  const groupSetting = await db.collection('farmos-group-settings').findOne({
    groupId: tree.domainRoot._id,
  });

  // TODO could be part of domain

  if (!groupSetting) {
    throw boom.badData('no farmos Settings for group found');
  }

  const keys = Object.keys(req.body)
    .map((a) => {
      if (Object.keys(optJoi).includes(a)) {
        return a;
      } else {
        return null;
      }
    })
    .filter((k) => k != null);

  const r = {};
  for (const key of keys) {
    r[key] = req.body[key];
  }

  return {
    ...r,
    apiKey,
    groupId,
    groupSetting,
    tree,
  };
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
  // console.log('userid', userId);

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
    // console.log('bundle', bundle);
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
          location:
            a.relationships && a.relationships.location ? a.relationships.location.data : undefined,
        };
      });
      assets.push(...assetList);
    } catch (error) {
      if (error.data) {
        // console.log(error.data);
        errors.push(error.data);
      } else if (error.message) {
        const msg = `${instance.instanceName}: ${error.message}`;
        console.log(msg);
        errors.push(msg);
      } else {
        console.log(stringify(error));
        errors.push(stringify(error));
      }
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

  await addFarmToSurveystackGroupAndSendNotification(instanceName, group);
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

  await removeFarmFromSurveystackGroupAndSendNotification(instanceName, group);
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

  await mapFarmOSInstanceToUser(user, instanceName, !!owner);
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

  await removeFarmFromUser(instanceName, user);
  return res.send({
    status: 'success',
  });
};

export const superAdminUnMapFarmosInstanceFromAll = async (req, res) => {
  const { instanceName } = req.body;

  if (!instanceName) {
    throw boom.badData('instance name missing');
  }

  await db.collection('farmos-instances').deleteMany({
    instanceName,
  });

  await db.collection('farmos-group-mapping').deleteMany({
    instanceName,
  });

  return res.send({
    status: 'success',
  });
};

/**
 * Return all instances for group with mappings
 */
export const getInstancesForGroup = async (req, res) => {
  const userId = requireUserId(res);
  const groupId = requireGroupedAdmin(req, res);

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
export const changeOwnershipForInstance = async (req, res) => {
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
    console.log('error', error);
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

export const getPlans = async (req, res) => {
  return res.send(await manageGetPlans());
};

export const getPlanForGroup = async (req, res) => {
  let schema = Joi.objectId().required();
  const { groupId } = req.params;

  let validres = schema.validate(groupId);
  if (validres.error) {
    const errors = validres.error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw boom.badData(`error: ${errors.join(',')}`);
  }

  return res.send(await manageGetPlanForGroup(groupId));
};

export const createPlan = async (req, res) => {
  const schema = Joi.object({
    planName: Joi.string().required(),
    planUrl: Joi.string().required(),
  }).required();

  const validres = schema.validate(req.body);
  if (validres.error) {
    const errors = validres.error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw boom.badData(`error: ${errors.join(',')}`);
  }

  await manageCreatePlan(req.body.planName, req.body.planUrl);

  return res.send({
    status: 'success',
  });
};

export const deletePlan = async (req, res) => {
  const schema = Joi.object({
    planId: Joi.objectId().required(),
  }).required();

  const validres = schema.validate(req.body);
  if (validres.error) {
    const errors = validres.error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw boom.badData(`error: ${errors.join(',')}`);
  }

  await manageDeletePlan(req.body.planId);

  return res.send({
    status: 'success',
  });
};

export const updatePlansForGroup = async (req, res) => {
  const { groupSetting, plans } = await requireFarmOSManageAdmin(req, {
    plans: Joi.array().items(Joi.objectId()).required(),
  });

  const availablePlans = await db.collection('farmos-plans').find().toArray();
  const planIds = availablePlans.map((a) => a._id + '');

  if (!plans.every((p) => planIds.includes(p))) {
    throw boom.badData(`some plan ids are not available, ${planIds}, ${plans}`);
  }

  const updatedPlanIds = plans.map((p) => new ObjectId(p));

  const r = await db.collection('farmos-group-settings').updateOne(
    {
      _id: groupSetting._id,
    },
    {
      $set: {
        planIds: updatedPlanIds,
      },
    }
  );

  return res.send({
    status: 'ok',
    // res: r,
  });
};

export const updateSeats = async (req, res) => {
  const { groupSetting, seats } = await requireFarmOSManageAdmin(req, {
    seats: Joi.number().integer().min(0).max(10000).required(),
  });

  const r = await db.collection('farmos-group-settings').updateOne(
    {
      _id: groupSetting._id,
    },
    {
      $set: {
        maxSeats: seats,
      },
    }
  );

  return res.send({
    status: 'ok',
    // res: r,
  });
};

export const checkUrl = async (req, res) => {
  const apiKey = process.env.FARMOS_CREATE_KEY;
  if (!apiKey) {
    throw boom.badImplementation('farmos not configured');
  }

  const { url } = req.body;
  if (!url) {
    throw boom.badRequest('missing url');
  }

  try {
    return res.send({
      status: (await isFarmosUrlAvailable(url, apiKey)) ? 'free' : 'taken',
    });
  } catch (error) {
    return res.send({
      status: 'error',
      message: error.message,
    });
  }
};

export const groupManageCheckUrl = async (req, res) => {
  const { groupSetting, planId, instanceName, url, apiKey } = await requireGroup(req, {
    planId: Joi.objectId().required(),
    instanceName: Joi.string().required(),
    url: Joi.string().required(),
  });

  const planIds = groupSetting.planIds.map((p) => p + '');
  if (!planIds.includes(planId)) {
    throw boom.badData('planId not mapped to group');
  }

  const plan = await db.collection('farmos-plans').findOne({ _id: new ObjectId(planId) });

  if (!plan) {
    throw boom.badData('plan not found');
  }

  const { planUrl } = plan;

  if (url !== `${instanceName}.${planUrl}`) {
    throw boom.badData(`url does not match ${url}, ${instanceName}.${planUrl}`);
  }

  try {
    return res.send({
      status: (await isFarmosUrlAvailable(url, apiKey)) ? 'free' : 'taken',
    });
  } catch (error) {
    return res.send({
      status: 'error',
      message: error.message,
    });
  }
};

export const superAdminCreateFarmOsInstance = async (req, res) => {
  const schema = Joi.object({
    groupId: Joi.string().required(),
    url: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    farmName: Joi.string().required(),
    fullName: Joi.string().required(),
    farmAddress: Joi.string().required(),
    units: Joi.string().required(),
    timezone: Joi.string().required(),
    planName: Joi.string().required(),
    owner: Joi.string().required(),
    agree: Joi.boolean().valid(true),
    fields: Joi.array()
      .items(Joi.object({ name: Joi.string().required(), wkt: Joi.string().required() }))
      .required(),
  }).required();

  const validres = schema.validate(req.body);
  if (validres.error) {
    const errors = validres.error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    return res.send({
      errors,
    });
  }

  const {
    groupId: group,
    url,
    email,
    farmName: site_name,
    fullName: registrant,
    farmAddress: location,
    units,
    timezone,
    planName,
    fields,
    owner,
  } = req.body;
  const groupId = asMongoId(group);
  const groupEntity = await db.collection('groups').findOne({ _id: groupId });
  if (!groupEntity || !groupEntity.path) {
    throw boom.badData('unable to find group');
  }

  const userId = asMongoId(owner);
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) {
    throw boom.badData('owner not found');
  }

  const { path: groupPath } = groupEntity;
  // also add instances to users
  // console.log('groupPath', groupPath);

  try {
    const r = await createInstance(
      url,
      email,
      site_name,
      registrant,
      location,
      units,
      [groupPath],
      timezone,
      planName
    );

    await mapFarmOSInstanceToUser(owner, url, true);

    await addFarmToSurveystackGroupAndSendNotification(url, groupId);

    await db.collection('farmos.fields').insertOne({
      url,
      created: new Date(),
      fields,
    });

    res.send({
      status: 'success',
      response: r.data,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: 'error',
      message: error.response.data,
    });
  }
};

export const groupManageCreateFarmOsInstance = async (req, res) => {
  const { groupSetting, url, planId, groupId } = await requireGroup(req, {
    url: Joi.string().max(100).required(),
    planId: Joi.objectId().required(),
  });

  if (!groupSetting.planIds.map((p) => p + '').includes(planId)) {
    throw boom.badData(`plan not included in group: ${planId}`);
  }

  const plan = await db.collection('farmos-plans').findOne({ _id: new ObjectId(planId) });
  if (!plan) {
    throw boom.badData(`unable to find plan: ${planId}`);
  }

  if (!url.endsWith(plan.planUrl)) {
    throw boom.badData(`url needs to end with ${plan.planUrl}: ${url}`);
  }

  const { groupId: bodyGroupId } = req.body;

  if (groupId !== bodyGroupId) {
    throw boom.badData(`groupIds do not match: ${groupId}, ${bodyGroupId}`);
  }

  delete req.body.planId;

  return await superAdminCreateFarmOsInstance(req, res);
};

export const getDomain = async (req, res) => {
  const schema = Joi.objectId().required();
  const { groupId } = req.params;
  const validres = schema.validate(groupId);
  if (validres.error) {
    const errors = validres.error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw boom.badData(`error: ${errors.join(',')}`);
  }

  const tree = await getTreeFromGroupId(groupId);

  return res.send({
    domain: tree.domainRoot,
    canBecomeRoot: tree.canBecomeRoot(),
    isDomainRootInDescendants: tree.isDomainRooInDescendants(),
  });
};

export const groupAdminMinimumGetGroupInformation = async (req, res) => {
  const groupId = asMongoId(req.params.groupId);
  const group = await db.collection('groups').findOne({ _id: groupId });
  if (!group) {
    // group not found, boom!
    throw boom.notFound(`No group found: ${groupId}`);
  }

  const r = await getGroupInformation(groupId, res.locals.auth.isSuperAdmin);
  return res.send({
    status: 'success',
    response: r,
  });
};

export const superAdminUpdateFarmOSAccess = async (req, res) => {
  const schema = Joi.object({
    groupId: Joi.objectId().required(),
    enable: Joi.boolean().required(),
  });

  const validres = schema.validate(req.body);
  if (validres.error) {
    const errors = validres.error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw boom.badData(`error: ${errors.join(',')}`);
  }

  const { groupId, enable } = req.body;

  const tree = await getTreeFromGroupId(groupId);

  if (enable) {
    if (tree.canBecomeRoot()) {
      await tree.enableFarmOS();
    }
  } else {
    await tree.disableFarmOS();
  }

  return res.send({
    status: 'success',
  });
};

export const groupManageCreateInstance = async () => {};

export const groupAdminAllowGroupsToJoinCoffeeshop = async (req, res) => {
  const { groupId, updateTo } = await requireFarmOSManageAdmin(req, {
    updateTo: Joi.boolean().required(),
  });

  if (updateTo) {
    await enableSubgroupsToJoinCoffeeShop(groupId);
  } else {
    await disableSubgroupsToJoinCoffeeShop(groupId);
  }
  return res.send({
    status: 'success',
  });
};

export const groupAdminJoinCoffeeShop = async (req, res) => {
  const { groupId, updateTo } = await requireGroup(req, {
    updateTo: Joi.boolean().required(),
  });

  if (updateTo) {
    await enableCoffeeshop(groupId);
  } else {
    await disableCoffeeshop(groupId);
  }
  return res.send({
    status: 'success',
  });
};

export const groupAdminMinimumUpdateCreateFarmOSInstances = async (req, res) => {
  const { groupId, updateTo } = await requireFarmOSManageAdmin(req, {
    updateTo: Joi.boolean().required(),
  });

  if (updateTo) {
    await enableSubgroupsAllowCreateInstances(groupId);
  } else {
    await disableSubgroupsAllowCreateInstances(groupId);
  }
  return res.send({
    status: 'success',
  });
};

export const mapUser = async (req, res) => {
  const { groupId, userId, instanceName } = await requireGroup(req, {
    userId: Joi.objectId().required(),
    instanceName: Joi.string().required(),
  });

  const userRes = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  if (!userRes) {
    throw boom.notFound(`user with id: ${userId} not found`);
  }

  const memberships = await db
    .collection('memberships')
    .find({
      group: new ObjectId(groupId),
      user: userRes._id,
    })
    .toArray();

  if (memberships.length <= 0) {
    throw boom.badData(`user not member of group: user, group: ${userId}, ${groupId}`);
  }

  // if instance not mapped to group, map to group
  // if instance not mapped to user, map to user

  const groupInstances = await db
    .collection('farmos-group-mapping')
    .find({
      groupId: new ObjectId(groupId),
    })
    .toArray();

  let mapToGroup = true;
  if (groupInstances.map((g) => g.instanceName).includes(instanceName)) {
    mapToGroup = false;
  }

  let mapToUser = false;

  const userMappings = await db
    .collection('farmos-instances')
    .find({
      userId: new ObjectId(userId),
      instanceName,
      owner: true,
    })
    .toArray();

  if (userMappings.length == 0) {
    mapToUser = true;
  }

  if (mapToGroup) {
    await db.collection('farmos-group-mapping').insertOne({
      _id: new ObjectId(),
      groupId: new ObjectId(groupId),
      instanceName,
    });
  }

  if (mapToUser) {
    await db.collection('farmos-instances').insertOne({
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      instanceName,
      owner: true,
    });
  }

  return res.send({
    status: 'ok',
  });
};

const assertUserInGroup = async (userId, groupId) => {
  const userRes = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  if (!userRes) {
    throw boom.notFound(`user with id: ${userId} not found`);
  }

  const memberships = await db
    .collection('memberships')
    .find({
      group: new ObjectId(groupId),
      user: userRes._id,
    })
    .toArray();

  if (memberships.length <= 0) {
    throw boom.badData(`user not member of group: user, group: ${userId}, ${groupId}`);
  }
};

const assertUserInSubGroup = async (userId, tree) => {
  const userRes = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  if (!userRes) {
    throw boom.notFound(`user with id: ${userId} not found`);
  }

  const memberships = await db
    .collection('memberships')
    .find({
      group: {
        $in: tree.descendants.map((d) => new ObjectId(d._id)),
      },
      user: userRes._id,
    })
    .toArray();

  if (memberships.length <= 0) {
    throw boom.badData(`user not member of farmos domain`);
  }
};

const assertGroupsInTree = async (groupIds, tree) => {
  // do we have permission to manage unmapping these groups?
  // are we top-level admin and are these groups in the farmos domain?

  // console.log('descendants', tree.descendants);
  const unauthorized = groupIds.filter(
    (gid) => !tree.descendants.map((d) => d._id).some((id) => id + '' === gid)
  );

  if (unauthorized.length > 0) {
    const groups = (
      await db
        .collection('groups')
        .find({
          _id: {
            $in: unauthorized.map((gid) => new ObjectId(gid)),
          },
        })
        .toArray()
    ).map((g) => g.name);
    throw boom.unauthorized(`unauthorized to manage groups: ${groups.join(',')}`);
  }
};

export const updateGroupsForUser = async (req, res) => {
  const { userId, instanceName, groupIds, tree } = await requireGroup(req, {
    userId: Joi.objectId().required(),
    instanceName: Joi.string().required(),
    groupIds: Joi.array().items(Joi.objectId()).required(),
  });

  await assertUserInSubGroup(userId, tree);
  await assertGroupsInTree(groupIds, tree);

  // clear all mappings of groups in descendants

  await db.collection('farmos-group-mapping').deleteMany({
    groupId: {
      $in: tree.descendants.map((d) => d._id),
    },
    instanceName,
  });

  // add all

  if (groupIds.length > 0) {
    await db.collection('farmos-group-mapping').insertMany(
      groupIds.map((gid) => ({
        _id: new ObjectId(),
        groupId: new ObjectId(gid),
        instanceName,
      }))
    );
  }

  return res.send({
    status: 'ok',
  });
};

const assertFarmMappedToUser = async (instanceName, userId) => {
  const res = await db.collection('farmos-instances').findOne({
    userId: new ObjectId(userId),
    instanceName,
  });

  if (!res) {
    throw boom.unauthorized(`user has no mapping to farm ${instanceName}`);
  }
};

const assertFarmInSubGroup = async (instanceName, tree) => {
  const res = await db.collection('farmos-group-mapping').findOne({
    instanceName,
    groupId: {
      $in: tree.descendants.map((d) => new ObjectId(d._id)),
    },
  });

  if (!res) {
    throw boom.unauthorized(`farm not mapped to group`);
  }
};

export const removeMembershipHook = async (membership) => {
  const { user: userId, group: groupId } = membership;

  // eslint-disable-next-line no-unreachable
  const userMappings = await db
    .collection('farmos-instances')
    .find({
      userId: asMongoId(userId),
    })
    .toArray();

  if (userMappings.length <= 0) {
    return;
  }

  // quick check if there is at all an instance that is mapped to a group
  // and early exit if not
  const affectedGroupMappings = await db
    .collection('farmos-group-mapping')
    .find({
      instanceName: {
        $in: userMappings.map((f) => f.instanceName),
      },
    })
    .toArray();

  if (affectedGroupMappings.length <= 0) {
    // nothing affected
    return;
  }

  const group = await db.collection('groups').findOne({ _id: asMongoId(groupId) });
  if (!group) {
    // this should never happen here because it's a hook and params are checked before calling
    throw boom.notFound();
  }

  try {
    const groupInformation = await getGroupInformation(asMongoId(groupId));
    const othersInstances = [];

    for (const member of groupInformation.members) {
      if (member.user + '' == userId + '') {
        // ignore self
        continue;
      }

      // connected farms to the member that are mapped to a group within the farmos domain
      // hence f.groups.length > 0
      const memberFarms = member.connectedFarms
        .filter((f) => f.groups.length > 0)
        .map((f) => f.instanceName);

      othersInstances.push(...memberFarms);
    }

    const instances = uniq(othersInstances);

    const memberInfo = groupInformation.members.find((m) => m.user + '' == userId + '');
    if (!memberInfo) {
      return;
    }

    const connectedFarmsToCheck = memberInfo.connectedFarms.filter((f) => f.groups.length > 0);
    const toDelete = connectedFarmsToCheck.filter((f) => !instances.includes(f.instanceName));

    const results = [];
    for (const connectedFarm of toDelete) {
      const res = await db.collection('farmos-group-mapping').deleteMany({
        instanceName: connectedFarm.instanceName,
        groupId: {
          $in: connectedFarm.groups.map((g) => asMongoId(g.groupId)),
        },
      });
      results.push(res.result.ok);
    }
  } catch (error) {
    console.log('error', error);
    return;
  }
};

export const getAdminLink = async (req, res) => {
  const { userId, instanceName, tree } = await requireGroup(req, {
    userId: Joi.objectId().required(),
    instanceName: Joi.string().required(),
  });

  await assertUserInSubGroup(userId, tree);
  await assertFarmInSubGroup(instanceName, tree);
  await assertFarmMappedToUser(instanceName, userId);

  const { getAdminLink } = config();
  const link = await getAdminLink(instanceName);

  return res.send(link);
};

export const testConnection = async (req, res) => {
  /**
   * TODO migrate Testconnection
   */
  /* 
  const aggregator = req.body.data;

  if (!aggregator.url) {
    throw boom.badRequest('argument url missing');
  }

  if (!aggregator.apiKey) {
    throw boom.badRequest('argument apiKey missing');
  }

  try {
    await farmosService.testAggregatorConnection(aggregator.url, aggregator.apiKey);

    if (aggregator.planName && aggregator.planKey) {
      try {
        await farmosService.isFarmosUrlAvailable('oursci', aggregator.planKey);
        return res.send({
          status: 'success',
        });
      } catch (error) {
        console.log('inner error', error);
        return res.send({
          status: 'error',
          message: 'plan key unauthorized',
        });
      }
    }
    return res.send({
      status: 'success',
    });
  } catch (error) {
    console.log('outer error', error);
    res.send({
      status: 'error',
      message: error.message,
    });
  } */
};
