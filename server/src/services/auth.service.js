import uuidv4 from 'uuid/v4';
import { startCase } from 'lodash';
import { db } from '../db';
import rolesService from '../services/roles.service';

const col = 'users';

export const createUserDoc = (overrides) => ({
  email: '',
  name: '',
  token: null,
  password: null,
  permissions: [],
  authProviders: [],
  memberships: [],
  ...overrides,
});

export const createUserIfNotExist = async (email, name = null) => {
  if (!name) {
    // use the first part of the email as the default name
    name = startCase(email.split('@')[0]);
  }
  // Insert the user if it isn't registered yet
  await db.collection(col).updateOne(
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
  return await db.collection(col).findOne({ email });
};

export const createLoginPayload = async (userObject) => {
  delete userObject.password;
  const roles = await rolesService.getRoles(userObject._id);
  userObject.roles = roles;
  return userObject;
};
