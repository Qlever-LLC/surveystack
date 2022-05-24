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
 * @param { Object } group who contains attribut path
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
 * @param { ObjectId } groupId
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
 * @param { String } path
 * @returns array of paths contained in given path;
 * first element is path from it-self and after all direct parents with last who is BaseGroup '/xxx/'
 */
export const getArrayPathsConainedInPath = (path) => {
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
 * @param { Array } paths is array of path(s)
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
 * @param { ObjectId } userId
 * @param { Object } projection
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
 * @param { ObjectId } groupId
 * @param { Object } projection can be explicitly undefined
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
 * @param { String } path
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
    .updateOne({ groupId: asMongoId(groupId) }, { $set: { planId: planId } });
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

// TODO unit test for settings part
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
    .updateOne({ groupId: asMongoId(groupId) }, { $set: settings });
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

//TODO write settings methodes has & enable & disable also for
// -> groupHasCoffeeShopAccess
// -> allowSubgroupsToJoinCoffeeShop
// -> allowSubgroupAdminsToCreateFarmOSInstances
/**
 * @param { ObjectId } groupId
 * @returns groupHasFarmOSAccess setting from root
 */
export const hasGroupFarmOSAccess = async (groupId) => {
  const group = await getGroupFromGroupId(groupId);
  if (!group) {
    throw boom.notFound();
  }
  const rootGroup = await getFarmOSRootGroup(group);
  if (!rootGroup) {
    return false;
  }
  const s = await getGroupSettings(rootGroup._id, { groupHasFarmOSAccess: 1 });
  if (s) {
    return s.groupHasFarmOSAccess;
  }
  return false;
};
/**
 * @param { ObjectId } groupId
 * @returns groupHasFarmOSAccess on true for group;
 * can only happen in RootGroup
 */
export const enableFarmOSAccessForGroup = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (groupSettings) {
    return await setGroupSettings(groupId, { groupHasFarmOSAccess: true });
  }
  if (await canBecomeFarmOSRootGroup(groupId)) {
    return createFarmosGroupSettings(groupId, { groupHasFarmOSAccess: true });
  }
  return null;
};
/**
 * @param { ObjectId } groupId
 * @returns groupHasFarmOSAccess and allowSubgroupAdminsToCreateFarmOSInstances on false for group;
 * can only happen in RootGroup
 */
export const disableFarmOSAccessForGroup = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    throw boom.notFound();
  }
  return await setGroupSettings(groupId, {
    groupHasFarmOSAccess: false,
    allowSubgroupAdminsToCreateFarmOSInstances: false,
  });
};

/**
 * @param { ObjectId } groupId
 * @returns groupHasCoffeeShopAccess setting from root
 */
export const hasGroupCoffeeShopAccess = async (groupId) => {
  const group = await getGroupFromGroupId(groupId);
  if (!group) {
    throw boom.notFound();
  }
  const rootGroup = await getFarmOSRootGroup(group);
  if (!rootGroup) {
    return false;
  }
  const s = await getGroupSettings(rootGroup._id, { groupHasCoffeeShopAccess: 1 });
  if (s) {
    return s.groupHasCoffeeShopAccess;
  }
  return false;
};
/**
 * @param { ObjectId } groupId
 * @returns groupHasCoffeeShopAccess on true for group;
 * can only happen in RootGroup
 */
export const enableCoffeeShopAccessForGroup = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (groupSettings) {
    return await setGroupSettings(groupId, { groupHasCoffeeShopAccess: true });
  }
  if (await canBecomeFarmOSRootGroup(groupId)) {
    return createFarmosGroupSettings(groupId, { groupHasCoffeeShopAccess: true });
  }
  return null;
};
/**
 * @param { ObjectId } groupId
 * @returns groupHasCoffeeShopAccess and allowSubgroupsToJoinCoffeeShop on false for group;
 * can only happen in RootGroup
 */
export const disableCoffeeShopAccessForGroup = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    throw boom.notFound();
  }
  return await setGroupSettings(groupId, {
    groupHasCoffeeShopAccess: false,
    allowSubgroupsToJoinCoffeeShop: false,
  });
};

/**
 * @param { ObjectId } groupId
 * @returns allowSubgroupsToJoinCoffeeShop setting from root
 */
