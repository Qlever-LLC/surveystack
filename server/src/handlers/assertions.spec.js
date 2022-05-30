import boom from '@hapi/boom';
import { assertIsSuperAdmin, assertHasIds, assertHasGroupAdminAccess } from './assertions.js';
import { createGroup } from '../testUtils';

describe('assertIsSuperAdmin', () => {
  it('throws unauthorized error if user is not a super admin', () => {
    const nextSpy = () => {};
    const req = {};
    const res = { locals: { auth: { isSuperAdmin: false } } };
    expect(() => assertIsSuperAdmin(req, res, nextSpy)).toThrow(boom.unauthorized());
  });

  it('calls next if user is a super admin', () => {
    const nextSpy = jest.fn();
    const req = {};
    const res = { locals: { auth: { isSuperAdmin: true } } };

    assertIsSuperAdmin(req, res, nextSpy);

    expect(nextSpy).toHaveBeenCalled();
  });
});

describe('assertHasIds', () => {
  const unsetError = boom.badRequest('You must specify ids.');
  const invalidError = boom.badRequest('Each ID must be a string');

  [
    ['not set', {}, unsetError],
    ['a string', { ids: 'not array' }, unsetError],
    ['an object', { ids: { length: 4 } }, unsetError],
    ['an empty array', { ids: [] }, unsetError],
    ['containing objects', { ids: ['good', {}] }, invalidError],
    ['containing numbers', { ids: ['good', 4] }, invalidError],
  ].forEach(([desc, body, error]) => {
    it(`throws if "ids" is ${desc}`, () => {
      const nextSpy = jest.fn();
      const req = { body };
      const res = {};

      expect(() => assertHasIds(req, res, nextSpy)).toThrow(error);
      expect(nextSpy).not.toHaveBeenCalled();
    });
  });

  it('calls next if ids are ok', () => {
    const nextSpy = jest.fn();
    const req = { body: { ids: ['a', 'b', 'c'] } };
    const res = {};

    assertHasIds(req, res, nextSpy);

    expect(nextSpy).toHaveBeenCalled();
  });
});

const init = async () => {
  const group = await createGroup();
  const user1 = await group.createUserMember();
  const admin1 = await group.createAdminMember();

  return {
    group,
    user1,
    admin1,
  };
};

describe('assertHasGroupAdminAccess', () => {
  it('with admin from the group', async () => {
    const { group, admin1 } = await init();
    const nextSpy = jest.fn();
    const req = { params: { groupId: group._id } };
    const res = { locals: { auth: { user: { _id: admin1.user._id } } } };

    await assertHasGroupAdminAccess(req, res, nextSpy);

    expect(nextSpy).toHaveBeenCalled();
  });
  it('with non-admin (a user) inside the group', async () => {
    const { group, user1 } = await init();
    const nextSpy = jest.fn();
    const req = { params: { groupId: group._id } };
    const res = { locals: { auth: { user: { _id: user1.user._id } } } };

    await expect(assertHasGroupAdminAccess(req, res, nextSpy)).rejects.toThrow(boom.unauthorized());
    expect(nextSpy).not.toHaveBeenCalled();
  });
  it('with non-admin (a user) outside the group', async () => {
    const workingGroup = await createGroup();
    const { user1 } = await init();
    const nextSpy = jest.fn();
    const req = { params: { groupId: workingGroup._id } };
    const res = { locals: { auth: { user: { _id: user1.user._id } } } };

    await expect(assertHasGroupAdminAccess(req, res, nextSpy)).rejects.toThrow(boom.unauthorized());
    expect(nextSpy).not.toHaveBeenCalled();
  });
  it('with admin from other group', async () => {
    const group1 = await createGroup();
    const { admin1: admin2 } = await init();
    const nextSpy = jest.fn();
    const req = { params: { groupId: group1._id } };
    const res = { locals: { auth: { user: { _id: admin2.user._id } } } };

    await expect(assertHasGroupAdminAccess(req, res, nextSpy)).rejects.toThrow(boom.unauthorized());
    expect(nextSpy).not.toHaveBeenCalled();
  });
  it('with admin from upper group in same domain', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const adminBio = await groupBionutrient.createAdminMember();
    const nextSpy = jest.fn();
    const req = { params: { groupId: groupLabs._id } };
    const res = { locals: { auth: { user: { _id: adminBio.user._id } } } };

    await assertHasGroupAdminAccess(req, res, nextSpy);

    expect(nextSpy).toHaveBeenCalled();
  });
  it('with admin from lower group in same domain', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const adminLabs = await groupLabs.createAdminMember();
    const nextSpy = jest.fn();
    const req = { params: { groupId: groupBionutrient._id } };
    const res = { locals: { auth: { user: { _id: adminLabs.user._id } } } };

    await expect(assertHasGroupAdminAccess(req, res, nextSpy)).rejects.toThrow(boom.unauthorized());
    expect(nextSpy).not.toHaveBeenCalled();
  });
  it('with superAdmin', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const nextSpy = jest.fn();
    const req = { params: { groupId: groupLabs._id } };
    const res = { locals: { auth: { isSuperAdmin: true } } };

    await assertHasGroupAdminAccess(req, res, nextSpy);

    expect(nextSpy).toHaveBeenCalled();
  });
});
