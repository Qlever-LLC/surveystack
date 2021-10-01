import assert from 'assert';
import bcrypt from 'bcrypt';
import uuidv4 from 'uuid/v4';
import isEmail from 'isemail';
import axios from 'axios';
import { encodeURI } from 'js-base64';

import boom from '@hapi/boom';

import mailService from '../services/mail.service';
import rolesService from '../services/roles.service';
import { db, COLL_USERS_OAUTH_ACCOUNTS } from '../db';

const col = 'users';

const OAUTH_GH_CLIENT_ID = process.env.OAUTH_GH_CLIENT_ID;
const OAUTH_GH_CLIENT_SECRET = process.env.OAUTH_GH_CLIENT_SECRET;

const createPayload = async (user) => {
  delete user.password;
  const roles = await rolesService.getRoles(user._id);
  user.roles = roles;
  return user;
};

const createUserDoc = (overrides) => ({
  email: '',
  name: '',
  token: null,
  password: null,
  permissions: [],
  authProviders: [],
  memberships: [],
  ...overrides,
});

const register = async (req, res) => {
  // TODO: sanity check
  const { email, name, password } = req.body;

  if (!isEmail.validate(email)) {
    throw boom.badRequest(`Invalid email address: ${email}`);
  }

  const hash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS));
  const token = uuidv4();

  const user = createUserDoc({
    email,
    name,
    hash,
    token,
  });

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
  const { email, password, token } = req.body;
  if (token) {
    // alternative magic link login with token
    const existingUser = await db.collection(col).findOne({ email, token });
    if (!existingUser) {
      throw boom.notFound(`No user found with matching email and token: [${email}, ${token}]`);
    }
    const payload = await createPayload(existingUser);
    return res.send(payload);
  }

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
  const { origin } = req.headers;
  const existingUser = await db.collection(col).findOne({ email });
  if (!existingUser) {
    throw boom.notFound(`No user with email exists: ${email}`);
  }
  await mailService.send({
    to: email,
    subject: 'Link to reset your password',
    text: `Hello,

Use the following link to set a new password:

${origin}/auth/reset-password?token=${existingUser.token}&email=${existingUser.email}

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

const oAuthLogin = (_, res) => {
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${OAUTH_GH_CLIENT_ID}`);
};

const oAuthCallback = async (req, res) => {
  const body = {
    client_id: OAUTH_GH_CLIENT_ID,
    client_secret: OAUTH_GH_CLIENT_SECRET,
    code: req.query.code,
  };
  const opts = { headers: { accept: 'application/json' } };
  const auth_res = await axios.post(`https://github.com/login/oauth/access_token`, body, opts);
  const access_token = auth_res.data['access_token'];

  const {
    data: { email, name },
  } = await axios({
    method: 'get',
    url: `https://api.github.com/user`,
    headers: {
      Authorization: 'token ' + access_token,
    },
  });

  if (!email) {
    throw boom.failedDependency('Failed to retrive email from GitHub');
  }

  // Add a placeholder name if the OAuth provider didn't have it
  if (!name) {
    name = 'New User';
  }

  // Insert the user if it isn't registered yet
  const { matchedCount } = await db.collection(col).updateOne(
    { email },
    {
      $setOnInsert: createUserDoc({
        email,
        name,
        token: uuidv4(),
      }),
    },
    { upsert: true }
  );
  const isNewUser = matchedCount === 0;

  const user = await db.collection(col).findOne({ email });

  await db
    .collection(COLL_USERS_OAUTH_ACCOUNTS)
    .updateOne(
      { user: user._id, provider: 'github' },
      { $set: { email, name }, $setOnInsert: { linkApproved: isNewUser } },
      { upsert: true }
    );

  const { linkApproved } = await db
    .collection(COLL_USERS_OAUTH_ACCOUNTS)
    .findOne({ user: user._id, provider: 'github' });

  if (!linkApproved) {
    // TODO require existing user to approve the connection with passworf
  }

  let payload = await createPayload(user);
  payload = JSON.stringify(payload);
  payload = encodeURI(payload);
  res.redirect(`/auth/accept-login/${payload}`);
};

export default {
  register,
  login,
  resetPassword,
  sendPasswordResetMail,
  oAuthLogin,
  oAuthCallback,
};
