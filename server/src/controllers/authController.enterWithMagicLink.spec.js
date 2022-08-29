jest.mock('../services/mail/mail.service');
import * as authService from '../services/auth.service';
jest.spyOn(authService, 'createInvalidateMagicLink');
const { createMagicLink, createInvalidateMagicLink } = authService;

import authController from './authController';
const { enterWithMagicLink } = authController;
import { db, COLL_ACCESS_CODES } from '../db';
import { createReq, createRes, createUser } from '../testUtils';
import { decode } from 'js-base64';
import { uniqueId } from 'lodash';

const PARAM_VARIATIONS = [
  ['without params', {}],
  ['forwards landingPath', { landingPath: '/some/where' }],
  ['forwards callbackUrl', { callbackUrl: 'https://foo.bar.com/quz' }],
  [
    'forwards landingPath + callbackUrl',
    { landingPath: '/some/where', callbackUrl: 'http://foo.bar.com/quz' },
  ],
];

describe('enterWithMagicLink', () => {
  describe('redirects to the expired page when code is invalid', () => {
    PARAM_VARIATIONS.forEach(([description, queryParamsToForward]) => {
      it(description, async () => {
        let host = 'bar.foo.com';
        const req = createReq({
          query: { code: 'invalid', ...queryParamsToForward },
          headers: { host },
        });
        const res = await createRes();
        await enterWithMagicLink(req, res);
        expect(res.redirect).toHaveBeenCalled();
        const redirectUrl = new URL(res.redirect.mock.calls[0][0]);
        expect(redirectUrl.host).toBe(host);
        expect(redirectUrl.searchParams.has('magicLinkExpired')).toBe(true);
        for (const [key, value] of Object.entries(queryParamsToForward)) {
          expect(redirectUrl.searchParams.get(key)).toBe(value);
        }
      });
    });
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
    const { protocol, host, searchParams } = new URL(magicLink);
    return createReq({
      query: Object.fromEntries(searchParams),
      protocol: protocol.slice(0, -1),
      headers: { host, origin: undefined },
    });
  };

  withNewOrExistingUser('redirects to the accept route in the app', async (email) => {
    const res = await createRes();
    const req = await createMagicReq({ origin: 'https://foo.bar', email });

    await enterWithMagicLink(req, res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    const redirect = new URL(res.redirect.mock.calls[0][0]);
    expect(redirect.pathname).toBe('/auth/accept-magic-link');
    const user = JSON.parse(decode(redirect.searchParams.get('user')));
    expect(user.email).toBe(email);
    expect(user.landingPath).toBeFalsy();
  });

  withNewOrExistingUser('adds `invalidateMagicLink` to the accept URL', async (email) => {
    const res = await createRes();
    const origin = 'https://foo.magic';
    const req = await createMagicReq({ origin, email });
    const accessCode = await db.collection(COLL_ACCESS_CODES).findOne({ code: req.query.code });
    const invalidateMagicLink = 'http://foo.invalid';
    createInvalidateMagicLink.mockReturnValue(invalidateMagicLink);

    await enterWithMagicLink(req, res);

    expect(createInvalidateMagicLink).toHaveBeenCalledTimes(1);
    expect(createInvalidateMagicLink).toHaveBeenCalledWith({
      origin,
      accessCodeId: accessCode._id,
    });
    const redirect = new URL(res.redirect.mock.calls[0][0]);
    expect(redirect.searchParams.get('invalidateMagicLink')).toBe(invalidateMagicLink);
  });

  describe('forwarding params', () => {
    PARAM_VARIATIONS.forEach(([description, queryParamsToForward]) => {
      withNewOrExistingUser(description, async (email) => {
        const res = await createRes();
        const req = await createMagicReq({
          origin: 'https://foo.bar',
          email,
          ...queryParamsToForward,
        });

        await enterWithMagicLink(req, res);

        expect(res.redirect).toHaveBeenCalledTimes(1);
        const callbackUrl =
          queryParamsToForward.callbackUrl && new URL(queryParamsToForward.callbackUrl);
        const redirect = new URL(res.redirect.mock.calls[0][0]);
        expect(redirect.pathname).toBe(
          callbackUrl ? callbackUrl.pathname : '/auth/accept-magic-link'
        );
        expect(redirect.host).toBe(callbackUrl ? callbackUrl.host : req.get('host'));
        const user = JSON.parse(decode(redirect.searchParams.get('user')));
        expect(user.email).toBe(email);

        expect(redirect.searchParams.get('landingPath')).toBe(
          queryParamsToForward.landingPath || null
        );
        // should not add callbackUrl to the query params
        expect(redirect.searchParams.has('callbackUrl')).toBe(false);
      });
    });
  });
});
