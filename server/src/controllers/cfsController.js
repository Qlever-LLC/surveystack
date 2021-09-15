import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';

/* Call for Submissions (CFS) */

import mailService from '../services/mail.service';
import rolesService from '../services/roles.service';
import { db } from '../db';

const createText = (text, { origin, survey, group, token, email }) => {
  return text.replace(
    /%CFS_MAGIC_LINK%/g,
    `${origin}/auth/login?cfs=${survey}&group=${group}&token=${token}&email=${email}`
  );
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
      { $project: { 'user.email': 1, 'user.token': 1 } },
    ])
    .toArray();

  //const promises = [];
  for (const membership of memberships) {
    const { email, token } = membership.user;
    const text = createText(body, { origin, survey, group, token, email });

    // TODO: find a better way to send bulk emails
    await mailService.send({
      to: email,
      subject: subject,
      text,
    });
  }

  if (copy) {
    const { email, token } = res.locals.auth.user;
    const text = createText(body, { origin, survey, group, token, email });

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
