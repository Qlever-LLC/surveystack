import { ObjectId } from 'mongodb';
import { db } from '../../db';
import { aggregator } from './aggregator';
import { uniqBy } from 'lodash';
import boom from '@hapi/boom';
import _ from "lodash";
import { getDescendantGroups, getAscendantGroups } from '../roles.service';


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
 * @returns root group ID or null;
 * is RootGroup if group has an entry in farmos-group-settigns
 */
export const getFarmOSRootGroup = async (ascendantGroups, descendantGroups) => {
  const union = [...ascendantGroups, ...descendantGroups];

  const ids = union.map(g => g._id);

  const res = await db.collection("farmos-group-settings").find({
    groupId: {
      $in: ids
    }
  }).toArray();

  if (res.length == 0) {
    return null;
  }

  return union.find(g => g._id.equals(res[0].groupId));
};

export const getTree = async (group) => {

  const descendants = await getDescendantGroups(group);
  const ascendants = await getAscendantGroups(group);
  let domainRoot = await getFarmOSRootGroup(ascendants, descendants);


  const allGroups = [...ascendants, ...descendants];

  const isDomainRooInDescendants = () => {
    if (domainRoot == null) {
      return false;
    }

    return descendants.filter(d => !d._id.equals(group._id) /* exclude self*/)
      .some(d => d._id.equals(domainRoot._id));
  }

  const resolveName = (path) => {
    const parts = path.trim().split("/");
    // console.log("parts", parts);

    let current = ""
    let breadcrumb = ""
    for (const p of parts) {
      if (!p) {
        continue;
      }

      current += `/${p}`;
      const grpname = allGroups.find(g => g.path === `${current}/`)?.name
      // console.log(p, current, grpname);
      if (!breadcrumb) {
        breadcrumb = grpname
      } else {
        breadcrumb = `${breadcrumb} > ${grpname}`
      }
    }

    return breadcrumb;
  }

  const breadcrumbsByPath = {}

  for (const g of allGroups) {
    breadcrumbsByPath[g.path] = resolveName(g.path)
  }

  const Attributes = {
    EnableFarmOS: 'groupHasFarmOSAccess',
    EnableCoffeShop: 'groupHasCoffeeShopAccess',
    AllowSubgroupsJoinCoffeeShop: 'allowSubgroupsToJoinCoffeeShop',
    AllowSubgroupAdminsToCreateInstances: 'allowSubgroupAdminsToCreateFarmOSInstances'
  };



  const domainInformation = async (projection) => {
    if (!domainRoot) {
      return null;
    }

    if (isDomainRooInDescendants()) {
      return null;
    }

    const groupSettings = await db
      .collection('farmos-group-settings')
      .findOne({ groupId: domainRoot._id }, { projection: projection });

    const seats = (await db
      .collection('farmos-group-mapping')
      .distinct('instanceName', { groupId: { $in: descendants.map(d => d._id) } })).length;

    return {
      ...groupSettings,
      name: breadcrumbsByPath[group.path],
      seats
    };
  }

  const enableFarmOS = async () => {
    const groupSettings = await db
      .collection('farmos-group-settings')
      .findOne({ groupId: group._id });


    if (groupSettings) {
      return await db
        .collection('farmos-group-settings').updateOne({ groupId: group._id }, { $set: { groupHasFarmOSAccess: true } });
    }


    if (domainRoot == null) { // may become root
      domainRoot = group;
      return createFarmosGroupSettings(group._id, { groupHasFarmOSAccess: true });
    }

    return null;
  }

  const disableFarmOS = async () => {
    const groupSettings = await db
      .collection('farmos-group-settings')
      .findOne({ groupId: group._id });

    if (groupSettings) {
      domainRoot = null;
      return await db
        .collection('farmos-group-settings')
        .updateOne({ groupId: group._id }, { $set: { groupHasFarmOSAccess: false } });
    }

    return null;
  }


  const isEnabled = async (attr) => {
    // console.log("isEnabled", group.name, attr);

    if (!domainRoot) {
      return false;
    }

    const q = {};
    q[attr] = 1;
    const dom = await domainInformation({ ...q });
    // console.log("dom", dom, group.name, attr);
    if (!dom) {
      return false;
    }

    return dom[attr] == undefined ? false : dom[attr];
  }


  const updateAttr = async (attr, val) => {
    const q = {};
    q[attr] = val;

    const groupSettings = await db
      .collection('farmos-group-settings')
      .findOne({ groupId: group._id });


    if (groupSettings) {
      return await db
        .collection('farmos-group-settings').updateOne({ groupId: group._id }, { $set: { ...q } });
    }

    return null;
  }

  const enableAttr = async (attr) => {
    return await updateAttr(attr, true);
  }

  const disableAttr = async (attr) => {
    return await updateAttr(attr, false);
  }

  const isFarmOSEnabled = async () => {
    return await isEnabled(Attributes.EnableFarmOS);
  }



  const hasCoffeeShopAccess = async () => { return isEnabled(Attributes.EnableCoffeShop) }
  const enableCoffeeShop = async () => { return enableAttr(Attributes.EnableCoffeShop) }
  const disableCoffeeShop = async () => { return disableAttr(Attributes.EnableCoffeShop) }
  const hasAllowSubgroupsToJoinCoffeeShop = async () => { return await isEnabled(Attributes.EnableCoffeShop) && await isEnabled(Attributes.AllowSubgroupsJoinCoffeeShop) }
  const enableAllowSubgroupsToJoinCoffeeShop = async () => { return enableAttr(Attributes.AllowSubgroupsJoinCoffeeShop) }
  const disableAllowSubgroupsToJoinCoffeeShop = async () => { return disableAttr(Attributes.AllowSubgroupsJoinCoffeeShop) }
  const hasAllowSubgroupAdminsToCreateFarmOSInstances = async () => { return await isEnabled(Attributes.EnableFarmOS) && await isEnabled(Attributes.AllowSubgroupAdminsToCreateInstances) }
  const enableAllowSubgroupAdminsToCreateFarmOSInstances = async () => { return enableAttr(Attributes.AllowSubgroupAdminsToCreateInstances) }
  const disableAllowSubgroupAdminsToCreateFarmOSInstances = async () => { return disableAttr(Attributes.AllowSubgroupAdminsToCreateInstances) }


  return {
    group,
    descendants,
    ascendants,
    domainRoot,
    isDomainRooInDescendants,
    breadcrumbsByPath,
    canBecomeRoot() {
      return domainRoot == null
    },
    domainInformation,
    isFarmOSEnabled,
    enableFarmOS,
    disableFarmOS,
    hasCoffeeShopAccess,
    enableCoffeeShop,
    disableCoffeeShop,
    hasAllowSubgroupsToJoinCoffeeShop,
    enableAllowSubgroupsToJoinCoffeeShop,
    disableAllowSubgroupsToJoinCoffeeShop,
    hasAllowSubgroupAdminsToCreateFarmOSInstances,
    enableAllowSubgroupAdminsToCreateFarmOSInstances,
    disableAllowSubgroupAdminsToCreateFarmOSInstances,
  }
}

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


