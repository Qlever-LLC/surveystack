import bucketService from '../services/bucket.service';
import { db } from '../db';
import { ObjectId } from 'mongodb';
import assert from 'assert';
import slugify from '../helpers/slugify';

const col = 'resources';
const LOCATION_S3 = 's3';

const getResource = async (req, res) => {
  const { id } = req.params;
  // load committed resource
  const resource = await db.collection(col).findOne({ _id: new ObjectId(id), state: 'committed' });
  if (!resource) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`,
    });
  }
  return res.send(resource);
};

const getDownloadURL = async (req, res) => {
  const { key } = req.body;
  let downloadURL = await bucketService.getSignedDownloadUrl(key);
  if (!downloadURL) {
    return res.status(500).send({
      message: `no url returned by bucket service`,
    });
  }
  return res.send(downloadURL);
};

const getUploadURL = async (req, res) => {
  const resource = req.body;

  // TODO validate resource object param

  try {
    // get signed upload url for a fixed contenttype and contentlength
    let signedUrl = await bucketService.getUploadUrl(
      resource.key,
      resource.contentType,
      resource.contentLength
    );
    // add resource entry to our db
    let r = await addResource(resource, res.locals.auth.user._id, LOCATION_S3);
    assert.equal(1, r.insertedCount);
    return res.send({ signedUrl, resourceId: resource._id });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

const addResource = async (resource, userId, location) => {
  resource._id = new ObjectId(resource._id);
  resource.state = 'pending';
  resource.location = location;
  resource.meta = {
    creator: new ObjectId(userId),
    dateCreated: new Date(),
    dateModified: null,
  };
  return await db.collection(col).insertOne(resource);
};

const commitResource = async (req, res) => {
  const { id } = req.params;

  // load resource
  const resource = await db.collection(col).findOne({ _id: new ObjectId(id) });
  if (!resource) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`,
    });
  }

  try {
    // set resource to committed state
    let r = await db.collection(col).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          state: 'committed',
          'meta.dateModified': new Date(),
        },
      }
    );
    assert.equal(1, r.modifiedCount);
    return res.send({ message: 'OK' });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

const deleteResource = async (req, res) => {
  const { id } = req.params;

  // load resource
  const resource = await db.collection(col).findOne({ _id: new ObjectId(id) });
  if (!resource) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`,
    });
  }

  try {
    //delete resource in aws
    const deleteResult = await bucketService.deleteObject(resource.key);
    assert.equal(204, deleteResult.$metadata.httpStatusCode);

    //delete resource in surveystack
    let r = await db.collection(col).deleteOne({ _id: new ObjectId(resource._id) });
    assert.equal(1, r.deletedCount);
    return res.send({ message: 'OK' });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

export default {
  getResource,
  getDownloadURL,
  getUploadURL,
  commitResource,
  deleteResource,
  col,
};
