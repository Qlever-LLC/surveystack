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
  const { username, email, password } = req.body;
  const hash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS));
  const token = uuidv4();
  const user = {
    username,
    email,
    token,
    password: hash,
    permissions: [`/u/${username}`],
    authProviders: [],
  };

  try {
    let r = await db.collection(col).insertOne(user);
    assert.equal(1, r.insertedCount);
    const payload = createPayload(r.ops[0]);
    return res.send(payload);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(409).send(`Username already taken: ${username}`);
    }
  }

  return res.status(500).send({ message: 'Internal error' });
};

const login = async (req, res) => {
  console.log('inside login handler');
  const { username, password } = req.body;

  if (username == '' || password == '') {
    return res.status(400).send('Username and password must not be empty');
  }

  const existingUser = await db.collection(col).findOne({ username });
  if (!existingUser) {
    return res.status(404).send(`No user with username exists: ${username}`);
  }

  const passwordsMatch = await bcrypt.compare(password, existingUser.password);

  if (!passwordsMatch) {
    //return res.status(401).send(`Incorrect password for user: ${username}`);
    throw boom.unauthorized(`Incorrect password for user: ${username}`);
  }

  return res.send(createPayload(existingUser));
};

export default {
  register,
  login,
};
