import { Router } from 'express';
import _ from 'lodash';
import { flatten } from 'flat';
import { ObjectId } from 'mongodb';

import { db } from '../db';
import { uploadToS3 } from '../services/bucket.service';

import papa from 'papaparse';

const router = Router();

router.get('/lucky', async (req, res) => {
  const luckyNumber = Math.floor(Math.random() * 100 + 1);
  return res.send(`Your lucky number is: ${luckyNumber}`);
});

router.get('/s3upload', async (req, res) => {
  const prefix = 'pictures';
  const filePath = '/home/rudi/Pictures/ar-profile.png';
  await uploadToS3(prefix, filePath);

  return res.send(`File has been uploaded ${filePath}`);
});

function removeKeys(obj, keys) {
  for (var prop in obj) {
    console.log(prop);
    if (obj.hasOwnProperty(prop)) {
      switch (typeof obj[prop]) {
        case 'object':
          if (keys.indexOf(prop) > -1) {
            delete obj[prop];
          } else {
            removeKeys(obj[prop], keys);
          }
          break;
        default:
          if (keys.indexOf(prop) > -1) {
            delete obj[prop];
          }
          break;
      }
    }
  }
}

function removeKeys2(obj, keys) {
  if (!obj) {
    return;
  }
  for (var prop of Object.keys(obj)) {
    switch (typeof obj[prop]) {
      case 'object':
        if (keys.indexOf(prop) > -1) {
          delete obj[prop];
        } else {
          removeKeys2(obj[prop], keys);
        }
        break;
      default:
        if (keys.indexOf(prop) > -1) {
          delete obj[prop];
        }
        break;
    }
  }
}

router.get('/submissions', async (req, res) => {
  const filter = {};

  if (req.query.survey) {
    filter.survey = new ObjectId(req.query.survey);
  }

  const submissions = await db
    .collection('submissions')
    .find(filter)
    .toArray();

  const items = [];
  submissions.forEach(submission => {
    submission._id = submission._id.toString();
    submission.survey = submission.survey.toString();
    removeKeys2(submission.data, ['meta']);

    items.push(flatten(submission));
  });

  // With implicit header row
  // (keys of first object populate header row)
  // TODO: add all headers from all submissions
  // https://www.papaparse.com/docs
  const csv = papa.unparse(items);

  return res.send(csv);
});

export default router;
