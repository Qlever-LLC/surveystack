import authController from './authController';
const { requestMagicLink } = authController;
import { createReq, createRes } from '../testUtils';
import mailService from '../services/mail/mail.service';
import { createMagicLink } from '../services/auth.service';
jest.mock('../services/mail/mail.service');
jest.mock('../services/auth.service');

describe('requestMagicLink', () => {
  it('throws for invalid email address', async () => {
    const req = createReq({ body: { email: '#invalid email' } });
    await expect(requestMagicLink(req, await createRes())).rejects.toThrow('Invalid email address');
    expect(createMagicLink).not.toHaveBeenCalled();
    expect(mailService.sendLink).not.toHaveBeenCalled();
  });

  describe('calls createMagicLink correctly', () => {
    it('with minimal options', async () => {
      const email = 'foo@bar.com';
      const host = 'foo.com';
      const req = createReq({ body: { email }, headers: { host } });
      await requestMagicLink(req, await createRes());
      expect(createMagicLink).toHaveBeenCalledTimes(1);
      expect(createMagicLink).toHaveBeenCalledWith({
        origin: `${req.protocol}://${host}`,
        email,
        expiresAfterDays: 1,
        landingPath: null,
        callbackUrl: null,
      });
    });

    it('converts email to lowercase', async () => {
      const email = 'SomeLetters@UPPERCASE.com';
      const host = 'foo.com';
      const req = createReq({ body: { email }, headers: { host } });
      await requestMagicLink(req, await createRes());
      expect(createMagicLink).toHaveBeenCalledTimes(1);
      expect(createMagicLink).toHaveBeenCalledWith({
        origin: `${req.protocol}://${host}`,
        email: email.toLowerCase(),
        expiresAfterDays: 1,
        landingPath: null,
        callbackUrl: null,
      });
    });

    it('with all options', async () => {
      const email = 'foo@bar.com';
      const host = 'foo.com';
      const landingPath = '/foo/bar';
      const callbackUrl = 'https://buz.quz/enter?here';
      const expiresAfterDays = '8';
      const req = createReq({
        body: { email, landingPath, callbackUrl, expiresAfterDays },
        headers: { host },
      });
      await requestMagicLink(req, await createRes());
      expect(createMagicLink).toHaveBeenCalledTimes(1);
      expect(createMagicLink).toHaveBeenCalledWith({
        origin: `${req.protocol}://${host}`,
        email,
        expiresAfterDays,
        landingPath,
        callbackUrl,
      });
    });
  });

  it('calls sendLink correctly', async () => {
    const email = 'foo@bar.com';
    const magicLink = 'http://foo.magic';
    createMagicLink.mockReturnValue(magicLink);
    const req = createReq({ body: { email } });
    await requestMagicLink(req, await createRes());
    expect(mailService.sendLink).toHaveBeenCalledTimes(1);
    expect(mailService.sendLink).toHaveBeenCalledWith(
      expect.objectContaining({ to: email, link: magicLink })
    );
  });

  it('responds "ok"', async () => {
    const email = 'foo@bar.com';
    const res = await createRes();
    await requestMagicLink(createReq({ body: { email } }), res);
    expect(res.send).toHaveBeenCalledWith({ ok: true });
  });
});
