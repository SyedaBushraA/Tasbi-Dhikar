import { createId } from '@/utils/id';

const ID_PATTERN = /^[0-9a-z]+-[0-9a-z]{6}$/;

describe('createId', () => {
  const now = new Date(2026, 8, 14, 10, 0).getTime();

  it('starts with the time in base 36', () => {
    expect(createId(now).startsWith(`${now.toString(36)}-`)).toBe(true);
  });

  it('has a six character random suffix', () => {
    expect(createId(now)).toMatch(ID_PATTERN);
  });

  it('uses the current time by default', () => {
    expect(createId()).toMatch(ID_PATTERN);
  });

  it('differs between calls at the same time', () => {
    const ids = new Set(Array.from({ length: 200 }, () => createId(now)));
    expect(ids.size).toBe(200);
  });
});
