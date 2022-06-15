import { queryHyloUser, QUERY_PERSON_BY_EMAIL } from './hylo.service';

describe('hylo.service', () => {
  describe('queryHyloUser', () => {
    it('send the expected request', async () => {
      const email = 'foo@bar.com';
      const person = {};
      const gqlRequest = jest.fn(() => ({ person }));
      await queryHyloUser({ email, gqlRequest });
      expect(gqlRequest).toHaveBeenCalledWith(QUERY_PERSON_BY_EMAIL, { email });
    });

    it('returns the person from the result', async () => {
      const email = 'foo@bar.com';
      const person = { name: 'foo' };
      const gqlRequest = jest.fn(() => ({ person }));
      const result = await queryHyloUser({ email, gqlRequest });
      expect(result).toBe(person);
    });
  });
});
