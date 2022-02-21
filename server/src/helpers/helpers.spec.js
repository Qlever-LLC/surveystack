import slugify from './slugify';

describe('helpers', () => {
  describe('slugify', () => {
    it('lowers', async () => {
      expect(slugify('tEsTStRiNg')).toBe('teststring');
    });
    it('replaces spaces with underline', async () => {
      expect(slugify('test string')).toBe('test_string');
    });
    it('replaces non-word-chars', async () => {
      expect(slugify('*/-+<>test*/-+<>string*/-+<>')).toBe('teststring');
    });
    it('keeps word-chars', async () => {
      expect(slugify('*/-+<>abcdefghijklmnopqrstuvwxyz1234567890')).toBe(
        'abcdefghijklmnopqrstuvwxyz1234567890'
      );
    });
    it('replaces multiple _ with single -', async () => {
      expect(slugify('__1___2_3___')).toBe('-1-2_3-');
    });
    it('trim -', async () => {
      expect(slugify('-test-')).toBe('test');
    });
  });
});
