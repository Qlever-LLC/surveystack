import boom from '@hapi/boom';
import { assertIsSuperAdmin, assertHasIds } from './assertions.js';

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
