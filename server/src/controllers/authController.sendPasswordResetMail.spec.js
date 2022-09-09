import authController from './authController';
const { sendPasswordResetMail } = authController;
import { createReq, createRes, createUser } from '../testUtils';
import mailService from '../services/mail/mail.service';
import { createMagicLink } from '../services/auth.service';
jest.mock('../services/mail/mail.service');
jest.mock('../services/auth.service');

describe('sendPasswordResetMail', () => {
  it('fails silently when the email does not match any user', async () => {
    const res = await createRes();
    await sendPasswordResetMail(createReq({ body: { email: 'unknown@user.com' } }), res);
    expect(createMagicLink).not.toHaveBeenCalled();
    expect(mailService.sendLink).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith({ ok: true });
  });

  it('calls createMagicLink correctly', async () => {
    const user = await createUser();
    const origin = 'http://foo.com';
    const req = createReq({ body: { email: user.email }, headers: { origin } });
    await sendPasswordResetMail(req, await createRes());
    expect(createMagicLink).toHaveBeenCalledTimes(1);
    expect(createMagicLink).toHaveBeenCalledWith({
      origin,
      email: user.email,
      expiresAfterDays: 3,
      landingPath: '/auth/profile',
    });
  });

  it('calls sendLink correctly', async () => {
    const user = await createUser();
    const magicLink = 'http://foo.magic';
    createMagicLink.mockReturnValue(magicLink);
    const req = createReq({ body: { email: user.email } });
    await sendPasswordResetMail(req, await createRes());
    expect(mailService.sendLink).toHaveBeenCalledTimes(1);
    expect(mailService.sendLink).toHaveBeenCalledWith(
      expect.objectContaining({ to: user.email, link: magicLink })
    );
  });

  it('responds "ok"', async () => {
    const user = await createUser();
    const res = await createRes();
    await sendPasswordResetMail(createReq({ body: { email: user.email } }), res);
    expect(res.send).toHaveBeenCalledWith({ ok: true });
  });

  it('handles `useLegacy` query param', async () => {
    const user = await createUser();
    const origin = `https://foo.bar`;
    const req = createReq({
      body: { email: user.email },
      query: { useLegacy: 'true' },
      headers: { origin },
    });
    await sendPasswordResetMail(req, await createRes());
    expect(mailService.send).toHaveBeenCalledTimes(1);
    expect(mailService.send).toHaveBeenCalledWith({
      to: user.email,
      subject: 'Link to reset your password',
      text: expect.stringContaining(
        `${origin}/auth/reset-password?token=${user.token}&email=${user.email}`
      ),
    });
  });
});
