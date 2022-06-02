jest.mock('../services/mail/mail.service');
import * as authService from '../services/auth.service';
jest.spyOn(authService, 'createInvalidateMagicLink');
const { createMagicLink, createInvalidateMagicLink } = authService;

import url from 'url';
import authController from './authController';
const { enterWithMagicLink } = authController;
import { db, COLL_ACCESS_CODES } from '../db';
import { createReq, createRes, createUser } from '../testUtils';
import { decode } from 'js-base64';
import { uniqueId } from 'lodash';

describe('enterWithMagicLink', () => {
  it('redirects to the expired page when code is invalid', async () => {
    const res = await createRes();
    await enterWithMagicLink(createReq({ query: { code: 'invalid' } }), res);
    expect(res.redirect).toHaveBeenCalledWith('/auth/login?magicLinkExpired');
  });

  it('adds returnPath to the expired page URL', async () => {
    const res = await createRes();
    const landingPath = '/some/where';
    await enterWithMagicLink(createReq({ query: { code: 'invalid', landingPath } }), res);
    expect(res.redirect).toHaveBeenCalledWith(
      `/auth/login?magicLinkExpired&landingPath=${encodeURIComponent(landingPath)}`
    );
  });

  const withNewOrExistingUser = (description, test) => {
    describe('with new user', () => {
      it(description, async () => {
        const email = `foo${uniqueId()}@fuz.bar`;
        await test(email);
        // the user has been created
        await expect(db.collection('users').findOne({ email })).resolves.toMatchObject({ email });
      });
    });
    describe('existing new user', () => {
      it(description, async () => {
        const user = await createUser();
        await test(user.email);
      });
    });
  };

  const createMagicReq = async (options) => {
    const magicLink = await createMagicLink(options);
    const { protocol, host, query } = url.parse(magicLink, true);
    return createReq({ query, protocol: protocol.slice(0, -1), headers: { host, origin: undefined } });
  };

  withNewOrExistingUser('redirects to the accept route in the app', async (email) => {
    const res = await createRes();
    const req = await createMagicReq({ origin: 'https://foo.bar', email });

    await enterWithMagicLink(req, res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    const redirect = url.parse(res.redirect.mock.calls[0][0], true);
    expect(redirect.pathname).toBe('/auth/accept-magic-link');
    const user = JSON.parse(decode(redirect.query.user));
    expect(user.email).toBe(email);
    expect(user.landingPath).toBeFalsy();
  });

  withNewOrExistingUser('adds `invalidateMagicLink` to loginPayload', async (email) => {
    const res = await createRes();
    const origin = 'https://foo.magic';
    const req = await createMagicReq({ origin, email });
    const accessCode = await db.collection(COLL_ACCESS_CODES).findOne({ code: req.query.code });
    const invalidateMagicLink = 'http://foo.invalid';
    createInvalidateMagicLink.mockReturnValue(invalidateMagicLink);

    await enterWithMagicLink(req, res);

    expect(createInvalidateMagicLink).toHaveBeenCalledTimes(1);
    expect(createInvalidateMagicLink).toHaveBeenCalledWith({ origin, accessCodeId: accessCode._id });
    const redirect = url.parse(res.redirect.mock.calls[0][0], true);
    const user = JSON.parse(decode(redirect.query.user));
    expect(user.invalidateMagicLink).toBe(invalidateMagicLink);
  });

  withNewOrExistingUser('adds returnPath to the accept route URL', async (email) => {
    const res = await createRes();
    const landingPath = '/some/where';
    const req = await createMagicReq({ origin: 'https://foo.bar', email, landingPath });

    await enterWithMagicLink(req, res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    const redirect = url.parse(res.redirect.mock.calls[0][0], true);
    expect(redirect.pathname).toBe('/auth/accept-magic-link');
    const user = JSON.parse(decode(redirect.query.user));
    expect(user.email).toBe(email);
    expect(redirect.query.landingPath).toBe(landingPath);
  });
});
