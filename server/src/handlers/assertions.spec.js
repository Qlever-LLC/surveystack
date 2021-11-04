import boom from '@hapi/boom';
import { assertIsSuperAdmin } from './assertions.js';

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