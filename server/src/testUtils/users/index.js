const { uniqueId } = jest.requireActual('lodash');
const { getDb } = jest.requireActual('../../db');
const { createUserDoc } = jest.requireActual('../../services/auth.service');

const createSuperAdmin = async (overrides = {}) => {
  return await createUser({
    permissions: ['super-admin'],
    ...overrides,
  });
};

const createUser = async (overrides = {}) => {
  const fakeId = uniqueId();
  const defaults = {
    email: `user${fakeId}@email.com`,
    name: `User Number${fakeId}`,
  };
  const user = createUserDoc({ ...defaults, ...overrides });
  const insertResult = await getDb().collection('users').insertOne(user);
  return { _id: insertResult.insertedId, ...user };
};

export { createUser, createSuperAdmin };
