import { ObjectId } from 'mongodb';
import { db } from '../../db';
import { uniqBy } from 'lodash';

/**
 * The user receives ownership over the farmos instance
 */
export const mapFarmOSInstanceToUser = async (userId, farmOSInstanceName, owner) => {
  const _id = new ObjectId();
  await db.collection('farmos-instances').insertOne({
    _id,
    userId,
    farmOSInstanceName,
    owner,
  });

  return {
    _id,
    userId,
    farmOSInstanceName,
    owner,
  };
};

/**
 * FarmOS instance takes a seat in the groups roster
 */
export const mapFarmOSInstanceToUserOfGroup = async (userId, farmOSInstanceName, groupId) => {
  const _id = new ObjectId();
  await db.collection('farmos-group-mapping').insertOne({
    _id,
    userId,
    groupId,
    farmOSInstanceName,
  });

  return {
    _id,
    userId,
    groupId,
    farmOSInstanceName,
  };
};

/**
 * A group Admin creates a new farmos instance for a user
 * The instance is added to the groups plan
 */
export const createFarmOSInstanceForUserAndGroup = async () => {};

/**
 * A farmos instance is removed from the group's plan
 */
export const removeFarmOSInstanceFromGroup = async () => {};

/**
 * a list of farmos instances the user currently has access to
 */
export const listFarmOSInstancesForUser = async (userId) => {
  // instances owned by user
  const usersInstances = await db.collection('farmos-instances').find({ userId }).toArray();

  // all groups where the user is admin of
  const adminOfGroups = (
    await db
      .collection('memberships')
      .find({
        user: userId,
        role: 'admin',
      })
      .toArray()
  ).map((a) => new ObjectId(a.group));

  const adminInstances = await db
    .collection('farmos-group-mapping')
    .find({
      groupId: {
        $in: adminOfGroups,
      },
    })
    .toArray();

  return uniqBy([...usersInstances, ...adminInstances], (item) => item.farmOSInstanceName).map(
    (item) => ({
      farmOSInstanceName: item.farmOSInstanceName,
      owner: item.owner === true,
    })
  );
};

/**
 * a list of farmos instances a group and its subgroups are currently managing
 */
export const listFarmOSInstancesForGroup = async () => {};

/**
 * a list of surveystack users that currently can access the farmos instance of a user
 */
export const listUsersAndGroupsWithAccessToFarmOSInstance = async () => {};
