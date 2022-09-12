import {
  createUserIfNotExist,
  createMagicLink,
  createLoginPayload,
  createInvalidateMagicLink,
} from './auth.service';
import { createGroup, createUser } from '../testUtils';
import { db, COLL_ACCESS_CODES } from '../db';
import url from 'url';
import rolesService from './roles.service';
import { pick, uniqueId } from 'lodash';

describe('createUserIfNotExist', () => {
  it('creates a new user if it does not exist', async () => {
    const email = 'fuz@baz.bar';
    const user = await createUserIfNotExist(email);
    expect(user).toMatchObject({ email, token: expect.any(String), name: 'Fuz' });
  });
  describe('giving name to new user', () => {
    it('creates a name from the email, if name option is not set', async () => {
      const email = 'diego-jose.francisco.de.paula-juan__nepomuceno-maria@baz.bar';
      const user = await createUserIfNotExist(email);
      expect(user).toMatchObject({
        email,
        name: 'Diego Jose Francisco De Paula Juan Nepomuceno Maria',
      });
    });
    it('uses the name option if it is set', async () => {
      const email = 'foo@baz.bar';
      const name = 'Bob Foo';
      const user = await createUserIfNotExist(email, name);
      expect(user).toMatchObject({ email, name });
    });
  });
  it('return the user if it already exist', async () => {
    const existingUser = await createUser();
    const user = await createUserIfNotExist(existingUser.email, 'Ignored Name');
    expect(existingUser).toMatchObject(user);
  });
  it('converts email to lowercase', async () => {
    const email = 'SomeLetters@UPPERCASE.com';
    const user = await createUserIfNotExist(email);
    expect(user).toMatchObject({
      email: email.toLowerCase(),
      token: expect.any(String),
      name: 'Someletters',
    });
  });
});

describe('createMagicLink', () => {
  const PARAM_VARIATIONS = [
    ['without params', {}],
    ['forwards landingPath', { landingPath: '/some/where' }],
    ['forwards callbackUrl', { callbackUrl: 'https://foo.bar.com/quz' }],
    [
      'forwards landingPath + callbackUrl',
      { landingPath: '/some/where', callbackUrl: 'http://foo.bar.com/quz' },
    ],
  ];

  const email = 'foo@bar.com';
  const origin = 'http://foo.bar';
  it('throws if origin is not set', async () => {
    await expect(createMagicLink({ email })).rejects.toThrow(
      'createMagicLink: "origin" parameter is required'
    );
  });
  it('throws if email is not set', async () => {
    await expect(createMagicLink({ origin })).rejects.toThrow(
      'createMagicLink: "email" parameter is required'
    );
  });

  it('creates an accessCode in the DB', async () => {
    const link = await createMagicLink({ email, origin });
    const {
      query: { code },
    } = url.parse(link, true);
    expect(db.collection(COLL_ACCESS_CODES).findOne({ code })).resolves.toMatchObject({
      code,
      email,
    });
  });

  describe('creates accessCode with the correct expire date', () => {
    for (let expiresAfterDays of [1, 3, 92]) {
      it(`${expiresAfterDays} days`, async () => {
        const link = await createMagicLink({ email, origin, expiresAfterDays });
        const {
          query: { code },
        } = url.parse(link, true);
        const { expiresAt } = await db.collection(COLL_ACCESS_CODES).findOne({ code });
        // allow a second difference between the expected and the actual value
        const expected = new Date();
        expected.setDate(expected.getDate() + expiresAfterDays);
        expect(expiresAt.getTime()).toBeCloseTo(expected.getTime(), -3);
      });
    }
  });

  it('generates a 64 characters long hex code', async () => {
    const link = await createMagicLink({ email, origin });
    const {
      query: { code },
    } = url.parse(link, true);
    expect(code).toMatch(/^[0-9a-f]{64}$/);
  });

  describe('returns the link in the correct format', () => {
    PARAM_VARIATIONS.forEach(([description, paramsToForward]) => {
      it(description, async () => {
        const link = new URL(await createMagicLink({ email, origin, ...paramsToForward }));
        expect(link.origin).toBe(origin);
        expect(link.pathname).toBe('/api/auth/enter-with-magic-link');
        expect(link.searchParams.get('code')).toEqual(expect.any(String));
        for (const [key, value] of Object.entries(paramsToForward)) {
          expect(link.searchParams.get(key)).toBe(value);
        }
      });
    });
  });

  describe('createLoginPayload', () => {
    it('removes password from user', async () => {
      const user = await createUser();
      const payload = await createLoginPayload(user);
      expect(payload.password).toBeUndefined();
    });

    it('includes roles', async () => {
      const group = await createGroup();
      const { user } = await group.createAdminMember();
      const payload = await createLoginPayload(user);
      const roles = await rolesService.getRoles(user._id);
      expect(payload.roles).toMatchObject(roles);
    });

    it('includes the user object', async () => {
      const user = await createUser();
      const payload = await createLoginPayload(user);
      expect(payload).toMatchObject(pick(user, '_id', 'email', 'name', 'token', 'permissions'));
    });
  });
});

describe('createInvalidateMagicLink', () => {
  const origin = 'http://foo.bar';
  let accessCodeId;

  beforeEach(async () => {
    const accessCode = (
      await db.collection(COLL_ACCESS_CODES).insertOne({ code: uniqueId().toString() })
    ).ops[0];
    accessCodeId = accessCode._id;
  });

  it('throws if origin is not set', async () => {
    await expect(createInvalidateMagicLink({ accessCodeId })).rejects.toThrow(
      'createInvalidateMagicLink: "origin" parameter is required'
    );
  });
  it('throws if accessCodeId is not set', async () => {
    await expect(createInvalidateMagicLink({ origin })).rejects.toThrow(
      'createInvalidateMagicLink: "accessCodeId" parameter has to be an ObjectID'
    );
  });
  it('throws if accessCodeId is not an ObjectID', async () => {
    await expect(
      createInvalidateMagicLink({ origin, accessCodeId: String(accessCodeId) })
    ).rejects.toThrow('createInvalidateMagicLink: "accessCodeId" parameter has to be an ObjectID');
  });

  it('adds `invalidateCode` to the accessCode doc', async () => {
    await createInvalidateMagicLink({ origin, accessCodeId });
    const accessCode = await db.collection(COLL_ACCESS_CODES).findOne({ _id: accessCodeId });
    expect(accessCode.invalidateCode).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns the link in the correct format', async () => {
    const link = new URL(await createInvalidateMagicLink({ origin, accessCodeId }));
    const accessCode = await db.collection(COLL_ACCESS_CODES).findOne({ _id: accessCodeId });
    expect(link.origin).toBe(origin);
    expect(link.pathname).toBe('/api/auth/invalidate-magic-link');
    expect(link.searchParams.get('invalidateCode')).toBe(accessCode.invalidateCode);
  });
});