export const getMemberInformationForDomain = async (descendants) => {
  const descendantsIds = descendants.map(d => d._id);


  const aggregation = [{
    $match: {
      group: {
        $in: descendantsIds
      }
    }
  }, {
    $project: {
      m_id: '$_id',
      user: 1,
      group: 1,
      admin: {
        $eq: [
          '$role',
          'admin'
        ]
      }
    }
  }, {
    $lookup: {
      from: 'groups',
      localField: 'group',
      foreignField: '_id',
      as: 'group'
    }
  }, {
    $project: {
      m_id: 1,
      admin: 1,
      user: 1,
      path: {
        $arrayElemAt: [
          '$group.path',
          0
        ]
      },
      group_id: {
        $arrayElemAt: [
          '$group._id',
          0
        ]
      }
    }
  }, {
    $lookup: {
      from: 'users',
      localField: 'user',
      foreignField: '_id',
      as: 'user'
    }
  }, {
    $project: {
      m_id: 1,
      admin: 1,
      user: 1,
      path: 1,
      group_id: 1,
      email: {
        $arrayElemAt: [
          '$user.email',
          0
        ]
      },
      user_id: {
        $arrayElemAt: [
          '$user._id',
          0
        ]
      }
    }
  }, {
    $lookup: {
      from: 'farmos-instances',
      localField: 'user_id',
      foreignField: 'userId',
      as: 'farmos_instances'
    }
  }, {
    $lookup: {
      from: 'farmos-group-mapping',
      localField: 'farmos_instances.instanceName',
      foreignField: 'instanceName',
      as: 'group_mappings'
    }
  }];



  const res = await db
    .collection('memberships')
    .aggregate(aggregation)
    .toArray();


  console.log(JSON.stringify(res, null, 2));

  const groupIds = _.uniq(res.flatMap(item => item["group_mappings"].map(gm => gm.groupId)));
  // console.log("groupIds", groupIds);

  const groups = await db.collection('groups').find({
    _id: { $in: groupIds.map(id => new ObjectId(id)) }
  }).toArray();

  // console.log("present groups", JSON.stringify(groups, null, 2));
  console.log("descendants", descendantsIds);
  // console.log("res", res);
  const prj = res.filter(r => r.user !== null && r.user.length != 0).map(item => {
    return {
      user: item.user_id,
      group: item.group_id,
      admin: item.admin,
      path: item.path,
      email: item.email,
      name: item.user.length > 0 ? item.user[0].name : "",
      connectedFarms: item.farmos_instances.map(ins => {
        const groupIds = item.group_mappings.filter(g => g.instanceName == ins.instanceName).map(g => g.groupId);
        let skip = true;

        if (groupIds.some(id => descendantsIds.map(iid => iid + "").includes(id + ""))) {
          skip = false;
        }

        return {
          instanceName: ins.instanceName,
          owner: ins.owner,
          _id: ins._id,
          skip,
          groups: item.group_mappings.filter(g => g.instanceName == ins.instanceName).map(g => ({
            groupId: g.groupId,
            name: groups.find(group => group._id.equals(g.groupId))?.name,
            path: groups.find(group => group._id.equals(g.groupId))?.path
          })),
        }
      })
    }
  });

  const mappedInstances = _.uniq(prj.flatMap(item => item.connectedFarms.map(f => f.instanceName)));
  const farmosInstancesMappedToAllGroups = await db.collection('farmos-group-mapping').find({
    groupId: { $in: descendantsIds }
  }).toArray();

  // console.log("mappedInstances", mappedInstances);
  // console.log("farmosInstancesMappedToAllGroups", farmosInstancesMappedToAllGroups);
  const unassignedInstances = farmosInstancesMappedToAllGroups.filter(instance => !mappedInstances.some(m => m == instance.instanceName));
  // console.log("unassignedInstances", unassignedInstances);

  return {
    members: prj,
    unassignedInstances: unassignedInstances.map(u => ({
      ...u,
      path: groups.find(g => g._id.equals(u.groupId))?.path
    }))
  };
};



