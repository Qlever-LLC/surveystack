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
 * @param {*} group who contains attribut path
 * @returns RootGroup or null;
 * is RootGroup if group has an entry in farmos-group-settigns
 */
export const getFarmOSRootGroup = async (group) => {
  const groupsPath = getArrayPathsConainedInPath(group.path);
  const id = await getGroupIdFromGroupInFarmosGroupSettingsFromPaths(groupsPath);
  if (id) {
    return await getGroupFromGroupId(id, undefined);
  }
  return null;
};

/**
 * @param {*} groupId
 * @returns true or false;
 * true means no RootGroup in direct way to MainGroup AND no RootGroup in all Subgroups
 */
export const canBecomeFarmOSRootGroup = async (groupId) => {
  const group = await getGroupFromGroupId(groupId, { path: 1 });
  const groupsPath = getArrayPathsConainedInPath(group.path);
  const subgroups = await getDescendantGroups(group, {
    _id: 0,
    path: 1,
  });
  for (const subgroup of subgroups) {
    groupsPath.push(subgroup.path);
  }
  if (await getGroupIdFromGroupInFarmosGroupSettingsFromPaths(groupsPath)) {
    return false;
  }
  return true;
};

/**
 *
 * @param {*} path
 * @returns array of paths contained in given path;
 * first element is path from it-self and after all direct parents with last who is BaseGroup '/xxx/'
 */
const getArrayPathsConainedInPath = (path) => {
  const groupsPath = [];
  const hierarchie = path.split('/');
  hierarchie.shift();
  hierarchie.pop();
  while (hierarchie.length > 0) {
    let path = '/';
    hierarchie.forEach((part) => {
      path = path + part + '/';
    });
    groupsPath.push(path);
    hierarchie.pop();
  }
  return groupsPath;
};

/**
 * @param {*} paths is array of path(s)
 * @returns null or groupId if entry in farmos-group-settings
 */
const getGroupIdFromGroupInFarmosGroupSettingsFromPaths = async (paths) => {
  const agg = [
    {
      $match: {
        path: { $in: paths },
      },
    },
    {
      $project: {
        _id: 1,
      },
    },
    {
      $lookup: {
        from: 'farmos-group-settings',
        localField: '_id',
        foreignField: 'groupId',
        as: 'groupMapped',
      },
    },
    { $unwind: '$groupMapped' }, //return the only result if exists
    {
      $project: {
        _id: 0,
        'groupMapped.groupId': 1,
      },
    },
  ];
  const groupIdEntryExists = await db.collection('groups').aggregate(agg).toArray();
  if (groupIdEntryExists[0]) {
    return groupIdEntryExists[0].groupMapped.groupId;
  }
  return null;
};

/**
 *
 * @param {*} userId
 * @param {*} projection
 * @returns the user that matches the userId
 */
export const getUserFromUserId = async (userId, projection = {}) => {
  const user = await db
    .collection('users')
    .findOne({ _id: asMongoId(userId) }, { projection: projection });
  if (!user) {
    throw boom.notFound();
  }
  return user;
};
/**
 *
 * @param {*} groupId
 * @param {*} projection can be explicitly undefined
 * @returns the group that matches the groupId
 */
export const getGroupFromGroupId = async (groupId, projection = {}) => {
  const group = await db
    .collection('groups')
    .findOne({ _id: asMongoId(groupId) }, { projection: projection });
  if (!group) {
    throw boom.notFound();
  }
  return group;
};

/**
 * @param {*} path
 * @returns 'mainGroupName > SubGroupName > SubSubGroupName';
 * transform '/a/b/c/' to 'a > b > c'
 */
export const getRewrittenPathFromGroupPath = async (path) => {
  const paths = getArrayPathsConainedInPath(path);
  const agg = [
    {
      $match: {
        path: { $in: paths },
      },
    },
    {
      $project: {
        name: 1,
        dir: 1,
      },
    },
    { $sort: { dir: 1 } },
  ];
  const groups = await db.collection('groups').aggregate(agg).toArray();
  let prettyPath = groups.shift().name;
  for (const grp of groups) {
    prettyPath = prettyPath + ' > ' + grp.name;
  }
  return prettyPath;
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
  await mapFarmOSInstanceToGroup(groupId, instanceName);
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
  return await db.collection('farmos-group-settings').insertOne({
    _id: new ObjectId(),
    groupId: asMongoId(groupId),
    planIds: [],
    groupHasFarmOSAccess: true,
    groupHasCoffeeShopAccess: false,
    allowSubgroupsToJoinCoffeeShop: false,
    allowSubgroupAdminsToCreateFarmOSInstances: false,
    maxSeats: 20,
    ...specification,
  });
};

export const setGroupSettings = async (groupId, settings) => {
  return await db
    .collection('farmos-group-settings')
    .update({ groupId: asMongoId(groupId) }, { $set: settings });
};

