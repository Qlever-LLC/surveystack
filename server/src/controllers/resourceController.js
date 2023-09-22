import bucketService from '../services/bucket.service';
import { db } from '../db';
import { ObjectId } from 'mongodb';
import assert from 'assert';

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

  // validate resource object param
  if (!resource._id || !resource.key || !resource.contentLength) {
    return res.status(500).send({ message: 'Incomplete message body supplied' });
  }
  if (resource.state === 'committed' || resource.state === 'pending') {
    return res
      .status(500)
      .send({ message: 'Illegal resource state, must not be committed or pending' });
  }

  try {
    // get signed upload url for a fixed contenttype and contentlength
    let signedUrl = await bucketService.getUploadUrl(
      resource.key,
      resource.contentType,
      resource.contentLength
    );
    // add resource entry to our db
    const insertResult = await addResource(resource, res.locals.auth.user, LOCATION_S3);
    assert.equal(insertResult?.acknowledged, true);
    return res.send({ signedUrl });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

const addResource = async (resource, user, location) => {
  resource._id = new ObjectId(resource._id);
  resource.state = 'pending';
  resource.location = location;
  resource.meta = {
    creator: user ? new ObjectId(user._id) : null,
    dateCreated: new Date(),
    dateModified: null,
  };
  return db.collection(col).insertOne(resource);
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
    const updateResult = await db.collection(col).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          state: 'committed',
          'meta.dateModified': new Date(),
        },
      }
    );
    assert.equal(1, updateResult.modifiedCount);
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
    const result = await db.collection(col).deleteOne({ _id: new ObjectId(resource._id) });
    assert.equal(1, result.deletedCount);
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
