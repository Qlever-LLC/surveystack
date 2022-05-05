import { ObjectId } from 'mongodb';
import { db } from '../../db';
import { aggregator } from './aggregator';
import { uniqBy } from 'lodash';
import boom from '@hapi/boom';
import { getDescendantGroups } from '../roles.service';

const groupSettingDefaults = {
  groupHasFarmOSAccess: true,
  groupHasCoffeeShopAccess: false,
  allowSubgroupsToJoinCoffeeShop: false,
  maxSeats: 20,
  planId: null,
};

const config = () => {
  if (!process.env.FARMOS_AGGREGATOR_URL || !process.env.FARMOS_AGGREGATOR_APIKEY) {
    console.log('env not set');
    throw boom.internal('farmos aggregator credentials not set');
  }

  return aggregator(process.env.FARMOS_AGGREGATOR_URL, process.env.FARMOS_AGGREGATOR_APIKEY);
};

export const asMongoId = (source) =>
  source instanceof ObjectId ? source : ObjectId(typeof source === 'string' ? source : source._id);

/**
 * The user receives ownership over the farmos instance
 */
export const mapFarmOSInstanceToUser = async (userId, instanceName, owner) => {
  const _id = new ObjectId();

  await db.collection('farmos-instances').insertOne({
    _id,
    userId: asMongoId(userId),
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
    userId: asMongoId(adminUserId),
    instanceName,
    owner: false,
    groupId: asMongoId(groupId),
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
  await db.collection('farmos-instances').deleteOne({
    _id: ObjectId(id),
  });
};

/**
 * A farmos instance is removed from the group's plan
 */
export const removeFarmOSInstanceFromGroup = async (id) => {
  await db.collection('farmos-group-mapping').deleteOne({
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
    groupId: asMongoId(groupId),
  });

  return await mapFarmOSInstanceToUser(userId, instanceName, true);
};

/**
 * a list of farmos instances the user currently has access to
 */
export const listFarmOSInstancesForUser = async (userId) => {
  // instances owned by user
  const usersInstances = await db
    .collection('farmos-instances')
    .find({ userId: asMongoId(userId) })
    .toArray();
  return usersInstances;
};

/**
 * a list of farmos instances a group and its subgroups are currently managing
 */
export const listFarmOSInstancesForGroupAdmin = async (userId, groupId) => {
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

export const listFarmOSInstancesForGroup = async (groupId) => {
  const adminInstances = await db
    .collection('farmos-group-mapping')
    .find({
      groupId: asMongoId(groupId),
    })
    .toArray();

  return adminInstances;
};

export const getSuperAllFarmosMappings = async () => {
  const { getAllFarmsWithTags } = config();
  const aggregatorFarms = await getAllFarmsWithTags();
  const surveystackFarms = await db.collection('farmos-group-mapping').find().toArray();
  const surveystackUserFarms = await db.collection('farmos-instances').find().toArray();

  return {
    aggregatorFarms,
    surveystackFarms,
    surveystackUserFarms,
  };
};

export const addFarmToSurveystackGroup = async (instanceName, groupId, planName) => {
  const res = await db
    .collection('farmos-group-mapping')
    .find({
      instanceName,
      groupId: asMongoId(groupId),
    })
    .toArray();

  if (res.length > 0) {
    throw boom.badData('mapping already exists');
  }

  const group = await db.collection('groups').findOne({
    _id: asMongoId(groupId),
  });

  if (!group) {
    throw boom.badData('group not found');
  }

  const _id = new ObjectId();
  await db.collection('farmos-group-mapping').insertOne({
    _id,
    instanceName,
    groupId: asMongoId(groupId),
    planName,
  });
};

export const removeFarmFromSurveystackGroup = async (instanceName, groupId) => {
  await db
    .collection('farmos-group-mapping')
    .deleteMany({ instanceName, groupId: asMongoId(groupId) });
};

export const addFarmToUser = async (instanceName, userId, groupId, owner) => {
  const res = await db
    .collection('farmos-instances')
    .find({
      instanceName,
      userId: asMongoId(userId),
    })
    .toArray();

  if (res.length > 0) {
    throw boom.badData('mapping already exists');
  }

  const user = await db.collection('users').findOne({
    _id: asMongoId(userId),
  });

  if (!user) {
    throw boom.badData('user not found');
  }

  if (groupId) {
    const group = await db.collection('groups').findOne({
      _id: asMongoId(groupId),
    });

    if (!group) {
      throw boom.badData('group not found');
    }
  }

  const _id = new ObjectId();
  const doc = {
    _id,
    instanceName,
    userId: asMongoId(userId),
    owner: !!owner,
  };

  if (groupId) {
    doc.groupId = asMongoId(groupId);
  }
  await db.collection('farmos-instances').insertOne(doc);
};

export const removeFarmFromUser = async (instanceName, userId, groupId) => {
  const filter = { instanceName, userId: asMongoId(userId) };
  if (groupId) {
    filter.groupId = asMongoId(groupId);
  }

  console.log('filter', filter);

  await db.collection('farmos-instances').deleteMany(filter);
};

export const createPlan = async (planName, planUrl) => {
  const _id = new ObjectId();

  return await db.collection('farmos-plans').insertOne({
    _id,
    planName,
    planUrl,
  });
};

export const getPlans = async () => {
  return await db.collection('farmos-plans').find().toArray();
};

export const deletePlan = async (planId) => {
  const filter = { _id: asMongoId(planId) };
  await db.collection('farmos-plans').deleteMany(filter);
};

export const setPlanForGroup = async (groupId, planId) => {
  await db
    .collection('farmos-group-settings')
    .update({ groupId: asMongoId(groupId) }, { $set: { planId: planId } });
};

export const getPlanForGroup = async (groupId) => {
  const arr = await db
    .collection('farmos-group-settings')
    .find({ groupId: asMongoId(groupId) }, { projection: { planId: 1 } })
    .toArray();

  if (arr.length > 0) {
    return arr[0].planId || null;
  } else {
    return null;
  }
};

export const setGroupSettings = async (groupId, settings) => {};

export const getGroupSettings = async (groupId) => {
  return await db.collection('farmos-group-settings').findOne({ groupId: asMongoId(groupId) });
};

export const hasGroupFarmosAccess = async (groupId) => {
  const s = await getGroupSettings();
  if (s) {
    return s.hasGroupFarmosAccess;
  }

  return false;
};

export const enableFarmosForGroup = async (groupId) => {
  const groupSettings = await db
    .collection('farmos-group-settings')
    .findOne({ groupId: asMongoId(groupId) });
  if (!groupSettings) {
    return await db.collection('farmos-group-settings').insertOne({
      _id: new ObjectId(),
      groupId: asMongoId(groupId),
      ...groupSettingDefaults,
    });
  } else {
    return await db
      .collection('farmos-group-settings')
      .update({ groupId: asMongoId(groupId) }, { $set: { groupHasFarmOSAccess: true } });
  }
};

export const disableFarmosForGroup = async (groupId) => {
  const groupSettings = await db
    .collection('farmos-group-settings')
    .findOne({ groupId: asMongoId(groupId) });

  if (!groupSettings) {
    throw boom.notFound();
  }

  return await db
    .collection('farmos-group-settings')
    .update({ groupId: asMongoId(groupId) }, { $set: { groupHasFarmOSAccess: false } });
};

export const getGroupInformation = async (groupId) => {
  const group = await db.collection('group').findOne({ _id: asMongoId(groupId) });
  if (!group) {
    throw boom.notFound();
  }

  const groupSettings = await db
    .collection('farmos-group-settings')
    .findOne({ groupId: asMongoId(groupId) });

  if (!groupSettings) {
    throw boom.notFound();
  }

  const descendants = getDescendantGroups(group);

  const allGroups = [group._id];
  allGroups.push(...descendants.map((g) => g._id));

  const allMemberships = db
    .collection('memberships')
    .find({
      group: {
        $in: allGroups,
      },
    })
    .toArray();

  const memberships = {}; // by user

  return {
    ...groupSettings,
    name: group.name,
    seats: {
      current: 7,
      max: groupSettings.maxSeats,
    },
    members: [
      {
        name: 'Dan TerAvest',
        email: 'teravestdan@gmail.com',
        admin: true,
        connectedFarms: [
          {
            url: 'dan_teravest_farm.farmos.net',
            owner: true,
            memberships: ['Bionutrient > Labs'],
          },
          {
            url: 'lees_farm.farmos.net',
            owner: true,
            memberships: ['Bionutrient > Labs', 'Bionutrient > Labs > Michigan'],
          },
          {
            url: 'ourscinet.farmos.net',
            owner: false,
            memberships: [
              'Bionutrient > Labs',
              'Bionutrient > Labs > Michigan',
              'Bionutrient > Labs > Europe',
              'Bionutrient > Labs > Community',
              'Bionutrient > Labs > Community > Lab',
            ],
          },
          {
            url: 'coffeeshop.farmos.net',
            owner: false,
          },
        ],
      },
      {
        name: 'Dave Jole',
        email: 'djole2352@gmail.com',
        admin: false,
        connectedFarms: [],
      },
      {
        name: 'Jenny Jennerson',
        email: 'bigjenny@bj.net',
        connectedFarms: [
          {
            url: 'jennybigfarmstand.farmos.net',
            owner: true,
            memberships: ['Bionutrient > Lab > Michigan'],
          },
        ],
      },
      {
        name: 'Jenny AA',
        email: 'bigAAjenny@bj.net',
        connectedFarms: [
          {
            url: 'jennybigfarmstand.farmosA.net',
            owner: true,
            memberships: ['Bionutrient > Lab > Michigan'],
          },
        ],
      },
      {
        name: 'Jenny AB',
        email: 'bigABjenny@bj.net',
        connectedFarms: [
          {
            url: 'jennybigfarmstand.farmosB.net',
            owner: true,
            memberships: [
              'Bionutrient > Labs',
              'Bionutrient > Labs > Michigan',
              'Bionutrient > Labs > Europe',
              'Bionutrient > Labs > Community',
              'Bionutrient > Labs > Community > Lab',
            ],
          },
        ],
      },
      {
        name: 'Jenny CD',
        email: 'bigCDjenny@bj.net',
        connectedFarms: [
          {
            url: 'jennybigfarmstand.farmosC.net',
            owner: true,
            memberships: ['Bionutrient > Lab > Michigan'],
          },
        ],
      },
      {
        name: 'Jenny DD',
        email: 'bigDDjenny@bj.net',
        connectedFarms: [
          {
            url: 'jennybigfarmstand.farmosD.net',
            owner: true,
            memberships: ['Bionutrient > Lab > Michigan'],
          },
        ],
      },
      {
        name: 'Jenny AE',
        email: 'bigAEjenny@bj.net',
        connectedFarms: [
          {
            url: 'jennybigfarmstand.farmosE.net',
            owner: true,
            memberships: ['Bionutrient > Lab > Michigan'],
          },
        ],
      },
      {
        name: 'Jenny AF',
        email: 'bigFAjenny@bj.net',
        connectedFarms: [
          {
            url: 'jennybigfarmstand.farmosF.net',
            owner: true,
            memberships: ['Bionutrient > Lab > Michigan'],
          },
        ],
      },
    ],
  };
};
