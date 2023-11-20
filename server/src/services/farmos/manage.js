import { ObjectId } from 'mongodb';
import { db } from '../../db';
import { aggregator } from './aggregator';
import uniq from 'lodash/uniq';
import boom from '@hapi/boom';
import { getDescendantGroups, getAscendantGroups } from '../roles.service';
import { addGroupToCoffeeShop, isCoffeeShopEnabled, removeGroupFromCoffeeShop } from './coffeeshop';
import mailService from '../../services/mail/mail.service';
import { createMagicLink } from '../auth.service';

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
 * @param { Object } group who contains attribute path
 * @returns root group ID or null;
 * is RootGroup if group has an entry in farmos-group-settings
 */
export const getFarmOSRootGroup = async (ascendantGroups, descendantGroups) => {
  const union = [...ascendantGroups, ...descendantGroups];

  const ids = union.map((g) => g._id);

  const res = await db
    .collection('farmos-group-settings')
    .find({
      groupId: {
        $in: ids,
      },
    })
    .toArray();

  if (res.length == 0) {
    return null;
  }

  return union.find((g) => g._id.equals(res[0].groupId));
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

    return descendants
      .filter((d) => !d._id.equals(group._id) /* exclude self*/)
      .some((d) => d._id.equals(domainRoot._id));
  };

  const resolveName = (path) => {
    const parts = path.trim().split('/');
    // console.log("parts", parts);

    let current = '';
    let breadcrumb = '';
    for (const p of parts) {
      if (!p) {
        continue;
      }

      current += `/${p}`;
      const grpname = allGroups.find((g) => g.path === `${current}/`)?.name;
      // console.log(p, current, grpname);
      if (!breadcrumb) {
        breadcrumb = grpname;
      } else {
        breadcrumb = `${breadcrumb} > ${grpname}`;
      }
    }

    return breadcrumb;
  };

  const breadcrumbsByPath = {};

  for (const g of allGroups) {
    breadcrumbsByPath[g.path] = resolveName(g.path);
  }

  const Attributes = {
    EnableFarmOS: 'groupHasFarmOSAccess',
    AllowSubgroupsJoinCoffeeShop: 'allowSubgroupsToJoinCoffeeShop',
    AllowSubgroupAdminsToCreateInstances: 'allowSubgroupAdminsToCreateFarmOSInstances',
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

    const seats = (
      await db
        .collection('farmos-group-mapping')
        .distinct('instanceName', { groupId: { $in: descendants.map((d) => d._id) } })
    ).length;

    return {
      ...groupSettings,
      name: breadcrumbsByPath[group.path],
      seats,
    };
  };

  const enableFarmOS = async () => {
    const groupSettings = await db
      .collection('farmos-group-settings')
      .findOne({ groupId: group._id });

    if (groupSettings) {
      return await db
        .collection('farmos-group-settings')
        .updateOne({ groupId: group._id }, { $set: { groupHasFarmOSAccess: true } });
    }

    if (domainRoot == null) {
      // may become root
      domainRoot = group;
      await createFarmosGroupSettings(group._id, { groupHasFarmOSAccess: true });
      return;
    }

    return null;
  };

  const disableFarmOS = async () => {
    const groupSettings = await db
      .collection('farmos-group-settings')
      .findOne({ groupId: group._id });

    if (groupSettings) {
      domainRoot = null;
      await db.collection('farmos-group-settings').deleteMany({ groupId: group._id });
      return {
        status: 'success',
      };
    }

    return null;
  };

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
  };

  const updateAttr = async (attr, val) => {
    const q = {};
    q[attr] = val;

    const groupSettings = await db
      .collection('farmos-group-settings')
      .findOne({ groupId: group._id });

    if (groupSettings) {
      return await db
        .collection('farmos-group-settings')
        .updateOne({ groupId: group._id }, { $set: { ...q } });
    }

    return null;
  };

  const enableAttr = async (attr) => {
    return await updateAttr(attr, true);
  };

  const disableAttr = async (attr) => {
    return await updateAttr(attr, false);
  };

  const isFarmOSEnabled = async () => {
    return await isEnabled(Attributes.EnableFarmOS);
  };

  const hasCoffeeShopAccess = async () => {
    return await isCoffeeShopEnabled(group._id);
  };
  const enableCoffeeShop = async () => {
    await addGroupToCoffeeShop(group._id);
  };
  const disableCoffeeShop = async () => {
    await removeGroupFromCoffeeShop(group._id);
  };
  const hasAllowSubgroupsToJoinCoffeeShop = async () => {
    return await isEnabled(Attributes.AllowSubgroupsJoinCoffeeShop);
  };
  const enableAllowSubgroupsToJoinCoffeeShop = async () => {
    return enableAttr(Attributes.AllowSubgroupsJoinCoffeeShop);
  };
  const disableAllowSubgroupsToJoinCoffeeShop = async () => {
    return disableAttr(Attributes.AllowSubgroupsJoinCoffeeShop);
  };
  const hasAllowSubgroupAdminsToCreateFarmOSInstances = async () => {
    return (
      (await isEnabled(Attributes.EnableFarmOS)) &&
      (await isEnabled(Attributes.AllowSubgroupAdminsToCreateInstances))
    );
  };
  const enableAllowSubgroupAdminsToCreateFarmOSInstances = async () => {
    return enableAttr(Attributes.AllowSubgroupAdminsToCreateInstances);
  };
  const disableAllowSubgroupAdminsToCreateFarmOSInstances = async () => {
    return disableAttr(Attributes.AllowSubgroupAdminsToCreateInstances);
  };

  return {
    group,
    descendants,
    ascendants,
    domainRoot,
    isDomainRooInDescendants,
    breadcrumbsByPath,
    canBecomeRoot() {
      return domainRoot == null;
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
  };
};