/**
 * @param { ObjectId } groupId
 * @param { Boolean } isSuperAdmin
 * @returns JSON answer
 */
export const getGroupInformation = async (groupId, isSuperAdmin = false) => {
  const group = await db.collection("groups").findOne({ _id: asMongoId(groupId) });

  if (!group) {
    throw boom.notFound();
  }

  //know if groupId is a RootGroup or not (=> define setting in JSON response)
  let testedGroupIsRoot = false;

  const tree = await getTree(group);

  // do root in domain
  if (!tree.domainRoot) {
    throw boom.notFound();
  }

  if (groupId.equals(tree.domainRoot._id)) {
    testedGroupIsRoot = true;
  }

  let groupSettings = {};

  groupSettings = await tree.domainInformation({
    groupId: 1,
    groupHasFarmOSAccess: 1,
    groupHasCoffeeShopAccess: 1,
    allowSubgroupsToJoinCoffeeShop: 1,
    allowSubgroupAdminsToCreateFarmOSInstances: 1,
    maxSeats: 1,
    name: group.name
  });

  const seats = { current: groupSettings.seats, max: groupSettings.maxSeats };
  delete groupSettings.maxSeats;
  groupSettings = { ...groupSettings, seats };


  const groupName = tree.breadcrumbsByPath[group.path];
  let groupInformation = { name: groupName };
  //get members part from JSON response
  const membersRawData = await getMemberInformationForDomain(tree.descendants);
  //console.log("membersRawData", JSON.stringify(membersRawData, null, 2));

  for (const member of membersRawData.members) {
    member.breadcrumb = tree.breadcrumbsByPath[member.path]
    for (const farm of member.connectedFarms) {
      for (const g of farm.groups) {
        g.breadcrumb = tree.breadcrumbsByPath[g.path];
      }
    }
  }



  for (const inst of membersRawData.unassignedInstances) {
    inst.breadcrumb = tree.breadcrumbsByPath[inst.path];
  }

  // console.log(JSON.stringify(membersRawData.members, null, 2));

  // by users

  const userIds = _.uniq(membersRawData.members.map(m => m.user + ""));
  const members = [];

  // console.log("userids", userIds);

  for (const userId of userIds) {
    const memberships = membersRawData.members.filter(m => m.user.equals(userId));
    // console.log("memberships", memberships);

    const connectedFarms = [];
    const currentUser = {
      ...memberships[0],
      connectedFarms,
      groups: [],
    };

    for (const m of memberships) {
      for (const connectedFarm of m.connectedFarms) {
        if (!connectedFarms.find(cf => cf.instanceName == connectedFarm.instanceName)) {
          connectedFarms.push(connectedFarm);
        }
      }

      if (!currentUser.groups.find(g => g.id.equals(m.group))) {
        currentUser.groups.push({
          id: m.group,
          breadcrumb: m.breadcrumb,
          path: m.path
        })
      }
    }

    members.push({
      ...currentUser
    });

  }

  groupInformation = { ...groupSettings, isDomainRoot: testedGroupIsRoot, members, unassignedInstances: membersRawData.unassignedInstances };
  return groupInformation;
};


export const getTreeFromGroupId = async (groupId) => {
  const res = await db.collection("groups").findOne({ _id: asMongoId(groupId) });
  if (!res) {
    throw boom.notFound();
  }

  return await getTree(res);
}