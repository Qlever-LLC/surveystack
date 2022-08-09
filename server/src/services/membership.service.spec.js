import { activateMembershipByAdmin } from './membership.service';
import { db } from '../db';
import { createGroup } from '../testUtils';
jest.mock('./auth.service');
jest.mock('./mail/mail.service');
import { createMagicLink, createUserIfNotExist } from './auth.service';
import mailService from './mail/mail.service';

describe('membership.service', () => {
  describe('activateMembershipByAdmin', () => {
    let group,
      admin,
      pendingUser,
      origin,
      entity,
      invitationEmail,
      invitationName,
      dependencies,
      args;
    beforeEach(async () => {
      origin = 'https://foo.com';
      invitationEmail = 'foo@bar.com';
      invitationName = 'Foo Bar';
      group = await createGroup();
      admin = await group.createAdminMember();
      pendingUser = await group.createUserMember({
        membershipOverrides: {
          meta: { status: 'pending', invitationEmail, invitationName },
        },
      });
      entity = {
        group: group._id.toString(),
        meta: {
          invitationEmail,
        },
      };
      createUserIfNotExist.mockResolvedValue(pendingUser);
      dependencies = { activateMembership: jest.fn() };
      args = { membershipId: pendingUser.membership._id, origin, ...dependencies };
    });

    it("throws if the membership.group doesn't exist", async () => {
      await db.collection('groups').deleteOne({ _id: group._id });
      await expect(activateMembershipByAdmin(args)).rejects.toThrow(
        `Can't find a group with the ID: ${pendingUser.membership.group}`
      );
    });

    it('calls createUserIfNotExist', async () => {
      await activateMembershipByAdmin(args);
      expect(createUserIfNotExist).toHaveBeenCalledWith(invitationEmail, invitationName);
    });

    it('calls activateMembership', async () => {
      await activateMembershipByAdmin(args);
      expect(dependencies.activateMembership).toHaveBeenCalledWith({
        code: pendingUser.membership.meta.invitationCode,
        user: pendingUser._id,
      });
    });

    it('calls createMagicLink', async () => {
      await activateMembershipByAdmin(args);
      expect(createMagicLink).toHaveBeenCalledWith({
        origin,
        email: pendingUser.email,
        expiresAfterDays: 7,
        landingPath: `/g/${group.slug}/`,
      });
      expect(createMagicLink).toHaveBeenCalledWith({
        origin,
        email: pendingUser.email,
        expiresAfterDays: 7,
        landingPath: `/auth/profile`,
      });
    });

    it('calls mailService.sendLink', async () => {
      const link = 'https://foo.com';
      createMagicLink.mockResolvedValue(link);
      await activateMembershipByAdmin(args);
      expect(mailService.sendLink).toHaveBeenCalledWith(
        expect.objectContaining({
          to: pendingUser.email,
          link,
        })
      );
    });
  });
});