export const getOwnersFromInstanceName = async (instanceName) => {
  const instanceOwners = await db
    .collection('farmos-instances')
    .find({
      instanceName,
      owner: true,
    })
    .toArray();
  if (instanceOwners.length === 0) {
    return [];
  }
  const ownersId = instanceOwners.map((ownerInstance) => ownerInstance.userId);
  return await db
    .collection('users')
    .find({
      _id: { $in: ownersId.map((id) => asMongoId(id)) },
    })
    .toArray();
};

/**
 * The user receives ownership over the farmos instance
 */
export const mapFarmOSInstanceToUser = async (userId, instanceName, isOwner, origin) => {
  const res = await db
    .collection('farmos-instances')
    .find({
      instanceName,
      userId: new ObjectId(userId),
    })
    .toArray();

  if (res.length > 0) {
    throw boom.badData('instance mapping already exists');
  }

  const user = await db.collection('users').findOne({
    _id: new ObjectId(userId),
  });
  if (!user) {
    throw boom.badData('user not found');
  }

  const _id = new ObjectId();
  await db.collection('farmos-instances').insertOne({
    _id,
    userId: new ObjectId(userId),
    instanceName,
    owner: isOwner,
  });

  await sendEmailToNewlyMappedUserAndOwners(user, instanceName, origin);

  return {
    _id,
    userId,
    instanceName,
    isOwner,
  };
};

