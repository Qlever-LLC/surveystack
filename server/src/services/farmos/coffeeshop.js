import boom from '@hapi/boom';
import { ObjectId } from 'mongodb';
import { db } from '../../db';

export const asMongoId = (source) => {
  if (source instanceof ObjectId || typeof source === 'string') {
    return source instanceof ObjectId ? source : ObjectId(source);
  }

  throw boom.badData(`not an objectId: ${source}`);
};

export const validateGroup = async (groupId) => {
  const group = await db.collection('groups').findOne({ _id: asMongoId(groupId) });
  if (!group) {
    throw boom.badData(`group not found: ${groupId}`);
  }
  return group;
};

export const addGroupToCoffeeShop = async (groupId) => {
  const group = await validateGroup(groupId);

  const setting = await db.collection('farmos-coffeeshop').findOne({
    group: group._id,
  });

  if (setting) {
    throw boom.badData('group already added to coffeeshop');
  }

  return await db.collection('farmos-coffeeshop').insertOne({
    _id: new ObjectId(),
    group: group._id,
  });
};

export const removeGroupFromCoffeeShop = async (groupId) => {
  const group = await validateGroup(groupId);

  const setting = await db.collection('farmos-coffeeshop').findOne({
    group: group._id,
  });

  if (!setting) {
    throw boom.badData(`group has coffeeshop disabled: ${groupId}`);
  }

  return await db.collection('farmos-coffeeshop').deleteOne({
    _id: setting._id,
  });
};

export const isCoffeeShopEnabled = async (groupId) => {
  const group = await validateGroup(groupId);

  return (await db.collection('farmos-coffeeshop').findOne({ group: group._id })) !== null;
};
