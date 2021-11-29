import { ObjectId } from 'mongodb';

/* Call for Submissions (CFS) */

import mailService from '../services/mail.service';
import { db } from '../db';
import { createMagicLink } from '../services/auth.service';

const createText = async (text, { origin, survey, group, email }) => {
  const returnUrl = `/surveys/${survey}?group=${group}`;
  const magicLink = await createMagicLink({ origin, email, expiresAfterDays: 14, returnUrl });

  return text.replace(/%CFS_MAGIC_LINK%/g, magicLink);
};

const send = async (req, res) => {
  const { subject, body, survey, members, group, copy } = req.body;
  const { origin } = req.headers;

  const memberships = await db
    .collection('memberships')
    .aggregate([
      { $match: { _id: { $in: members.map((member) => new ObjectId(member)) } } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.email': 1 } },
    ])
    .toArray();

  //const promises = [];
  for (const membership of memberships) {
    const { email } = membership.user;
    const text = await createText(body, { origin, survey, group, email });

    // TODO: find a better way to send bulk emails
    await mailService.send({
      to: email,
      subject: subject,
      text,
    });
  }

  if (copy) {
    const { email } = res.locals.auth.user;
    const text = await createText(body, { origin, survey, group, email });

    await mailService.send({
      to: email,
      subject: `[COPY] ${subject}`,
      text,
    });
  }

  return res.send('OK');
};

export default {
  send,
};
