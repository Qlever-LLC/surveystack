import assert from 'assert';
import bcrypt from 'bcrypt';
import uuidv4 from 'uuid/v4';

import boom from '@hapi/boom';

import { db } from '../models';

const col = 'users';

const createPayload = user => {
  delete user.password;
  return user;
};

const register = async (req, res) => {
  console.log('inside register handler');
  // TODO: sanity check
  // TODO: ensure unique indexes
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
  };

  try {
    let r = await db.collection(col).insertOne(user);
    assert.equal(1, r.insertedCount);
    const payload = createPayload(r.ops[0]);
    return res.send(payload);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(409).send(`Email already taken: ${email}`);
    }
  }

  return res.status(500).send({ message: 'Internal error' });
};

const login = async (req, res) => {
  console.log('inside login handler');
  const { email, password } = req.body;

  if (email == '' || password == '') {
    return res.status(400).send('Email and password must not be empty');
  }

  const existingUser = await db.collection(col).findOne({ email });
  if (!existingUser) {
    return res.status(404).send(`No user with email exists: ${email}`);
  }

  const passwordsMatch = await bcrypt.compare(password, existingUser.password);

  if (!passwordsMatch) {
    throw boom.unauthorized(`Incorrect password for user: ${email}`);
  }

  return res.send(createPayload(existingUser));
};

export default {
  register,
  login,
};
