import { ObjectId } from 'mongodb';
import { db } from '../../db';
import { uniqBy } from 'lodash';

/**
 * The user receives ownership over the farmos instance
 */
export const mapFarmOSInstanceToUser = async (userId, instanceName, owner) => {
  const _id = new ObjectId();
  await db.collection('farmos-instances').insertOne({
    _id,
    userId,
    instanceName,
    owner,
  });

  return {
    _id,
    userId,
    instanceName,
    owner,
  };
};

/**
 * The admin receives access to the farmos instance
 */
export const mapFarmOSInstanceToGroupAdmin = async (adminUserId, groupId, instanceName) => {
  const _id = new ObjectId();
  await db.collection('farmos-instances').insertOne({
    _id,
    userId: adminUserId,
    instanceName,
    owner: false,
    groupId,
  });

  return {
    _id,
    userId: adminUserId,
    instanceName,
    owner: false,
    groupId,
  };
};

/**
 * FarmOS instance takes a seat in the groups roster
 */
export const unmapFarmOSInstance = async (id) => {
  await db.collection('farmos-instances').deleteOne(
    {
      _id: ObjectId(id),
    });
};

/**
 * A farmos instance is removed from the group's plan
 */
export const removeFarmOSInstanceFromGroup = async (id) => {
  await db.collection('farmos-group-mapping').deleteOne(
    {
      _id: ObjectId(id),
    });
};

/**
 * A group Admin creates a new farmos instance for a user
 * The instance is added to the groups plan
 */
export const createFarmOSInstanceForUserAndGroup = async (userId, groupId, instanceName) => {

  const _id = new ObjectId();
  await db.collection('farmos-group-mapping').insertOne({
    _id,
    instanceName,
    groupId,
  });

  return await mapFarmOSInstanceToUser(userId, instanceName, true);
};

/**
 * a list of farmos instances the user currently has access to
 */
export const listFarmOSInstancesForUser = async (userId) => {
  // instances owned by user
  const usersInstances = await db.collection('farmos-instances').find({ userId }).toArray();
  return usersInstances;
};

/**
 * a list of farmos instances a group and its subgroups are currently managing
 */
export const listFarmOSInstancesForGroup = async (userId, groupId) => {
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

  return uniqBy([...adminInstances], (item) => item.instanceName).map((item) => ({
    instanceName: item.instanceName,
    owner: item.owner === true,
  }));
};