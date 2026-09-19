import { DEFAULT_DHIKR, DEFAULT_DHIKR_ID } from '@/constants/dhikr';
import type { CustomDhikr } from '@/types';
import { customToDhikr, findDhikr, listDhikr, resolveDhikr } from '@/utils/dhikr';

const YA_RAHMAN: CustomDhikr = {
  id: 'custom-rahman',
  name: 'Ya Rahman',
  target: 7,
  createdAt: new Date(2026, 8, 1, 9, 0).getTime(),
};

const YA_RAHEEM: CustomDhikr = {
  id: 'custom-raheem',
  name: 'Ya Raheem',
  target: 100,
  createdAt: new Date(2026, 8, 2, 9, 0).getTime(),
};

describe('DEFAULT_DHIKR', () => {
  it('has unique ids', () => {
    const ids = DEFAULT_DHIKR.map((dhikr) => dhikr.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes the default Dhikr', () => {
    expect(DEFAULT_DHIKR.some((dhikr) => dhikr.id === DEFAULT_DHIKR_ID)).toBe(true);
  });

  it('is built in with a name and Arabic text', () => {
    for (const dhikr of DEFAULT_DHIKR) {
      expect(dhikr.isCustom).toBe(false);
      expect(dhikr.name.length).toBeGreaterThan(0);
      expect(dhikr.arabic?.length ?? 0).toBeGreaterThan(0);
      expect(dhikr.target).toBeUndefined();
    }
  });
});

describe('customToDhikr', () => {
  it('keeps the id, name and target and marks it custom', () => {
    expect(customToDhikr(YA_RAHMAN)).toEqual({
      id: 'custom-rahman',
      name: 'Ya Rahman',
      target: 7,
      isCustom: true,
    });
  });

  it('has no Arabic text', () => {
    expect(customToDhikr(YA_RAHMAN).arabic).toBeUndefined();
  });
});

describe('listDhikr', () => {
  it('lists only the built-in Dhikr without custom ones', () => {
    expect(listDhikr([])).toEqual(DEFAULT_DHIKR);
  });

  it('puts custom Dhikr after the built-in ones in the given order', () => {
    const list = listDhikr([YA_RAHMAN, YA_RAHEEM]);
    expect(list).toHaveLength(DEFAULT_DHIKR.length + 2);
    expect(list.slice(0, DEFAULT_DHIKR.length)).toEqual(DEFAULT_DHIKR);
    expect(list.slice(DEFAULT_DHIKR.length)).toEqual([
      customToDhikr(YA_RAHMAN),
      customToDhikr(YA_RAHEEM),
    ]);
  });

  it('returns a new array each time', () => {
    expect(listDhikr([])).not.toBe(listDhikr([]));
  });
});

describe('findDhikr', () => {
  it('finds a built-in Dhikr', () => {
    expect(findDhikr('alhamdulillah', [])).toBe(
      DEFAULT_DHIKR.find((dhikr) => dhikr.id === 'alhamdulillah'),
    );
  });

  it('finds a custom Dhikr', () => {
    expect(findDhikr('custom-raheem', [YA_RAHMAN, YA_RAHEEM])).toEqual(customToDhikr(YA_RAHEEM));
  });

  it('returns undefined for an unknown id', () => {
    expect(findDhikr('missing', [YA_RAHMAN])).toBeUndefined();
    expect(findDhikr('', [YA_RAHMAN])).toBeUndefined();
  });

  it('prefers the built-in Dhikr when a custom one shares its id', () => {
    const clash: CustomDhikr = { ...YA_RAHMAN, id: DEFAULT_DHIKR_ID };
    expect(findDhikr(DEFAULT_DHIKR_ID, [clash])?.isCustom).toBe(false);
  });
});

describe('resolveDhikr', () => {
  it('returns the matching Dhikr', () => {
    expect(resolveDhikr('astaghfirullah', []).id).toBe('astaghfirullah');
    expect(resolveDhikr('custom-rahman', [YA_RAHMAN])).toEqual(customToDhikr(YA_RAHMAN));
  });

  it('falls back to the first built-in Dhikr for an unknown id', () => {
    expect(resolveDhikr('deleted', [YA_RAHMAN])).toBe(DEFAULT_DHIKR[0]);
  });
});
