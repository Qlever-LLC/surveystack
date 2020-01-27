import uuidv4 from 'uuid/v4';

import { db } from '../models';

export const initAdmins = async () => {
  console.log('initAdmins...');
  const existingAdmin = await db.collection('users').findOne({ permissions: 'admin' });
  if (!existingAdmin) {
    console.log('There is not a single admin, creating one now...');

    const email = process.env.ADMIN_EMAIL;
    const name = process.env.ADMIN_NAME;
    const token = uuidv4();
    const password = process.env.ADMIN_PASSWORD;
    const permissions = ['admin'];
    const authProviders = [];

    const created = await db.collection('users').insertOne({
      name,
      email,
      token,
      password,
      permissions,
      authProviders,
    });
    console.log('Created admin', created.ops[0]);
  }
};
