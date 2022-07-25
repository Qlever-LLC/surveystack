import membershipController from './membershipController';
const { updateMembership, activateMembershipByAdmin, createConfirmedMembership } =
  membershipController;
import { db } from '../db';
import { createGroup, createReq, createRes, asMongoId } from '../testUtils';

jest.mock('../services/membership.service');
import membershipService from '../services/membership.service';

describe('updateMembership', () => {
  it('can update editable fields', async () => {
    const group = await createGroup();
    const admin = await group.createAdminMember();
    const user = await group.createUserMember();

    const req = createReq({
      body: {
        group: group._id,
        role: 'admin',
        meta: {
          invitationName: 'Changed Name',
          invitationEmail: 'something.different@email.com',
        },
      },
      params: { id: user.membership._id },
    });
    const res = await createRes({ user: admin.user });

    await updateMembership(req, res);

    const updatedUserMembership = await db
      .collection('memberships')
      .findOne({ _id: asMongoId(user.membership) });
    expect(updatedUserMembership.role).toBe('admin');
    expect(updatedUserMembership.meta.invitationName).toBe('Changed Name');
    expect(updatedUserMembership.meta.invitationEmail).toBe(user.membership.meta.invitationEmail);
  });

  it("throws if the user isn't group admin", async () => {
    const group = await createGroup();
    const user1 = await group.createUserMember();
    const user2 = await group.createUserMember();
    const req = createReq({
      body: {
        group: group._id,
        role: 'admin',
      },
      params: { id: user2.membership._id },
    });
    const res = await createRes({ user: user1.user });

    await expect(updateMembership(req, res)).rejects.toThrow(
      'Only group admins can update memberships'
    );
  });
});

describe('activateMembershipByAdmin', () => {
  let group, admin, pendingUser, req, res;
  beforeEach(async () => {
    group = await createGroup();
    admin = await group.createAdminMember();
    pendingUser = await group.createUserMember({ meta: { status: 'pending' } });
    req = createReq({ body: { membershipId: pendingUser.membership._id.toString() } });
    res = await createRes({ user: admin.user });
  });

  it('throws when "membershipId" is not set', async () => {
    req = createReq();
    await expect(activateMembershipByAdmin(req, res)).rejects.toThrow(
      '"membershipId" is missing from the request body'
    );
  });

  it('throws when user has no group-admin acces', async () => {
    const user = await group.createUserMember();
    res = await createRes({ user: user.user });
    await expect(activateMembershipByAdmin(req, res)).rejects.toThrow(
      'Only group admins can create memberships'
    );
  });

  it('calls membershipService.activateMembershipByAdmin', async () => {
    await activateMembershipByAdmin(req, res);
    expect(membershipService.activateMembershipByAdmin).toHaveBeenCalledWith({
      membershipId: pendingUser.membership._id,
      origin: req.headers.origin,
    });
  });

  it('returns ok', async () => {
    await activateMembershipByAdmin(req, res);
    expect(res.send).toHaveBeenCalledWith({ ok: true });
  });
});

describe('createConfirmedMembership', () => {
  let group, admin, pendingUser, req, res, entity, invitationEmail;
  beforeEach(async () => {
    group = await createGroup();
    admin = await group.createAdminMember();
    pendingUser = await group.createUserMember({ meta: { status: 'pending' } });
    invitationEmail = 'foo@bar.com';
    entity = {
      group: group._id.toString(),
      meta: {
        invitationEmail,
      },
    };
    req = createReq({ body: entity });
    res = await createRes({ user: admin.user });
  });

  it('throws when user has no group-admin acces', async () => {
    const user = await group.createUserMember();
    res = await createRes({ user: user.user });
    await expect(createConfirmedMembership(req, res)).rejects.toThrow(
      'Only group admins can create memberships'
    );
  });

  it('throws when meta.invitationEmail is not set', async () => {
    delete req.body.meta.invitationEmail;
    await expect(createConfirmedMembership(req, res)).rejects.toThrow(
      'Need to supply an email address'
    );
  });

  it('inserts membership into db', async () => {
    await createConfirmedMembership(req, res);

    await expect(
      db.collection('memberships').findOne({ 'meta.invitationEmail': invitationEmail })
    ).resolves.toMatchObject(entity);
  });

  it('calls membershipService.activateMembershipByAdmin', async () => {
    await createConfirmedMembership(req, res);
    const membership = await db
      .collection('memberships')
      .findOne({ 'meta.invitationEmail': invitationEmail });
    expect(membershipService.activateMembershipByAdmin).toHaveBeenCalledWith({
      membershipId: membership._id,
      origin: req.headers.origin,
    });
  });
});
