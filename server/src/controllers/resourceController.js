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
  const { filename, contentlength, contenttype } = req.query;
  let key = 'resources/surveys/'+uuidv4()+filename;

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
