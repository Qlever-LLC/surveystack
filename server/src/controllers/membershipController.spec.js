import membershipController from './membershipController';
const { updateMembership } = membershipController;
import { db } from '../db';
import { createGroup, createReq, createRes, asMongoId } from '../db/testUtils'

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
