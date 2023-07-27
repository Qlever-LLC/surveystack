import { db } from '../../db';
import { ObjectId } from 'mongodb';

import axios from 'axios';
import boom from '@hapi/boom';
import https from 'https';

/**
 * Does user have permission to push to instance?
 */
export const hasPermission = async (userId, instanceName) => {
  if (!userId) {
    return false;
  }

  if (!instanceName) {
    return false;
  }

  const adminOfGroups = (
    await db
      .collection('memberships')
      .find({
        user: userId,
        role: 'admin',
      })
      .toArray()
  ).map((a) => a.group + '');

  const mappedInstances = await db
    .collection('farmos-instances')
    .find({
      userId,
      instanceName,
    })
    .toArray();

  const allowedInstances = {};

  const groupMappings = await db
    .collection('farmos-group-mapping')
    .find({ instanceName: { $in: mappedInstances.map((mi) => mi.instanceName) } })
    .toArray();

  // either the user is the owner of the instance or the user
  // is admin of a group that has mapped a users instance
  for (const instance of mappedInstances) {
    if (instance.owner === true) {
      allowedInstances[instance.instanceName] = 1;
      continue;
    }

    if (allowedInstances[instance.instanceName] !== 1) {
      // if the user is not anymore admin of a group, deny
      for (const group of groupMappings.filter((gm) => gm.instanceName == instance.instanceName)) {
        if (adminOfGroups.includes(group.groupId + '')) {
          allowedInstances[instance.instanceName] = 1;
        }
      }
    }
  }

  // eslint-disable-next-line no-prototype-builtins
  return allowedInstances.hasOwnProperty(instanceName);
};

/**
 *
 * @param {*} endpoint log / asset
 * @param {*} bundle respective bundle
 * @returns
 */
const wrapCreateSubrequest = (endpoint, bundle) => {
  return {
    uri: `api/${endpoint}/${bundle}`,
    action: 'create',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
  };
};

/**
 *
 * @returns an empty array if term exists, a new term subrequest otherwise
 */
const createTerm = (termName, taxonomyType, taxonomy) => {
  return [];
};

/**
 * TODO create subrequest with new asset
 */
const createAsset = async (instanceName, taxonomy, apiCompose) => {};

/**
 * TODO create subrequest with new asset
 */

const createLog = async (instanceName, taxonomy, apiCompose) => {};

/**
 *
 * handle apiCompose for farmos 2.0
 *
 */
export const handleApiCompose = async (req, res) => {
  return []; // success and error messages
};
