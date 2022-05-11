import { db } from '../db';
import boom from '@hapi/boom';
import userController from './userController';
import { createReq, createRes, createSuperAdmin, createUser } from '../testUtils';
import { createCookieOptions } from '../constants';

const { updateUser } = userController;

describe('userController', () => {
  describe('updateUser', () => {
    it('updates user.name', async () => {
      const user = await createUser();
      const name = `changed-${user.name}`;
      await updateUser(createReq({ body: { _id: user._id, name } }), await createRes({ user }));
      const updatedUser = await db.collection('users').findOne(user._id);
      expect(updatedUser).toMatchObject({ ...user, name });
    });
  });

  it('can not update user.email', async () => {
    const user = await createUser();
    const email = `changed-${user.name}`;
    await updateUser(
      createReq({ body: { _id: user._id, name: user.name, email } }),
      await createRes({ user })
    );
    const updatedUser = await db.collection('users').findOne(user._id);
    expect(updatedUser).toMatchObject(user);
  });

  describe('change password', () => {
    const password = `Some-Password-123`;

    it('encrypts password', async () => {
      const user = await createUser();
      await updateUser(
        createReq({ body: { _id: user._id, name: user.name, password } }),
        await createRes({ user })
      );
      const updatedUser = await db.collection('users').findOne(user._id);
      expect(updatedUser).toMatchObject({
        ...user,
        password: expect.stringMatching(/^\$2/),
        token: expect.any(String),
      });
    });

    it('updates token', async () => {
      const user = await createUser({ token: 'some-token' });
      await updateUser(
        createReq({ body: { _id: user._id, name: user.name, password } }),
        await createRes({ user })
      );
      const updatedUser = await db.collection('users').findOne(user._id);
      expect(updatedUser.token).not.toBe(user.token);
    });

    it('sets token cookie', async () => {
      const user = await createUser({ token: 'some-token' });
      const res = await createRes({ user });
      await updateUser(createReq({ body: { _id: user._id, name: user.name, password } }), res);
      const updatedUser = await db.collection('users').findOne(user._id);
      expect(res.cookie).toHaveBeenCalledWith('token', updatedUser.token, {
        ...createCookieOptions(),
        expires: expect.any(Date),
      });
    });
  });

  it('can not update other user', async () => {
    const user = await createUser();
    const user2 = await createUser();
    const res = await await createRes({ user: user2 });
    const name = `changed-${user.name}`;
    await expect(updateUser(createReq({ body: { _id: user._id, name } }), res)).rejects.toThrow(
      boom.unauthorized(`Not allowed to put user: ${user._id}`)
    );
  });

  it('superadmin can update any user', async () => {
    const user = await createUser();
    const superadmin = await createSuperAdmin();
    const res = await await createRes({ user: superadmin });
    const name = `changed-${user.name}`;
    await updateUser(createReq({ body: { _id: user._id, name } }), res);
    const updatedUser = await db.collection('users').findOne(user._id);
    expect(updatedUser).toMatchObject({ ...user, name });
  });
});
