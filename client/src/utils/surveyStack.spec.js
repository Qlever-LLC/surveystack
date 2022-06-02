import { setNested } from './surveyStack';

describe('surveyStack utils', () => {
  it('setNested should throw for invalid path', () => {
    expect(() => setNested({ a: { b: 1 } }, 'a.c.d', true)).toThrow();
  });
});