export const sendEmailToNewlyMappedUserAndOwners = async (user, instanceName, origin) => {
  // send email to instance owner(s)
  const instanceOwners = await getOwnersFromInstanceName(instanceName);
  for (const instanceOwner of instanceOwners) {
    if (instanceOwner && instanceOwner.email && instanceOwner.email !== user.email) {
      const ownerEmail = instanceOwner.email;

      const magicLinkProfile = await createMagicLink({
        origin,
        email: ownerEmail,
        expiresAfterDays: 7,
        landingPath: `/auth/profile`,
      });

      const subject = 'Your instance has been mapped';
      const description = `The email ${user.email} has been mapped to the farmOS instance ${instanceName} in SurveyStack.`;
      await mailService.sendHandleNotification({
        to: ownerEmail,
        subject: subject,
        link: magicLinkProfile,
        actionDescriptionHtml: description,
        actionDescriptionText: description,
      });
    }
  }

  // send email to newly mapped user
  const magicLinkProfile = await createMagicLink({
    origin,
    email: user.email,
    expiresAfterDays: 7,
    landingPath: `/auth/profile`,
  });

  const subject = 'You have been mapped';
  const description = `You have been mapped to the farmOS instance ${instanceName} in SurveyStack.`;
  await mailService.sendHandleNotification({
    to: user.email,
    subject: subject,
    link: magicLinkProfile,
    actionDescriptionHtml: description,
    actionDescriptionText: description,
  });
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

export const getSuperAllFarmosNotes = async () => {
  const allNotes = await db.collection('farmos-instance-notes').find().toArray();
  return allNotes;
};

export const moveFarmFromMultGroupToMultSurveystackGroupAndSendNotification = async (
  instanceName,
  oldGroupIds,
  newGroupIds,
  origin
) => {
  await sendUserMoveFarmFromMultGroupToMultSurveystackGroupNotification(
    instanceName,
    oldGroupIds,
    newGroupIds,
    origin
  );
  for (const oldGroupId of oldGroupIds) {
    await removeFarmFromSurveystackGroup(instanceName, oldGroupId);
  }
  for (const newGroupId of newGroupIds) {
    await addFarmToSurveystackGroup(instanceName, newGroupId);
  }
};

export const addFarmToSurveystackGroupAndSendNotification = async (
  instanceName,
  groupId,
  origin
) => {
  try {
    await sendUserAddFarmToSurveystackGroupNotification(instanceName, groupId, origin);
  } catch (error) {
    console.log(error);
  }
  return await addFarmToSurveystackGroup(instanceName, groupId);
};

export const createFarmOSInstanceForUserAndGroup = async (
  userId,
  groupId,
  instanceName,
  userIsOwner,
  origin
) => {
  await mapFarmOSInstanceToUser(userId, instanceName, userIsOwner, origin);
  return await addFarmToSurveystackGroupAndSendNotification(instanceName, groupId, origin);
};

const addFarmToSurveystackGroup = async (instanceName, groupId) => {
  const res = await db
    .collection('farmos-group-mapping')
    .find({
      instanceName,
      groupId: asMongoId(groupId),
    })
    .toArray();

  if (res.length > 0) {
    throw boom.badData('group mapping already exists');
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
  });

  return { _id };
};

export const removeFarmFromSurveystackGroupAndSendNotification = async (
  instanceName,
  groupId,
  origin
) => {
  await sendUserRemoveFarmFromSurveystackGroupNotification(instanceName, groupId, origin);
  return await removeFarmFromSurveystackGroup(instanceName, groupId);
};

export const removeFarmFromSurveystackGroup = async (instanceName, groupId) => {
  await db
    .collection('farmos-group-mapping')
    .deleteMany({ instanceName, groupId: asMongoId(groupId) });
};

const extractGroupNameForMailing = async (groupId) => {
  const group = await db.collection('groups').findOne({
    _id: asMongoId(groupId),
  });

  if (!group || !group.name) {
    throw boom.badData('group name not found');
  }
  return group.name;
};

