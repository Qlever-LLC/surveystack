import bucketService from '../services/bucket.service';
import uuidv4 from 'uuid/v4';
import { db } from '../db';
import { ObjectId } from 'mongodb';
import assert from 'assert';

const col = 'resources';

const getResources = async (req, res) => {
  const { surveyId } = req.query;
  // load resources
  const resources = await db
    .collection(col)
    .find({ surveyId: new ObjectId(surveyId), state: 'committed' })
    .toArray();
  return res.send(resources);
};

const getDownloadURL = async (req, res) => {
  const { key } = req.query;
  let downloadURL = await bucketService.getDownloadUrl(key);
  return res.send(downloadURL);
};

const getUploadURL = async (req, res) => {
  const { surveyId, filename, contentlength, contenttype } = req.body;
  // define s3 file key containing unique uuid to prevent filename collision, allowed characters see https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
  let key = 'resources/surveys/' + surveyId + '/' + uuidv4() + '_' + filename;
  // get signed upload url for a fixed contenttype and contentlength
  let signedUrl = await bucketService.getUploadUrl(key, contenttype, contentlength);
  // add resource entry to our db
  let resourceId = await addResource(surveyId, key, res.locals.auth.user._id);
  return res.send({ signedUrl, resourceId });
};

const addResource = async (surveyId, key, userId) => {
  //insert resource entry with state=pending
  let resource = {
    _id: new ObjectId(),
    surveyId: surveyId,
    state: 'pending',
    key: key,
    meta: {
      creator: new ObjectId(userId),
      dateCreated: new Date(),
      dateModified: null,
    },
  };
  // TODO find a good pattern in use for error handling
  let r = await db.collection(col).insertOne(resource);
  return r.insertedId;
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
        dateModified: new Date(),
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
  getResources,
  getDownloadURL,
  getUploadURL,
  commitResource,
  deleteResource,
  col,
};
