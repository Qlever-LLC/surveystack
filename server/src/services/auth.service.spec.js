import { createUserIfNotExist, createMagicLink, createLoginPayload } from './auth.service';
import { createGroup, createUser } from '../testUtils';
import { db, COLL_ACCESS_CODES } from '../db';
import url from 'url';
import rolesService from './roles.service';
import { pick } from 'lodash';

describe('createUserIfNotExist', () => {
  it('creates a new user if it does not exeist', async () => {
    const email = 'fuz@baz.bar';
    const user = await createUserIfNotExist(email);
    expect(user).toMatchObject({ email, token: expect.any(String), name: 'Fuz' });
  });
  describe('giving name to new user', () => {
    it('creates a name from the email, if name option is not set', async () => {
      const email = 'DiegoJose.Francisco.dePaula-Juan__nepomucenoMaria@baz.bar';
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
});

describe('createMagicLink', () => {
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

  it('creates accessCode with the correct expire date', async () => {
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    for (let expiresAfterDays of [1, 3, 92]) {
      const link = await createMagicLink({ email, origin, expiresAfterDays });
      const {
        query: { code },
      } = url.parse(link, true);
      const { expiresAt } = await db.collection(COLL_ACCESS_CODES).findOne({ code });
      // allow a second difference between the expected and the actual value
      expect(expiresAt.getTime()).toBeCloseTo(Date.now() + expiresAfterDays * DAY_IN_MS, -3);
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
    it('without returnUrl', async () => {
      const link = new URL(await createMagicLink({ email, origin }));
      expect(link.origin).toBe(origin);
      expect(link.pathname).toBe('/api/auth/enter-with-magic-link');
      expect(link.searchParams.get('code')).toEqual(expect.any(String));
      expect(link.searchParams.get('returnUrl')).toBeNull();
    });
    it('witt returnUrl', async () => {
      const returnUrl = '/in/app/path';
      const link = new URL(await createMagicLink({ email, origin, returnUrl }));
      expect(link.origin).toBe(origin);
      expect(link.pathname).toBe('/api/auth/enter-with-magic-link');
      expect(link.searchParams.get('code')).toEqual(expect.any(String));
      expect(link.searchParams.get('returnUrl')).toBe(returnUrl);
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
      expect(payload).toMatchObject(pick(user, '_id', 'email', 'name', 'token'));
    });
  });
});
