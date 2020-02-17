import { Router } from 'express';
import { uploadToS3 } from '../services/bucket.service';

import { db } from '../db';
import { flatten } from 'flat';

import { ObjectId } from 'mongodb';

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

router.get('/submissions', async (req, res) => {
  const filter = {};

  if (req.query.survey) {
    filter.survey = new ObjectId(req.query.survey);
  }

  const submissions = await db
    .collection('submissions')
    .find(filter)
    .toArray();

  const csv = [];
  submissions.forEach(submission => {
    submission._id = submission._id.toString();
    submission.survey = submission.survey.toString();
    csv.push(flatten(submission));
  });

  return res.send(csv);
});

export default router;