export const isAllowedSubgroupsToJoinCoffeeShop = async (groupId) => {
  const group = await getGroupFromGroupId(groupId);
  if (!group) {
    throw boom.notFound();
  }
  const rootGroup = await getFarmOSRootGroup(group);
  if (!rootGroup) {
    return false;
  }
  const s = await getGroupSettings(rootGroup._id, { allowSubgroupsToJoinCoffeeShop: 1 });
  if (s) {
    return s.allowSubgroupsToJoinCoffeeShop;
  }
  return false;
};
/**
 * @param { ObjectId } groupId
 * @returns allowSubgroupsToJoinCoffeeShop on true for group;
 * can only happen in RootGroup
 */
export const enableSubgroupsToJoinCoffeeShop = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    return null;
  }
  if (await hasGroupCoffeeShopAccess(groupId)) {
    return await setGroupSettings(groupId, { allowSubgroupsToJoinCoffeeShop: true });
  }
  return null;
};
/**
 * @param { ObjectId } groupId
 * @returns allowSubgroupsToJoinCoffeeShop on false for group;
 * can only happen in RootGroup
 */
export const disableSubgroupsToJoinCoffeeShop = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    throw boom.notFound();
  }
  return await setGroupSettings(groupId, { allowSubgroupsToJoinCoffeeShop: false });
};

/**
 * @param { ObjectId } groupId
 * @returns allowSubgroupAdminsToCreateFarmOSInstances setting from root
 */
export const isAllowedSubgroupAdminsToCreateFarmOSInstances = async (groupId) => {
  const group = await getGroupFromGroupId(groupId);
  if (!group) {
    throw boom.notFound();
  }
  const rootGroup = await getFarmOSRootGroup(group);
  if (!rootGroup) {
    return false;
  }
  const s = await getGroupSettings(rootGroup._id, {
    allowSubgroupAdminsToCreateFarmOSInstances: 1,
  });
  if (s) {
    return s.allowSubgroupAdminsToCreateFarmOSInstances;
  }
  return false;
};
/**
 * @param { ObjectId } groupId
 * @returns allowSubgroupAdminsToCreateFarmOSInstances on true for group;
 * can only happen in RootGroup
 */
export const enableSubgroupAdminsToCreateFarmOSInstances = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    return null;
  }
  if (await hasGroupFarmOSAccess(groupId)) {
    return setGroupSettings(groupId, { allowSubgroupAdminsToCreateFarmOSInstances: true });
  }
  return null;
};
/**
 * @param { ObjectId } groupId
 * @returns allowSubgroupAdminsToCreateFarmOSInstances on false for group;
 * can only happen in RootGroup
 */
export const disableSubgroupAdminsToCreateFarmOSInstances = async (groupId) => {
  const groupSettings = await getGroupSettings(groupId, { _id: 1 });
  if (!groupSettings) {
    throw boom.notFound();
  }
  return await setGroupSettings(groupId, { allowSubgroupAdminsToCreateFarmOSInstances: false });
};

/**
 * @param { Array } groups
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

/**
 * @param { Array } descendants
 * @returns all info (raw data) from members from the tested domain
 */
