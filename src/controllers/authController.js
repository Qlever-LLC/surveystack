import assert from 'assert';
import bcrypt from 'bcrypt';
import uuidv4 from 'uuid/v4';

import boom from '@hapi/boom';

import mailService from '../services/mail.service';
import rolesService from '../services/roles.service';
import { db } from '../db';
import membershipService from '../services/membership.service';

const col = 'users';

const createPayload = async (user) => {
  delete user.password;
  const roles = await rolesService.getRoles(user._id);
  user.roles = roles;
  return user;
};

const register = async (req, res) => {
  // TODO: sanity check
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS));
  const token = uuidv4();
  const user = {
    email,
    name,
    token,
    password: hash,
    permissions: [],
    authProviders: [],
    memberships: [],
  };

  try {
    let r = await db.collection(col).insertOne(user);
    assert.equal(1, r.insertedCount);
    const payload = await createPayload(r.ops[0]);
    return res.send(payload);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      throw boom.conflict(`E-Mail already in use: ${email}`, { email });
    }
  }

  throw boom.internal();
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (email.trim() === '' || password.trim() === '') {
    throw boom.badRequest('Email and password must not be empty');
  }

  const existingUser = await db.collection(col).findOne({ email });
  if (!existingUser) {
    throw boom.notFound(`No user with email exists: ${email}`);
  }

  const passwordsMatch = await bcrypt.compare(password, existingUser.password);

  if (!passwordsMatch) {
    throw boom.unauthorized(`Incorrect password for user: ${email}`);
  }

  const payload = await createPayload(existingUser);
  return res.send(payload);
};

const sendPasswordResetMail = async (req, res) => {
  const { email } = req.body;
  const existingUser = await db.collection(col).findOne({ email });
  if (!existingUser) {
    throw boom.notFound(`No user with email exists: ${email}`);
  }
  await mailService.send({
    to: email,
    subject: 'Link to reset your password',
    text: `Hello,

Use the following link to set a new password:

${process.env.SERVER_URL}/auth/reset-password?token=${existingUser.token}&email=${existingUser.email}

If you did not request this email, you can safely ignore it.

Best Regards`,
  });
  return res.send('OK');
};

const resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  const existingUser = await db.collection(col).findOne({ email });
  if (!existingUser) {
    throw boom.notFound(`No user with email exists: ${email}`);
  }

  if (existingUser.token !== token) {
    throw boom.unauthorized(`Invalid token for user: ${existingUser.email}`);
  }

  if (newPassword.trim() === '') {
    throw boom.badRequest('Password must not be empty');
  }

  const hash = bcrypt.hashSync(newPassword, parseInt(process.env.BCRYPT_ROUNDS));
  try {
    let updated = await db.collection(col).findOneAndUpdate(
      { _id: existingUser._id },
      { $set: { password: hash } },
      {
        returnOriginal: false,
      }
    );
    return res.send(updated);
  } catch (err) {
    console.log(err);
    throw boom.internal(`Ouch`);
  }
};

export default {
  register,
  login,
  resetPassword,
  sendPasswordResetMail,
};