/**
 * @param {*} groupId
 * @param {*} projection
 * @returns without projection, dimension farmos-group-settings is like:
 * _id, groupId, planIds, groupHasFarmOSAccess, groupHasCoffeeShopAccess, allowSubgroupsToJoinCoffeeShop, allowSubgroupAdminsToCreateFarmOSInstances, maxSeats
 */
export const getGroupSettings = async (groupId, projection = {}) => {
  return await db
    .collection('farmos-group-settings')
    .findOne({ groupId: asMongoId(groupId) }, { projection: projection });
};

/**
 * @param {*} groups
 * @returns amount of unique entry of instanceName in farmos-group-mapping inside the Domain;
 * groups is the entire domain
 */
export const getCurrentSeatsFromDomain = async (groups) => {
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
//TODO write settings methodes has & enable & disable also for
// -> groupHasGroupFarmOSAccess
// -> groupHasCoffeeShopAccess
// -> allowSubgroupsToJoinCoffeeShop
// -> allowSubgroupAdminsToCreateFarmOSInstances
// for has get value from root
// enable and disable can only happen in RootGroup
export const hasGroupFarmOSAccess = async (groupId) => {
  const s = await getGroupSettings(groupId, { groupHasFarmOSAccess: 1 });
  if (s) {
    return s.groupHasFarmOSAccess;
  }
  return false;
};
export const enableFarmOSAccessForGroup = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    return createFarmosGroupSettings(groupId, { groupHasFarmOSAccess: true });
  } else {
    return await setGroupSettings(groupId, { groupHasFarmOSAccess: true });
  }
};
export const disableFarmOSAccessForGroup = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    throw boom.notFound();
  }
  return await setGroupSettings(groupId, { groupHasFarmOSAccess: false });
};
/*
WARNING WRONG IMPLEMENTATION !!!
export const hasGroupCoffeeShopAccess = async (groupId) => {
  const s = await getGroupSettings(groupId, { groupHasCoffeeShopAccess: 1 });
  if (s) {
    return s.groupHasCoffeeShopAccess;
  }
  return false;
};
export const enableCoffeeShopAccessForGroup = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    return createFarmosGroupSettings(groupId, { groupHasCoffeeShopAccess: true });
  } else {
    return await setGroupSettings(groupId, { groupHasCoffeeShopAccess: true });
  }
};
export const disableCoffeeShopAccessForGroup = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    throw boom.notFound();
  }
  return await setGroupSettings(groupId, { groupHasCoffeeShopAccess: false });
};

export const isAllowedSubgroupsToJoinCoffeeShop = async (groupId) => {
  const s = await getGroupSettings(groupId, { allowSubgroupsToJoinCoffeeShop: 1 });
  if (s) {
    return s.allowSubgroupsToJoinCoffeeShop;
  }
  return false;
};
export const enableSubgroupsToJoinCoffeeShop = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    return createFarmosGroupSettings(groupId, { allowSubgroupsToJoinCoffeeShop: true });
  } else {
    return await setGroupSettings(groupId, { allowSubgroupsToJoinCoffeeShop: true });
  }
};
export const disableSubgroupsToJoinCoffeeShop = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    throw boom.notFound();
  }
  return await setGroupSettings(groupId, { allowSubgroupsToJoinCoffeeShop: false });
};

export const isAllowedSubgroupAdminsToCreateFarmOSInstances = async (groupId) => {
  const s = await getGroupSettings(groupId, { allowSubgroupAdminsToCreateFarmOSInstances: 1 });
  if (s) {
    return s.allowSubgroupAdminsToCreateFarmOSInstances;
  }
  return false;
};
export const enableSubgroupAdminsToCreateFarmOSInstances = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    return createFarmosGroupSettings(groupId, { allowSubgroupAdminsToCreateFarmOSInstances: true });
  } else {
    return await setGroupSettings(groupId, { allowSubgroupAdminsToCreateFarmOSInstances: true });
  }
};
export const disableSubgroupAdminsToCreateFarmOSInstances = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    throw boom.notFound();
  }
  return await setGroupSettings(groupId, { allowSubgroupAdminsToCreateFarmOSInstances: false });
};*/

/**
 * @param {*} descendants
 * @returns all info (raw data) from members from the tested domain
 */
const getMembersCreatedinDescendantsGroups = async (descendants) => {
  const descendantsId = [];
  for (const descendant of descendants) {
    descendantsId.push(descendant._id);
  }
  const getMembersCreatedinTestedDescendantsGroups = [
    {
      $match: {
        group: { $in: descendantsId },
      },
    },
    {
      $project: {
        _id: 1,
        user: 1,
        group: 1,
        role: 1,
      },
    },
    {
      $lookup: {
        from: 'groups',
        localField: 'group',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              _id: 0,
              path: 1,
            },
          },
        ],
        as: 'membersLocation',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              _id: 0,
              email: 1,
              name: 1,
            },
          },
        ],
        as: 'members',
      },
    },
    {
      $lookup: {
        from: 'farmos-instances',
        localField: 'user',
        foreignField: 'userId',
        pipeline: [
          {
            $project: {
              userId: 0,
            },
          },
        ],
        as: 'connectedFarms',
      },
    },
    {
      $lookup: {
        from: 'farmos-group-mapping',
        localField: 'connectedFarms.instanceName',
        foreignField: 'instanceName',
        pipeline: [
          {
            $group: {
              _id: '$instanceName',
              groupsId: { $push: '$groupId' },
              fgm: { $push: '$_id' },
            },
          },
        ],
        as: 'memberships',
      },
    },
    {
      $lookup: {
        from: 'groups',
        localField: 'memberships.groupsId',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              path: 1,
            },
          },
        ],
        as: 'mgroups',
      },
    },
  ];
  return await db
    .collection('memberships')
    .aggregate(getMembersCreatedinTestedDescendantsGroups)
    .toArray();
};