export const getMembersCreatedinDescendantsGroups = async (descendants) => {
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
    { $addFields: { m_id: '$_id' } },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $set: {
        role: {
          $cond: {
            if: {
              $eq: ['$role', 'admin'],
            },
            then: 'true',
            else: 'false',
          },
        },
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
    { $addFields: { location: { $arrayElemAt: ['$membersLocation.path', 0] } } },
    {
      $project: {
        membersLocation: 0,
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
    { $addFields: { email: { $arrayElemAt: ['$members.email', 0] } } },
    { $addFields: { name: { $arrayElemAt: ['$members.name', 0] } } },
    {
      $project: {
        members: 0,
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
          {
            $set: { i_id: '$_id' },
          },
        ],
        as: 'instances',
      },
    },
    {
      $lookup: {
        from: 'farmos-group-mapping',
        localField: 'instances.instanceName',
        foreignField: 'instanceName',
        pipeline: [
          {
            $group: {
              _id: '$instanceName',
              memberships: { $push: { groupId: '$groupId', fgm_id: '$_id' } },
              fgm: { $push: '$_id' }, // used for nonMembers part
            },
          },
        ],
        as: 'memberships',
      },
    },
    {
      $addFields: {
        connectedFarms: {
          $map: {
            input: '$instances',
            in: {
              $mergeObjects: [
                '$$this',
                {
                  $arrayElemAt: [
                    '$memberships',
                    {
                      $indexOfArray: ['$memberships._id', '$$this.instanceName'],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        'connectedFarms._id': 0,
      },
    },
    {
      $project: {
        instances: 0,
      },
    },
    {
      $project: {
        memberships: 0,
      },
    },
    {
      $lookup: {
        from: 'groups',
        localField: 'connectedFarms.memberships.groupId',
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
 * @param { Array } membersRawData
 * @returns members part from JSON answer
 */
export const structureMembersPart = async (membersRawData) => {
  for (const memberRD of membersRawData) {
    memberRD.location = await getRewrittenPathFromGroupPath(memberRD.location);
    memberRD.userId = memberRD.user;
    delete memberRD.user;
    //connectedFarms
    for (const cf of memberRD.connectedFarms) {
      delete cf.fgm;
      for (const mbships of cf.memberships) {
        const grp = memberRD.mgroups.find((data) => {
          return data._id + '' === mbships.groupId + '';
        });
        mbships.path = await getRewrittenPathFromGroupPath(grp.path);
      }
    }
    delete memberRD.mgroups;
  }
  return membersRawData;
};

/**
 * @param { Object } rawData
 * @returns all ids from collection farmos-group-mapping who are in RawData;
 * => Farms from NonMerbers inside the domain
 */
export const getIdsFromFarmOSGroupMapped = async (rawData) => {
  const ids = [];
  for (const obj of rawData) {
    for (const cf of obj.connectedFarms) {
      ids.push(...cf.fgm);
    }
  }
  return ids;
};

/**
 * @param { Array } descendants
 * @param { Array } farmOSGroupsMappedId
 * @returns array of nonMembers with only instanceName and path;
 * nonMembers are users who are not members from a Domain but who have a farmos mapped into it
 */
export const getNonMembersWhoHaveFarmsLinkedinDescendantsGroups = async (
  descendants,
  farmOSGroupsMappedId
) => {
  const descendantsId = [];
  for (const descendant of descendants) {
    descendantsId.push(descendant._id);
  }
  const getNonMembersWhoHaveFarmsLinkedinTestedDescendantsGroups = [
    {
      $match: {
        groupId: { $in: descendantsId },
        _id: { $not: { $in: farmOSGroupsMappedId } },
      },
    },
    {
      $lookup: {
        from: 'groups',
        localField: 'groupId',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              _id: 0,
              path: 1,
            },
          },
        ],
        as: 'mgroups',
      },
    },
    { $addFields: { path: { $arrayElemAt: ['$mgroups.path', 0] } } },
    { $addFields: { fgm_id: '$_id' } },
    {
      $project: {
        mgroups: 0,
        _id: 0,
      },
    },
  ];
  return await db
    .collection('farmos-group-mapping')
    .aggregate(getNonMembersWhoHaveFarmsLinkedinTestedDescendantsGroups)
    .toArray();
};

//TODO implement getGroupInformation
/**
 * @param { ObjectId } groupId
 * @param { Boolean } isSuperAdmin
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
  //this case should not be encountered because the access is protected in the Frontend
  if (getRootGroup === null) {
    return boom.badData();
  }
  if (groupId.equals(getRootGroup._id)) {
    testedGroupIsRoot = true;
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
  const farmOSGroupsMappedId = await getIdsFromFarmOSGroupMapped(membersRawData);
  //console.log('farmOSGroupsMappedId', farmOSGroupsMappedId);
  const membersPart = await structureMembersPart(membersRawData);
  //console.log('RESULT membersPart', JSON.stringify(membersPart, null, 2));
  const nonMembersPart = await getNonMembersWhoHaveFarmsLinkedinDescendantsGroups(
    descendants,
    farmOSGroupsMappedId
  );
  await Promise.all(
    nonMembersPart.map(async (el) => {
      el.path = await getRewrittenPathFromGroupPath(el.path);
    })
  );
  //console.log('RESULT nonMembersRawData', JSON.stringify(nonMembersPart, null, 2));

  groupInformation.members = membersPart;
  groupInformation.nonMembers = nonMembersPart;
  groupInformation = { ...groupSettings, ...groupInformation };

  return groupInformation;
};
