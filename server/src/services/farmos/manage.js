import { ObjectId } from 'mongodb';
import { db } from '../../db';
import { aggregator } from './aggregator';
import { uniqBy } from 'lodash';
import boom from '@hapi/boom';
import { getDescendantGroups } from '../roles.service';

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
 * list of users who belong to the group
 */
export const listUsersWithRoleForGroup = async (groups) => {
  if (groups) {
    const subgrps = [];
    for (const subg of groups) {
      subgrps.push(subg._id);
    }

    const listMemberships = await db
      .collection('memberships')
      .find({ group: { $in: subgrps } })
      .toArray();
    const listUser = [];
    if (listMemberships) {
      for (const membership of listMemberships) {
        const user = await getUserFromUserId(membership.user);
        let isAdmin;
        membership.role == 'admin' ? (isAdmin = { admin: true }) : (isAdmin = { admin: false });
        const userWithRole = { ...user, ...isAdmin };
        listUser.push(userWithRole);
      }
    }
    return listUser;
  }
  return undefined;
};
export const getUserFromUserId = async (userId) => {
  const user = await db
    .collection('users')
    .findOne({ _id: asMongoId(userId) }, { projection: { email: 1, name: 1 } });
  if (!user) {
    throw boom.notFound();
  }
  return user;
};

/**
 * list of subgroups that contain the url (instanceName) of the farmos instance
 */
export const listSubGroupsContainFarmosInstance = async (subgroups, instanceName) => {
  const listGroup = [];
  if (subgroups) {
    for (const subgroup of subgroups) {
      // find a couple: group && instanceName
      const findACouple = await db
        .collection('farmos-group-mapping')
        .findOne(
          { groupId: asMongoId(subgroup._id), instanceName: instanceName },
          { projection: { _id: 1 } }
        );
      if (findACouple) {
        const subgroupCustom = { _id: subgroup._id };
        subgroupCustom.path = await getRewrittenPathFromGroup(subgroup);
        listGroup.push({ ...subgroupCustom });
      }
    }
  }
  return listGroup;
};
// transform "/a/b/c/" to "a > b > c"
export const getRewrittenPathFromGroup = async (subgroup) => {
  let path = subgroup.name;
  while (subgroup.dir != '/') {
    subgroup = await db
      .collection('groups')
      .findOne({ path: subgroup.dir }, { projection: { name: 1, dir: 1 } });
    if (!subgroup) {
      throw boom.badData('parent from subgroup not found');
    }
    path = subgroup.name + ' > ' + path;
  }
  return path;
};

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
 * A farmos instance is added to the group's plan
 */
