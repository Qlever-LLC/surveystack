import { db } from '../db';
import { ObjectId } from 'mongodb';

import _, { isString } from 'lodash';
import axios from 'axios';
import boom from '@hapi/boom';
import https from 'https';
import { getRoles } from '../services/roles.service';
import { listFarmOSInstancesForUser } from '../services/farmos-2/manage';
import { aggregator } from '../services/farmos-2/aggregator';

const config = () => {
  if (!process.env.FARMOS_AGGREGATOR_URL || !process.env.FARMOS_AGGREGATOR_APIKEY) {
    console.log('env not set');
    return;
  }

  return aggregator(process.env.FARMOS_AGGREGATOR_URL, process.env.FARMOS_AGGREGATOR_APIKEY);
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

  const userId = res.locals.auth.user._id;
  if (!userId) {
    throw boom.unauthorized();
  }

  const r = await listFarmOSInstancesForUser(userId);

  return res.send(r);
};

/**
 *
 *
 * get a list of assets (fields, plantings, etc.)
 */
export const getAssets = async (req, res) => {
  /**
   * A list of assets the user has access to for the farm question type
   * include instance url for each asset
   */

  const allowedBundles = ['plant', 'location', 'equipment'];

  const userId = res.locals.auth.user._id;
  if (!userId) {
    throw boom.forbidden('not signed in');
  }

  const { bundle } = req.body;

  if (!bundle || !isString(bundle)) {
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
      const axiosResponse = await cfg.getAssets(instance.farmOSInstanceName, bundle);
      const assetList = axiosResponse.data.data.map((a) => {
        return {
          name: a.attributes.name,
          id: a.id,
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

/**
 * get list of logs
 */
export const getLogs = async (req, res) => {
  /**
   * A list of logs the user has access to
   * include instance url for each log
   */
  return res.send([]);
};

/**
 * Return all instances for group with mappings
 */
export const getInstancesForGroup = async (req, res) => {
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
