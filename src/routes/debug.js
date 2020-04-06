import { Router } from 'express';
import _ from 'lodash';
import { flatten } from 'flat';
import { ObjectId } from 'mongodb';
import papa from 'papaparse';
import boom from '@hapi/boom';

import { db } from '../db';
import { uploadToS3 } from '../services/bucket.service';
import mailService from '../services/mail.service';
import farmosService from '../services/farmos.service';
import { catchErrors } from '../handlers/errorHandlers';

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
  submissions.forEach((submission) => {
    submission._id = submission._id.toString();
    submission.survey = submission.survey.toString();
    removeKeys2(submission.data, ['meta']);

    items.push(flatten(submission));
  });

  // With implicit header row
  // (keys of first object populate header row)
  // TODO: add all headers from all submissions
  // https://www.papaparse.com/docs
  const csv = papa.unparse(items, {
    columns: null,
  });

  return res.send(csv);
});

router.get('/mail/check', async (req, res) => {
  console.log(process.env.SMTP_DEFAULT_SENDER);
  console.log(process.env.SMTP_HOST);
  try {
    await mailService.check();
  } catch (error) {
    return res.status(500).send(error);
  }

  return res.send('OK');
});

router.post('/mail/send', async (req, res) => {
  try {
    await mailService.send({
      to: 'andreas.rudolf@nexus-computing.ch',
      subject: 'This is another test',
      text: 'Hello\n\nGreetings from our-sci.net\n\nBest Regards',
    });
  } catch (error) {
    return res.status(500).send(error);
  }

  return res.send('OK');
});

router.get('/node_env', async (req, res) => {
  console.log(process.env.NODE_ENV);
  return res.send(process.env.NODE_ENV);
});

const getCredentials = async (req, res) => {
  const { user } = req.query;

  const u = await db.collection('users').findOne({ _id: new ObjectId(user) });

  if (!u) {
    throw boom.notFound(`User not found: ${user}`);
  }

  const credentials = await farmosService.getCredentials(u);
  return res.send(credentials);
};

router.get('/farmos/credentials', catchErrors(getCredentials));

export default router;
