import authController from './authController';
const { register, login } = authController;
import { createReq, createRes } from '../testUtils';
import { db } from '../db';

describe('authController', () => {
  it('email and password not empty', async () => {
    const userName = 'nameU';
    const res = await createRes();
    const reqEmptyEmail = createReq({
      body: {
        name: userName,
        password: 'passwor d',
        email: '  ',
      },
    });
    await expect(register(reqEmptyEmail, res)).rejects.toThrow(
      /Email and password must not be empty/
    );

    const reqEmptyPassword = createReq({
      body: {
        name: userName,
        password: '',
        email: ' tEsT @  e.com ',
      },
    });
    await expect(register(reqEmptyPassword, res)).rejects.toThrow(
      /Email and password must not be empty/
    );
  });

  it('wrong validation for email', async () => {
    const userName = 'nameU';
    const res = await createRes();

    const reqWrongEmail = createReq({
      body: {
        name: userName,
        password: 'passwor d',
        email: 'tEsT   e.com',
      },
    });
    await expect(register(reqWrongEmail, res)).rejects.toThrow(
      /Invalid email address: test {3}e.com/
    );
  });

  it('strip whitespace on register and login', async () => {
    const userName = 'nameU';
    const res = await createRes();

    const req = createReq({
      body: {
        name: userName,
        password: 'passwor d',
        email: 'tEsT @  e.com',
      },
    });
    await expect(register(req, res)).rejects.toThrow(/Invalid email address: .*$/);
  });

  it('not able to use email twice', async () => {
    const userName = 'name';
    const userName2 = 'name2';
    const res = await createRes();

    const req1 = createReq({
      body: {
        name: userName,
        password: 'passwor d',
        email: 'tEsT@e.com',
      },
    });
    const req2 = createReq({
      body: {
        name: userName2,
        password: 'other passwor d',
        email: ' tEsT@e.com',
      },
    });

    await register(req1, res);
    let list = await db.collection('users').find().toArray();
    expect(list.length === 1);

    await expect(register(req2, res)).rejects.toThrow(/E-Mail already in use: .*$/);
    list = await db.collection('users').find().toArray();
    expect(list.length === 1);
  });
});
describe('authController specific on login function', () => {
  it('No user found with matching email and token', async () => {
    const res = await createRes();

    const reqLogin = createReq({
      body: {
        password: 'password',
        email: 'test@e.com',
        token: 'som3th1ng',
      },
    });
    await expect(login(reqLogin, res)).rejects.toThrow(
      'No user found with matching email and token: [test@e.com, som3th1ng]'
    );
  });

  it('password must not be empty', async () => {
    const res = await createRes();
    const req = createReq({
      body: {
        name: 'userName',
        password: 'password',
        email: 'tEsT@e.com',
      },
    });
    await register(req, res);
    const list = await db.collection('users').find().toArray();
    expect(list.length === 1);

    const reqLogin = createReq({
      body: {
        password: '',
        email: 'test@e.com',
      },
    });
    await expect(login(reqLogin, res)).rejects.toThrow(/Email and password must not be empty/);
  });
  it('Email must not be empty', async () => {
    const res = await createRes();

    const reqLogin = createReq({
      body: {
        password: 'some',
        email: ' ',
      },
    });
    await expect(login(reqLogin, res)).rejects.toThrow(/Email and password must not be empty/);
  });

  it('No user with email exists', async () => {
    const res = await createRes();
    const req = createReq({
      body: {
        name: 'userName',
        password: 'password',
        email: 'tEsT@e.com',
      },
    });
    await register(req, res);
    const list = await db.collection('users').find().toArray();
    expect(list.length === 1);

    const reqLogin = createReq({
      body: {
        password: 'password',
        email: '    email@ not exists .com',
      },
    });
    await expect(login(reqLogin, res)).rejects.toThrow(
      /No user with email exists: email@notexists.com/
    );
  });

  it('Incorrect password for user', async () => {
    const userName = 'name';
    const res = await createRes();
    const req = createReq({
      body: {
        name: userName,
        password: 'password',
        email: 'tEsT@e.com',
      },
    });
    await register(req, res);
    const list = await db.collection('users').find().toArray();
    expect(list.length === 1);

    const reqLogin = createReq({
      body: {
        password: 'an othe r one',
        email: 'test@e.com',
      },
    });
    await expect(login(reqLogin, res)).rejects.toThrow(/Incorrect password for user: test@e.com/);
  });
});