/**
 * @param {*} membersRawData
 * @returns members part from JSON answer
 */
const structureMembersPart = async (membersRawData) => {
  const members = [];
  for (const memberRD of membersRawData) {
    let tempMb = {};
    tempMb.name = memberRD.members[0].name;
    tempMb.email = memberRD.members[0].email;
    tempMb.location = await getRewrittenPathFromGroupPath(memberRD.membersLocation[0].path);
    tempMb.userId = memberRD.user;
    memberRD.role == 'admin' ? (tempMb.admin = true) : (tempMb.admin = false);
    //connectedFarms
    tempMb.connectedFarms = [];
    for (const cf of memberRD.connectedFarms) {
      let tempCF = {};
      tempCF.farmId = cf._id;
      tempCF.instanceName = cf.instanceName;
      tempCF.owner = cf.owner;
      let mbships = memberRD.memberships.find((data) => {
        return data._id === cf.instanceName;
      });
      const grps = [];
      for (const ms of mbships.groupsId) {
        const gp = memberRD.mgroups.find((data) => {
          return ms + '' === data._id + '';
        });
        if (gp) {
          const p = await getRewrittenPathFromGroupPath(gp.path);
          grps.push(p);
        }
      }
      tempCF.memberships = grps;
      tempMb.connectedFarms.push(tempCF);
    }
    //obj created
    members.push(tempMb);
  }
  return members;
};

//TODO implement getGroupInformation
/**
 * @param {*} groupId
 * @param {*} isSuperAdmin
 * @returns JSON answer
 */
export const getGroupInformation = async (groupId, isSuperAdmin = false) => {
  const group = await getGroupFromGroupId(groupId);
  if (!group) {
    throw boom.notFound();
  }

  //know if groupId is a RootGroup or not (=> define setting in JSON response)
  let testedGroupIsRoot = false;
  const getRootGroup = await getFarmOSRootGroup(group);
  const canBecomeRootGroup = await canBecomeFarmOSRootGroup(groupId); //TODO to be deleted but kept for testing
  console.log('getFarmOSRootGroup', getRootGroup);
  console.log('canBecomeFarmOSRootGroup', canBecomeRootGroup); //TODO to be deleted but kept for testing

  //this case should not be encountered because the access is protected in the Frontend
  if (getRootGroup === null) {
    return boom.badData();
  }
  if (groupId.equals(getRootGroup._id)) {
    testedGroupIsRoot = true;
    console.log('testedGroupIsRoot');
  }

  const descendants = await getDescendantGroups(group, {
    _id: 1,
    name: 1,
    dir: 1,
    path: 1,
  });
  let groupSettings = {};
  //setting part only if it's a RootGroup
  if (testedGroupIsRoot) {
    if (isSuperAdmin) {
      groupSettings = await getGroupSettings(groupId, {
        groupId: 1,
        groupHasFarmOSAccess: 1,
        groupHasCoffeeShopAccess: 1,
        allowSubgroupsToJoinCoffeeShop: 1,
        allowSubgroupAdminsToCreateFarmOSInstances: 1,
        maxSeats: 1,
      });
    } else {
      groupSettings = await getGroupSettings(groupId, {
        groupId: 1,
        allowSubgroupsToJoinCoffeeShop: 1,
        allowSubgroupAdminsToCreateFarmOSInstances: 1,
        maxSeats: 1,
      });
    }
    const currentSeats = await getCurrentSeatsFromDomain(descendants);
    const seats_obj = { seats: { current: currentSeats, max: groupSettings.maxSeats } };
    delete groupSettings.maxSeats;
    groupSettings = { ...groupSettings, ...seats_obj };
  }

  const groupName = await getRewrittenPathFromGroupPath(group.path);
  let groupInformation = { name: groupName };
  //get members part from JSON response
  const membersRawData = await getMembersCreatedinDescendantsGroups(descendants);
  //console.log('RESULT membersRawData', JSON.stringify(membersRawData, null, 2));
  //TODO array from all fgm id => Farms from NonMerbers inside the domain
  const membersPart = await structureMembersPart(membersRawData);
  //console.log('RESULT membersPart', JSON.stringify(membersPart, null, 2));
  groupInformation.members = membersPart;
  //TODO insert array nonMembers with only instanceName and path

  groupInformation = { ...groupSettings, ...groupInformation };

  return groupInformation;
  /*
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