export const sendUserMoveFarmFromMultGroupToMultSurveystackGroupNotification = async (
  instanceName,
  oldGroupIds,
  newGroupIds,
  origin
) => {
  const owners = await getOwnersFromInstanceName(instanceName);
  for (const owner of owners) {
    if (owner && owner.email) {
      const ownerEmail = owner.email;

      const oldGroupNamesList = [];
      for (const groupId of oldGroupIds) {
        oldGroupNamesList.push(await extractGroupNameForMailing(groupId));
      }
      const oldGroupNames = oldGroupNamesList.join(', ');

      const newGroupNamesList = [];
      for (const groupId of newGroupIds) {
        newGroupNamesList.push(await extractGroupNameForMailing(groupId));
      }
      const newGroupNames = newGroupNamesList.join(', ');

      const magicLinkProfile = await createMagicLink({
        origin,
        email: ownerEmail,
        expiresAfterDays: 7,
        landingPath: `/auth/profile`,
      });

      const subject = 'Your instance has been moved to another group';
      const description = `Your farmOS instance ${instanceName} has been removed from the group ${oldGroupNames} and added to the group ${newGroupNames} in SurveyStack.`;
      await mailService.sendHandleNotification({
        to: ownerEmail,
        subject: subject,
        link: magicLinkProfile,
        actionDescriptionHtml: description,
        actionDescriptionText: description,
      });
    }
  }
};

export const sendUserAddFarmToSurveystackGroupNotification = async (
  instanceName,
  groupId,
  origin
) => {
  const groupName = await extractGroupNameForMailing(groupId);

  await sendAddNotification(instanceName, groupName, origin);
};

export const sendUserAddFarmToMultipleSurveystackGroupNotification = async (
  instanceName,
  groupIds,
  origin
) => {
  const groupsName = [];
  for (const groupId of groupIds) {
    groupsName.push(await extractGroupNameForMailing(groupId));
  }
  const groupsNameConcat = groupsName.join(', ');

  await sendAddNotification(instanceName, groupsNameConcat, origin);
};

const sendAddNotification = async (instanceName, groupName, origin) => {
  const subject = 'Your instance has been added to a group';
  const description = `Your farmOS instance ${instanceName} has been added to the group ${groupName} in SurveyStack.`;

  await sendHandleNotification(instanceName, origin, subject, description);
};

const sendUserRemoveFarmFromSurveystackGroupNotification = async (
  instanceName,
  groupId,
  origin
) => {
  const groupName = await extractGroupNameForMailing(groupId);

  await sendRemoveNotification(instanceName, groupName, origin);
};

export const sendUserRemoveFarmFromMultipleSurveystackGroupsNotification = async (
  instanceName,
  groupIds,
  origin
) => {
  const groupsName = [];
  for (const groupId of groupIds) {
    groupsName.push(await extractGroupNameForMailing(groupId));
  }
  const groupsNameConcat = groupsName.join(', ');

  await sendRemoveNotification(instanceName, groupsNameConcat, origin);
};

const sendRemoveNotification = async (instanceName, groupName, origin) => {
  const subject = 'Your instance has been removed from a group';
  const description = `Your farmOS instance ${instanceName} has been removed from the group ${groupName} in SurveyStack.`;

  await sendHandleNotification(instanceName, origin, subject, description);
};

const sendHandleNotification = async (instanceName, origin, subject, description) => {
  const owners = await getOwnersFromInstanceName(instanceName);
  for (const owner of owners) {
    if (owner && owner.email) {
      const ownerEmail = owner.email;

      const magicLinkProfile = await createMagicLink({
        origin,
        email: ownerEmail,
        expiresAfterDays: 7,
        landingPath: `/auth/profile`,
      });

      await mailService.sendHandleNotification({
        to: ownerEmail,
        subject: subject,
        link: magicLinkProfile,
        actionDescriptionHtml: description,
        actionDescriptionText: description,
      });
    }
  }
};

export const removeFarmFromUser = async (instanceName, userId) => {
  const filter = { instanceName, userId: asMongoId(userId) };

  await db.collection('farmos-instances').deleteMany(filter);
};

export const createPlan = (planName, planUrl) =>
  db.collection('farmos-plans').insertOne({
    _id: new ObjectId(),
    planName,
    planUrl,
  });

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
    .updateOne({ groupId: asMongoId(groupId) }, { $set: { planIds: [planId] } });
};

