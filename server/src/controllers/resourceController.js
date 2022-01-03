import bucketService from '../services/bucket.service';
import uuidv4 from 'uuid/v4';

import { db } from '../db';

import { queryParam } from '../helpers';
import mailService from '../services/mail.service';
import membershipService from '../services/membership.service';
import rolesService from '../services/roles.service';

const col = 'resources';

const getResources = async (req, res) => {
  return res.send([]);
};

const getDownloadURL = async (req, res) => {
  await bucketService.getDownloadUrl('dummykey');
  return res.send([]);
};

const getUploadURL = async (req, res) => {
  // TODO add survey id to resource
  const { surveyId, filename, contentlength, contenttype } = req.body;
  // define s3 file key containing unique uuid to prevent filename collision, allowed characters see https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
  let key = 'resources/surveys/' + surveyId + '/' + uuidv4() + '_' + filename;
  // get signed upload url for a fixed contenttype and contentlength
  let signedUrl = await bucketService.getUploadUrl(key, contenttype, contentlength);
  return res.send(signedUrl);
};

const deleteResource = async (req, res) => {
  await bucketService.deleteObject('dummykey');
  return res.send([]);
};

export default {
  getResources,
  getDownloadURL,
  getUploadURL,
  deleteResource
};
