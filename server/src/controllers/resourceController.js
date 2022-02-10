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
  let downloadURL = await bucketService.getDownloadUrl(key);
  if (!downloadURL) {
    return res.status(500).send({
      message: `no url returned by bucket service`,
    });
  }
  return res.send(downloadURL);
};

const getUploadURL = async (req, res) => {
  const { resourceName, contentLength, contentType } = req.body;
  // define s3 file key containing unique uuid to prevent filename collision, allowed characters see https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
  let resourceId = new ObjectId();
  let key = 'resources/' + resourceId + '/' + resourceName;

  try {
    // get signed upload url for a fixed contenttype and contentlength
    let signedUrl = await bucketService.getUploadUrl(key, contentType, contentLength);
    // add resource entry to our db
    let r = await addResource(
      resourceId,
      LOCATION_S3,
      key,
      resourceName,
      contentLength,
      contentType,
      res.locals.auth.user._id
    );
    assert.equal(1, r.insertedCount);
    return res.send({ signedUrl, resourceId });
  } catch (error) {
    return res.status(500).send({ message: 'Ouch :/' });
  }
};

const addResource = async (
  resourceId,
  location,
  key,
  resourceName,
  contentLength,
  contentType,
  userId
) => {
  //insert resource entry with state=pending
  let resource = {
    _id: resourceId,
    name: slugify(resourceName),
    label: resourceName,
    state: 'pending',
    location: location,
    key: key,
    contentLength: contentLength,
    contentType: contentType,
    meta: {
      creator: new ObjectId(userId),
      dateCreated: new Date(),
      dateModified: null,
    },
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
