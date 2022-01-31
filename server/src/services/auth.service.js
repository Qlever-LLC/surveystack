import uuidv4 from 'uuid/v4';
import { startCase, pick } from 'lodash';
import { db, COLL_ACCESS_CODES } from '../db';
import rolesService from '../services/roles.service';
import crypto from 'crypto';

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

export const createMagicLink = async ({
  origin,
  email,
  expiresAfterDays = 7,
  landingPath = null,
}) => {
  if (!origin) {
    throw new Error('createMagicLink: "origin" parameter is required');
  }
  if (!email) {
    throw new Error('createMagicLink: "email" parameter is required');
  }
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresAfterDays);
  const code = crypto.randomBytes(32).toString('hex');

  await db.collection(COLL_ACCESS_CODES).insertOne({
    code,
    expiresAt,
    email,
  });

  let link = `${origin}/api/auth/enter-with-magic-link?code=${code}`;
  if (landingPath) {
    link += `&landingPath=${encodeURIComponent(landingPath)}`;
  }

  return link;
};

export const createLoginPayload = async (userObject) => {
  const payload = pick(userObject, 'email', 'name', 'token', '_id', 'permissions');
  const roles = await rolesService.getRoles(userObject._id);
  return { ...payload, roles };
};
