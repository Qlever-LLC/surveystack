import { ObjectId } from 'mongodb';
import boom from '@hapi/boom';

/* Call for Submissions (CFS) */

import mailService from '../services/mail.service';
import rolesService from '../services/roles.service';
import { db } from '../db';

const col = 'users';

const send = async (req, res) => {
  const { subject, body, survey, members, group } = req.body;
  const { origin } = req.headers;

  console.log('subject', subject);
  console.log('body', body);
  console.log('survey', survey);
  console.log('members', members);

  const memberships = await db
    .collection('memberships')
    .aggregate([
      { $match: { _id: { $in: members.map((member) => new ObjectId(member)) } } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.email': 1, 'user.token': 1 } },
    ])
    .toArray();

  const promises = [];
  for (const membership of memberships) {
    console.log('MEMBERSHIP');

    const { email, token } = membership.user;
    const text = body.replace(
      /%CFS_MAGIC_LINK%/g,
      `${origin}/auth/login?cfs=${survey}&group=${group}&token=${token}&email=${email}`
    );
    console.log('text', text);

    /*
    mailService.send({
      to: membership.email,
      subject: subject,
      text: body
    });
    */
    console.log('');
  }

  return res.send('OK');
};

export default {
  send,
};
