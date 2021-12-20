import url from 'url';
import authController from './authController';
const { enterWithMagicLink } = authController;
import { db } from '../db'
import { createReq, createRes, createUser } from '../testUtils';
import { createMagicLink } from '../services/auth.service';
import { decode } from 'js-base64';
import { uniqueId } from 'lodash';
jest.mock('../services/mail/mail.service');

describe('enterWithMagicLink', () => {
  it('redirects to the expired page when code is invalid', async () => {
    const res = await createRes();
    await enterWithMagicLink(createReq({ query: { code: 'invalid' } }), res);
    expect(res.redirect).toHaveBeenCalledWith('/auth/login?magicLinkExpired');
  });


  it('adds returnPath to the expired page URL', async () => {
    const res = await createRes();
    const returnUrl = '/some/where';
    await enterWithMagicLink(createReq({ query: { code: 'invalid', returnUrl } }), res);
    expect(res.redirect).toHaveBeenCalledWith(`/auth/login?magicLinkExpired&returnUrl=${encodeURIComponent(returnUrl)}`);
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

  withNewOrExistingUser('redirects to the accept route in the app', async (email) => {
    const res = await createRes();
    const magicLink = await createMagicLink({ origin: 'https://foo.bar', email });
    const { query } = url.parse(magicLink, true);

    await enterWithMagicLink(createReq({ query }), res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    const redirect = url.parse(res.redirect.mock.calls[0][0], true);
    expect(redirect.pathname).toBe('/auth/accept-magic-link');
    const user = JSON.parse(decode(redirect.query.user));
    expect(user.email).toBe(email);
    expect(user.returnUrl).toBeFalsy();
  });

  withNewOrExistingUser('adds returnPath to the accept route URL', async (email) => {
    const res = await createRes();
    const returnUrl = '/some/where';
    const magicLink = await createMagicLink({ origin: 'https://foo.bar', email, returnUrl });
    const { query } = url.parse(magicLink, true);

    await enterWithMagicLink(createReq({ query }), res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    const redirect = url.parse(res.redirect.mock.calls[0][0], true);
    expect(redirect.pathname).toBe('/auth/accept-magic-link');
    const user = JSON.parse(decode(redirect.query.user));
    expect(user.email).toBe(email);
    expect(redirect.query.returnUrl).toBe(returnUrl);
  });
});
