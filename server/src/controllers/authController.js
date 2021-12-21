import assert from 'assert';
import bcrypt from 'bcrypt';
import uuidv4 from 'uuid/v4';
import isEmail from 'isemail';
import { encodeURI as b64EncodeURI } from 'js-base64';

import boom from '@hapi/boom';

import mailService from '../services/mail/mail.service';
import {
  createUserDoc,
  createUserIfNotExist,
  createLoginPayload,
  createMagicLink,
} from '../services/auth.service';
import { db, COLL_ACCESS_CODES } from '../db';

const col = 'users';

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
    token,
    password: hash,
  });

  try {
    let r = await db.collection(col).insertOne(user);
    assert.equal(1, r.insertedCount);
    const payload = await createLoginPayload(r.ops[0]);
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
    const payload = await createLoginPayload(existingUser);
    return res.send(payload);
  }

  if (email.trim() === '' || password.trim() === '') {
    throw boom.badRequest('Email and password must not be empty');
  }
  // TODO the client shows the same error message weather the email or the pw doesn't match (since https://gitlab.com/our-sci/software/surveystack/-/merge_requests/19)
  //  We should also send the same error from the server to get less vulnerable against dictionary attacks
  const existingUser = await db.collection(col).findOne({ email });
  if (!existingUser) {
    throw boom.notFound(`No user with email exists: ${email}`);
  }

  const passwordsMatch = await bcrypt.compare(password, existingUser.password);

  if (!passwordsMatch) {
    throw boom.unauthorized(`Incorrect password for user: ${email}`);
  }

  const payload = await createLoginPayload(existingUser);
  return res.send(payload);
};

const sendPasswordResetMail = async (req, res) => {
  const { email } = req.body;
  const existingUser = await db.collection(col).findOne({ email });
  
  // Fail silently when the email is not in the DB
  if (existingUser) {
    const { origin } = req.headers;
    const landingPath = `/users/${existingUser._id}/edit`;
    const magicLink = await createMagicLink({ origin, email, expiresAfterDays: 3, landingPath });

    await mailService.sendLink({
      to: email,
      subject: `Link to reset your password`,
      link: magicLink,
      actionDescriptionHtml: 'Continue to reset your password at <b>SurveyStack</b>:',
      actionDescriptionText: 'Use the following link to set a new password:',
      btnText: 'Reset password',
    });
  }
  return res.send({ ok: true });
};

// TODO deprecated, the SurveyStack browser client doesn't use it anymore. Can we remove it, or there are other clients still using it?
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
      { $set: { password: hash, token: uuidv4() } },
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

const requestMagicLink = async (req, res) => {
  const { email, expiresAfterDays = 1, landingPath = null } = req.body;

  if (!isEmail.validate(email)) {
    throw boom.badRequest(`Invalid email address: ${email}`);
  }

  const { origin } = req.headers;
  const magicLink = await createMagicLink({ origin, email, expiresAfterDays, landingPath });

  await mailService.sendLink({
    to: email,
    subject: `SurveyStack sign in`,
    link: magicLink,
    actionDescriptionHtml: 'Continue to <b>SurveyStack</b>:',
    actionDescriptionText: 'Continue to log into SurveyStack with this link:',
    btnText: 'Sign in',
  });

  res.send({ ok: true });
};

const enterWithMagicLink = async (req, res) => {
  const { code, landingPath } = req.query;
  const { value: accessCode } = await db.collection(COLL_ACCESS_CODES).findOneAndDelete({ code });

  const withLandingPath = (url) => {
    if (landingPath) {
      return url + `&landingPath=${encodeURIComponent(landingPath)}`;
    }
    return url;
  };

  if (!accessCode) {
    res.redirect(withLandingPath('/auth/login?magicLinkExpired'));
    return;
  }

  const { email } = accessCode;

  let userObject = await createUserIfNotExist(email);

  let loginPayload = await createLoginPayload(userObject);
  loginPayload = JSON.stringify(loginPayload);
  loginPayload = b64EncodeURI(loginPayload);
  let loginUrl = withLandingPath(`/auth/accept-magic-link?user=${loginPayload}`);

  res.redirect(loginUrl);
};

export default {
  register,
  login,
  resetPassword,
  sendPasswordResetMail,
  requestMagicLink,
  enterWithMagicLink,
};
