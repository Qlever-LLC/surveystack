import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import uuidv4 from 'uuid/v4';
import assert from 'assert';

import { db } from '../db';

const getDefaultAdminPasswordHash = () => {
  const password = process.env.ADMIN_PASSWORD;
  try {
    const rounds = bcrypt.getRounds(password);
    console.log(`process.env.ADMIN_PASSWORD already is a hash with rounds: ${rounds}`);
    return password;
  } catch (error) {
    const hash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS));
    return hash;
  }
};

const createDefaultAdmin = async () => {
  const _id = new ObjectId();

  const email = process.env.ADMIN_EMAIL;
  const name = process.env.ADMIN_NAME;
  const token = uuidv4();

  const password = getDefaultAdminPasswordHash();
  const permissions = ['super-admin'];
  const authProviders = [];

  try {
    const user = {
      _id,
      email,
      name,
      token,
      password,
      permissions,
      authProviders,
    };
    const insertResult = await db.collection('users').insertOne(user);
    assert.strictEqual(insertResult?.acknowledged, true);
    console.log('Created default super admin.');
  } catch (error) {
    console.log(error);
    console.log('Could not create default super admin.');
  }
};

export const initAdmins = async () => {
  console.log('initAdmins...');
  const existingAdmin = await db.collection('users').findOne({ permissions: 'super-admin' });
  if (!existingAdmin) {
    console.log('There is not a single admin, creating one now...');
    await createDefaultAdmin();
  }
};
