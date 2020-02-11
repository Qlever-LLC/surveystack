import assert from 'assert';
import { ObjectId } from 'mongodb';

import boom from '@hapi/boom';
import { GROUP_PATH_DELIMITER } from '../constants';

import { db } from '../db';

const col = 'groups';

const getGroups = async (req, res) => {
  let entities;

  if (req.query.path) {
    entities = await db
      .collection(col)
      .find({ path: req.query.path })
      .sort({ name: 1 })
      .toArray();
    return res.send(entities);
  }

  entities = await db
    .collection(col)
    .find({ path: null })
    .toArray();
  return res.send(entities);
};

const getGroupByPath = async (req, res) => {
  console.log('req.params[0] =', req.params[0]);
  let entity;

  const splits = req.params[0].split(GROUP_PATH_DELIMITER).filter(split => split !== '');

  console.log(splits);

  let path = null;
  let name = null;

  if (splits.length === 0) {
    throw boom.badRequest('Invalid path');
  }

  if (splits.length === 1) {
    name = splits[0];
    path = null;
  }

  if (splits.length > 1) {
    name = splits.pop();
    path = GROUP_PATH_DELIMITER + splits.join(GROUP_PATH_DELIMITER) + GROUP_PATH_DELIMITER;
  }

  console.log('path', path);
  console.log('name', name);

  entity = await db.collection(col).findOne({ path, name });

  if (!entity) {
    return res.status(404).send({
      message: `No entity found: path=${path}, name=${name}`,
    });
  }

  return res.send(entity);
};

const getGroupById = async (req, res) => {
  const { id } = req.params;
  let entity;

  entity = await db.collection(col).findOne({ _id: new ObjectId(id) });

  if (!entity) {
    throw boom.notFound(`No entity with _id exists: ${id}`);
  }

  return res.send(entity);
};

const createGroup = async (req, res) => {
  const entity = req.body;
  try {
    let r = await db.collection(col).insertOne({ ...entity, _id: new ObjectId(entity._id) });
    assert.equal(1, r.insertedCount);
    return res.send(r);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(409).send({ message: `Entity with _id already exists: ${entity._id}` });
    }
  }

  return res.status(500).send({ message: 'Internal error' });
};

const updateGroup = async (req, res) => {
  const { id } = req.params;
  const entity = req.body;

  const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });

  try {
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...entity, _id: new ObjectId(id) } },
      {
        returnOriginal: false,
      }
    );

    // also find and modify descendants
    let oldSubgroupPath = `${existing.path}${existing.name}${GROUP_PATH_DELIMITER}`;
    if (existing.path === null) {
      oldSubgroupPath = `${GROUP_PATH_DELIMITER}${existing.name}${GROUP_PATH_DELIMITER}`;
    }

    let newSubgroupPath = `${entity.path}${entity.name}${GROUP_PATH_DELIMITER}`;
    if (entity.path === null) {
      newSubgroupPath = `${GROUP_PATH_DELIMITER}${entity.name}${GROUP_PATH_DELIMITER}`;
    }

    await db
      .collection(col)
      .find({ path: { $regex: `^${oldSubgroupPath}` } })
      .forEach(descendant => {
        console.log(`${descendant.path}${descendant.name}`);
      });
    console.log(`old_name: '${existing.name}' => new_name: '${entity.name}'`);
    console.log(`old_path: '${oldSubgroupPath}' => new_path: '${newSubgroupPath}'`);
    console.log(`This change will affect descendants under '${oldSubgroupPath}'`);

    await bulkChangePaths(oldSubgroupPath, newSubgroupPath);

    return res.send(updated);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

// mongodb 4.2 now allows an aggregation pipeline inside "update"
const bulkChangePaths = async (oldPath, newPath) => {
  await db.collection(col).updateMany({ path: { $regex: `^${oldPath}` } }, [
    {
      $set: {
        path: {
          $concat: [newPath, { $substr: ['$path', { $strLenBytes: oldPath }, -1] }],
        },
      },
    },
  ]);
};

// https://stackoverflow.com/questions/25507866/how-can-i-use-a-cursor-foreach-in-mongodb-using-node-js/56333962#56333962
const bulkChangePaths2 = async (oldPath, newPath) => {
  // Double the value of the 'foo' field in all documents
  let bulkWrites = [];
  const bulkDocumentsSize = 100; // how many documents to write at once
  let i = 0;
  await db
    .collection(col)
    .find({ path: { $regex: `^${oldPath}` } })
    .forEach(async doc => {
      i++;

      // Update the document...
      doc.path = doc.path.replace(oldPath, newPath);

      // Add the update to an array of bulk operations to execute later
      bulkWrites.push({
        updateOne: {
          filter: { _id: doc._id },
          update: doc,
        },
      });

      // Update the documents and log progress every `bulkDocumentsSize` documents
      if (i % bulkDocumentsSize === 0) {
        await db.collection(col).bulkWrite(bulkWrites);
        bulkWrites = [];
        console.log(`Updated ${i} documents`);
      }
    });
  // Flush the last <100 bulk writes
  if (bulkWrites.length > 0) {
    await db.collection(col).bulkWrite(bulkWrites);
  }
};

const deleteGroup = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db.collection(col).findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).send({
        message: `No entity with _id exists: ${id}`,
      });
    }
    let r = await db.collection(col).deleteOne({ _id: new ObjectId(id) });
    assert.equal(1, r.deletedCount);
    return res.send({ message: 'OK' });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

export default {
  getGroups,
  getGroupByPath,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
};
