import bucketService from '../services/bucket.service';
import { db } from '../db';
import { ObjectId } from 'mongodb';
import assert from 'assert';
import slugify from '../helpers/slugify';

const col = 'resources';

const getResource = async (req, res) => {
  const { id } = req.query;
  // load resources
  const resources = await db
    .collection(col)
    .find({ _id: new ObjectId(id), state: 'committed' })
    .toArray();
  return res.send(resources);
};

const getDownloadURL = async (req, res) => {
  const { key } = req.query;
  let downloadURL = await bucketService.getDownloadUrl(key);
  return res.send(downloadURL);
};

const getUploadURL = async (req, res) => {
  const { resourceName, contentLength, contentType } = req.body;
  // define s3 file key containing unique uuid to prevent filename collision, allowed characters see https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
  let resourceId = new ObjectId();
  let key = 'resources/' + resourceId +'/' + resourceName;
  // get signed upload url for a fixed contenttype and contentlength
  let signedUrl = await bucketService.getUploadUrl(key, contentType, contentLength);
  // add resource entry to our db
  await addResource(resourceId, key, resourceName, contentLength, contentType, res.locals.auth.user._id);
  return res.send({ signedUrl, resourceId });
};

const addResource = async (resourceId, key, resourceName, contentLength, contentType, userId) => {
  //insert resource entry with state=pending
  let resource = {
    _id: resourceId,
    name: slugify(resourceName),
    label: resourceName,
    state: 'pending',
    key: key,
    contentLength: contentLength,
    contentType: contentType,
    meta: {
      creator: new ObjectId(userId),
      dateCreated: new Date(),
      dateModified: null,
    },
  };
  // TODO find a good pattern in use for error handling
  await db.collection(col).insertOne(resource);
};

const commitResource = async (req, res) => {
  const { id } = req.params;
  const resource = await db.collection(col).findOne({ _id: id });
  if (!resource) {
    return res.status(404).send({
      message: `No entity with _id exists: ${id}`,
    });
  }
  // TODO find a good pattern in use for error handling
  await db.collection(col).updateOne(
    { _id: id },
    {
      $set: {
        state: 'committed',
        "meta.dateModified": new Date()
      },
    }
  );
  res.send({ message: 'OK' });
};

const deleteResource = async (req, res) => {
  const { id } = req.params;

  // load resource
  const resource = await db.collection(col).findOne({ _id: new ObjectId(id) });
  if (!resource) {
    return res.status(404).send({ message: 'Not found' });
  }

  //delete resource in aws
  const deleteResult = await bucketService.deleteObject(resource.key);
  //TODO handle s3 delete errors
  console.log(deleteResult);

  //delete resource
  try {
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