export const mapFarmOSInstanceToGroup = async (groupId, instanceName) => {
  const _id = new ObjectId();

  await db.collection('farmos-group-mapping').insertOne({
    _id,
    groupId: asMongoId(groupId),
    instanceName,
  });

  return {
    _id,
    groupId,
    instanceName,
  };
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
export const createFarmOSInstanceForUserAndGroup = async (
  userId,
  groupId,
  instanceName,
  userIsOwner
) => {
  const _id = new ObjectId();
  await db.collection('farmos-group-mapping').insertOne({
    _id,
    instanceName,
    groupId: asMongoId(groupId),
  });

  return await mapFarmOSInstanceToUser(userId, instanceName, userIsOwner);
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

// TODO create farmos-group-settings etc.
export const createFarmosGroupSettings = async (groupId, specification) => {
  /*
  const groupSettingDefaults = {
  groupHasFarmOSAccess: true,
  groupHasCoffeeShopAccess: false,
  allowSubgroupsToJoinCoffeeShop: false,
  maxSeats: 20,
  planIds: [],
  };
*/
  return await db.collection('farmos-group-settings').insertOne({
    _id: new ObjectId(),
    groupId: asMongoId(groupId),
    planIds: [],
    groupHasFarmOSAccess: true,
    groupHasCoffeeShopAccess: false,
    allowSubgroupsToJoinCoffeeShop: false,
    allowSubgroupAdminsToCreateFarmOSInstances: true,
    maxSeats: 20,
    ...specification,
  });
};

export const setGroupSettings = async (groupId, settings) => {
  return await db
    .collection('farmos-group-settings')
    .update({ groupId: asMongoId(groupId) }, { $set: settings });
};

export const getGroupSettings = async (groupId, projection = {}) => {
  return await db
    .collection('farmos-group-settings')
    .findOne({ groupId: asMongoId(groupId) }, { projection: projection });
};

export const getCurrentSeatsFromGroup = async (groups) => {
  if (groups) {
    const subgrps = [];
    for (const subg of groups) {
      subgrps.push(subg._id);
    }
    const mapping = await db
      .collection('farmos-group-mapping')
      .distinct('instanceName', { groupId: { $in: subgrps } });
    return mapping.length;
  }
  return 0;
};
//TODO write methodes has & enable & disable also for
// -> groupHasCoffeeShopAccess
// -> allowSubgroupsToJoinCoffeeShop
// -> allowSubgroupAdminsToCreateFarmOSInstances
export const hasGroupFarmOSAccess = async (groupId) => {
  const s = await getGroupSettings(groupId, { groupHasFarmOSAccess: 1 });
  if (s) {
    return s;
  }
  return false;
};

export const enableFarmOSAccessForGroup = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId);
  if (!groupSettings) {
    return createFarmosGroupSettings(groupId, { groupHasFarmOSAccess: true });
  } else {
    return await setGroupSettings(groupId, { groupHasFarmOSAccess: true });
  }
};

export const disableFarmOSAccessForGroup = async (groupId) => {
  const groupSettings = await db
    .collection('farmos-group-settings')
    .findOne({ groupId: asMongoId(groupId) });

  if (!groupSettings) {
    throw boom.notFound();
  }

  return await setGroupSettings(groupId, { groupHasFarmOSAccess: false });
};

export const getGroupInformation = async (groupId) => {
  const group = await db.collection('groups').findOne({ _id: asMongoId(groupId) });
  if (!group) {
    throw boom.notFound();
  }
  const groupName = await getRewrittenPathFromGroup(group);
  let groupInformation = { name: groupName, members: [] };
  const subgroups = await getDescendantGroups(group, {
    _id: 1,
    name: 1,
    dir: 1,
    path: 1,
  }); // TODO UNIT TEST
  const listUsersWithRole = await listUsersWithRoleForGroup(subgroups); // TODO UNIT TEST
  if (listUsersWithRole) {
    for (const user of listUsersWithRole) {
      const userWithConnectedFarms = { ...user, connectedFarms: [] };
      let listInstances = await listFarmOSInstancesForUser(user._id); // TODO UNIT TEST
      if (listInstances) {
        for (let instance in listInstances) {
          const memberships = await listSubGroupsContainFarmosInstance(
            subgroups,
            listInstances[instance].instanceName
          ); // TODO UNIT TEST
          listInstances[instance] = { ...listInstances[instance], memberships: [] };
          if (memberships) {
            listInstances[instance].memberships = [...memberships];
          }
        }
        userWithConnectedFarms.connectedFarms = [...listInstances];
      }
      groupInformation.members.push(userWithConnectedFarms);
    }
  }
  //TODO integrate groupSettings in groupInformation
  const groupSettings = await getGroupSettings(groupId);
  const currentSeats = await getCurrentSeatsFromGroup(subgroups);
  const seats_obj = { seats: { current: currentSeats, max: groupSettings.maxSeats } };
  delete groupSettings.planIds;
  delete groupSettings.maxSeats;
  groupInformation = { ...groupSettings, ...seats_obj, ...groupInformation };

  return groupInformation;
  /*
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
            memberships: ['Bionutrient > Labs > Michigan'],
          },
        ],
      },
    ],
  };*/
};