export const getPlanForGroup = async (groupId) => {
  const group = await db.collection('groups').findOne({ _id: asMongoId(groupId) });

  if (!group) {
    throw boom.notFound();
  }

  const tree = await getTree(group);

  const settings = await db
    .collection('farmos-group-settings')
    .findOne({ groupId: tree.domainRoot._id }, { projection: { planIds: 1 } });

  if (!settings) {
    return [];
  }

  const plans = await db
    .collection('farmos-plans')
    .find({
      _id: {
        $in: settings.planIds,
      },
    })
    .toArray();

  return plans;
};

// TODO unit test for settings part
export const createFarmosGroupSettings = (groupId, specification) =>
  db.collection('farmos-group-settings').insertOne({
    _id: new ObjectId(),
    groupId: asMongoId(groupId),
    planIds: [],
    groupHasFarmOSAccess: true,
    allowSubgroupsToJoinCoffeeShop: false,
    allowSubgroupAdminsToCreateFarmOSInstances: false,
    maxSeats: 20,
    ...specification,
  });

export const setGroupSettings = (groupId, settings) =>
  db
    .collection('farmos-group-settings')
    .updateOne({ groupId: asMongoId(groupId) }, { $set: settings });

/**
 * @param {*} groupId
 * @param {*} projection
 * @returns without projection, dimension farmos-group-settings is like:
 * _id, groupId, planIds, groupHasFarmOSAccess, allowSubgroupsToJoinCoffeeShop, allowSubgroupAdminsToCreateFarmOSInstances, maxSeats
 */
export const getGroupSettings = async (groupId, projection = {}) => {
  return await db
    .collection('farmos-group-settings')
    .findOne({ groupId: asMongoId(groupId) }, { projection: projection });
};

