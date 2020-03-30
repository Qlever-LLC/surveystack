import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import uuidv4 from 'uuid/v4';

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
  const permissions = [`${_id}`, 'admin'];
  const authProviders = [];
  const memberships = [];

  const created = await db.collection('users').insertOne({
    _id,
    email,
    name,
    token,
    password,
    permissions,
    authProviders,
    memberships,
  });
  console.log('Created admin', created.ops[0]);
};

export const initAdmins = async () => {
  console.log('initAdmins...');
  const existingAdmin = await db.collection('users').findOne({ permissions: 'admin' });
  if (!existingAdmin) {
    console.log('There is not a single admin, creating one now...');
    await createDefaultAdmin();
  }
};