export const getMemberInformationForDomain = async (descendants) => {
  const descendantsIds = descendants.map((d) => d._id);

  const aggregation = [
    {
      $match: {
        group: {
          $in: descendantsIds,
        },
      },
    },
    {
      $project: {
        m_id: '$_id',
        user: 1,
        group: 1,
        admin: {
          $eq: ['$role', 'admin'],
        },
      },
    },
    {
      $lookup: {
        from: 'groups',
        localField: 'group',
        foreignField: '_id',
        as: 'group',
      },
    },
    {
      $project: {
        m_id: 1,
        admin: 1,
        user: 1,
        path: {
          $arrayElemAt: ['$group.path', 0],
        },
        group_id: {
          $arrayElemAt: ['$group._id', 0],
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $project: {
        m_id: 1,
        admin: 1,
        user: 1,
        path: 1,
        group_id: 1,
        email: {
          $arrayElemAt: ['$user.email', 0],
        },
        user_id: {
          $arrayElemAt: ['$user._id', 0],
        },
      },
    },
    {
      $lookup: {
        from: 'farmos-instances',
        localField: 'user_id',
        foreignField: 'userId',
        as: 'farmos_instances',
      },
    },
    {
      $lookup: {
        from: 'farmos-group-mapping',
        localField: 'farmos_instances.instanceName',
        foreignField: 'instanceName',
        as: 'group_mappings',
      },
    },
  ];

  const res = await db.collection('memberships').aggregate(aggregation).toArray();
  const domainGroups = await db
    .collection('groups')
    .find(
      {
        _id: {
          $in: descendantsIds,
        },
      },
      {
        projection: {
          _id: 1,
          name: 1,
          path: 1,
          slug: 1,
          dir: 1,
        },
      }
    )
    .toArray();

  // console.log('descendant groups', domainGroups);

  // console.log(JSON.stringify(res, null, 2));

  const groupIds = uniq(res.flatMap((item) => item['group_mappings'].map((gm) => gm.groupId)));
  // console.log("groupIds", groupIds);

  const groups = await db
    .collection('groups')
    .find({
      _id: { $in: groupIds.map((id) => new ObjectId(id)) },
    })
    .toArray();

  // console.log("present groups", JSON.stringify(groups, null, 2));
  // console.log("descendants", descendantsIds);
  // console.log("res", res);
  const prj = res
    .filter((r) => r.user !== null && r.user.length != 0)
    .map((item) => {
      return {
        user: item.user_id,
        group: item.group_id,
        admin: item.admin,
        path: item.path,
        email: item.email,
        name: item.user.length > 0 ? item.user[0].name : '',
        connectedFarms: item.farmos_instances.map((ins) => {
          const groupIds = item.group_mappings
            .filter((g) => g.instanceName == ins.instanceName)
            .map((g) => g.groupId);
          let skip = true;

          if (groupIds.some((id) => descendantsIds.map((iid) => iid + '').includes(id + ''))) {
            skip = false;
          }

          return {
            instanceName: ins.instanceName,
            owner: ins.owner,
            _id: ins._id,
            skip,
            groups: item.group_mappings
              .filter((g) => g.instanceName == ins.instanceName)
              .map((g) => ({
                groupId: g.groupId,
                name: groups.find((group) => group._id.equals(g.groupId))?.name,
                path: groups.find((group) => group._id.equals(g.groupId))?.path,
              })),
          };
        }),
      };
    });

  const mappedInstances = uniq(
    prj.flatMap((item) => item.connectedFarms.map((f) => f.instanceName))
  );
  const farmosInstancesMappedToAllGroups = await db
    .collection('farmos-group-mapping')
    .find({
      groupId: { $in: descendantsIds },
    })
    .toArray();

  // console.log("mappedInstances", mappedInstances);
  // console.log("farmosInstancesMappedToAllGroups", farmosInstancesMappedToAllGroups);
  const unassignedInstances = farmosInstancesMappedToAllGroups.filter(
    (instance) => !mappedInstances.some((m) => m == instance.instanceName)
  );
  // console.log("unassignedInstances", unassignedInstances);

  // strip out all unrelated groups from members.connectedFarms.groups

  prj.forEach((m) => {
    m.connectedFarms.forEach((f) => {
      f.groups = f.groups.filter((g) => descendants.some((d) => d._id + '' == g.groupId + ''));
    });

    // m.connectedFarms = m.connectedFarms.filter((f) => f.groups.length > 0);
  });

  return {
    members: prj,
    unassignedInstances: unassignedInstances.map((u) => ({
      ...u,
      path: groups.find((g) => g._id.equals(u.groupId))?.path,
    })),
    domainGroups,
  };
};

/**
 * @param { ObjectId } groupId
 * @param { Boolean } isSuperAdmin
 * @returns JSON answer
 */
export const getGroupInformation = async (groupId, isSuperAdmin = false) => {
  const group = await db.collection('groups').findOne({ _id: asMongoId(groupId) });

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
    planIds: 1,
    groupHasFarmOSAccess: 1,
    allowSubgroupsToJoinCoffeeShop: 1,
    allowSubgroupAdminsToCreateFarmOSInstances: 1,
    maxSeats: 1,
    name: group.name,
  });

  groupSettings.groupHasCoffeeShopAccess = await isCoffeeShopEnabled(group._id);

  const seats = { current: groupSettings.seats, max: groupSettings.maxSeats };
  delete groupSettings.maxSeats;
  groupSettings = { ...groupSettings, seats };

  const groupName = tree.breadcrumbsByPath[group.path];
  let groupInformation = { name: groupName };
  //get members part from JSON response
  const membersRawData = await getMemberInformationForDomain(tree.descendants);
  //console.log("membersRawData", JSON.stringify(membersRawData, null, 2));

  for (const member of membersRawData.members) {
    member.breadcrumb = tree.breadcrumbsByPath[member.path];
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

  const userIds = uniq(membersRawData.members.map((m) => m.user + ''));
  const members = [];

  // console.log("userids", userIds);

  for (const userId of userIds) {
    const memberships = membersRawData.members.filter((m) => m.user.equals(userId));
    // console.log("memberships", memberships);

    const connectedFarms = [];
    const currentUser = {
      ...memberships[0],
      connectedFarms,
      groups: [],
    };

    for (const m of memberships) {
      for (const connectedFarm of m.connectedFarms) {
        if (!connectedFarms.find((cf) => cf.instanceName == connectedFarm.instanceName)) {
          connectedFarms.push(connectedFarm);
        }
      }

      if (!currentUser.groups.find((g) => g.id.equals(m.group))) {
        currentUser.groups.push({
          id: m.group,
          breadcrumb: m.breadcrumb,
          path: m.path,
        });
      }
    }

    members.push({
      ...currentUser,
    });
  }

  groupInformation = {
    ...groupSettings,
    isDomainRoot: testedGroupIsRoot,
    members,
    unassignedInstances: membersRawData.unassignedInstances,
    domainGroups: membersRawData.domainGroups,
  };
  return groupInformation;
};

export const getTreeFromGroupId = async (groupId) => {
  const res = await db.collection('groups').findOne({ _id: asMongoId(groupId) });
  if (!res) {
    throw boom.notFound();
  }

  return await getTree(res);
};

const updateSubgroupsToJoinCoffeeShop = async (groupId, enable) => {
  const res = await db.collection('groups').findOne({ _id: asMongoId(groupId) });
  if (!res) {
    throw boom.notFound();
  }

  const tree = await getTree(res);

  if (!asMongoId(groupId).equals(tree.domainRoot._id)) {
    throw boom.badData('Group is not a farmos domain root group');
  }

  return enable
    ? await tree.enableAllowSubgroupsToJoinCoffeeShop()
    : await tree.disableAllowSubgroupsToJoinCoffeeShop();
};

export const enableSubgroupsToJoinCoffeeShop = async (groupId) => {
  return await updateSubgroupsToJoinCoffeeShop(groupId, true);
};

export const disableSubgroupsToJoinCoffeeShop = async (groupId) => {
  return await updateSubgroupsToJoinCoffeeShop(groupId, false);
};

const updateSubgroupsAllowCreateInstances = async (groupId, enable) => {
  const res = await db.collection('groups').findOne({ _id: asMongoId(groupId) });
  if (!res) {
    throw boom.notFound();
  }

  const tree = await getTree(res);

  if (!asMongoId(groupId).equals(tree.domainRoot._id)) {
    throw boom.badData('Group is not a farmos domain root group');
  }

  return enable
    ? await tree.enableAllowSubgroupAdminsToCreateFarmOSInstances()
    : await tree.disableAllowSubgroupAdminsToCreateFarmOSInstances();
};

export const enableSubgroupsAllowCreateInstances = async (groupId) => {
  return await updateSubgroupsAllowCreateInstances(groupId, true);
};

export const disableSubgroupsAllowCreateInstances = async (groupId) => {
  return await updateSubgroupsAllowCreateInstances(groupId, false);
};

const updateEnableCoffeeShop = async (groupId, enable) => {
  const res = await db.collection('groups').findOne({ _id: asMongoId(groupId) });
  if (!res) {
    throw boom.notFound();
  }

  const tree = await getTree(res);

  if (!asMongoId(groupId).equals(tree.domainRoot._id)) {
    // check if subgroup can enable coffeeshop
    if (!(await tree.hasAllowSubgroupsToJoinCoffeeShop())) {
      throw boom.badData('Subgroups are not allowed to enable coffeeshop');
    }
  }

  return enable ? await tree.enableCoffeeShop() : await tree.disableCoffeeShop();
};

export const enableCoffeeshop = async (groupId) => {
  return await updateEnableCoffeeShop(groupId, true);
};

export const disableCoffeeshop = async (groupId) => {
  return await updateEnableCoffeeShop(groupId, false);
};
