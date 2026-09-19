import { MAX_DHIKR_NAME_LENGTH } from '@/constants/dhikr';
import { MAX_TARGET, MIN_TARGET } from '@/constants/targets';
import {
  isValidTarget,
  normalizeDhikrName,
  validateDhikrName,
  validateTarget,
} from '@/utils/validation';

describe('validateTarget', () => {
  it('requires some input', () => {
    expect(validateTarget('')).toEqual({ ok: false, error: 'required' });
    expect(validateTarget('   ')).toEqual({ ok: false, error: 'required' });
    expect(validateTarget('\t\n')).toEqual({ ok: false, error: 'required' });
  });

  it('accepts whole numbers with surrounding whitespace', () => {
    expect(validateTarget(' 33 ')).toEqual({ ok: true, value: 33 });
    expect(validateTarget('\t99\n')).toEqual({ ok: true, value: 99 });
  });

  it('rejects text that is not a whole number', () => {
    expect(validateTarget('abc')).toEqual({ ok: false, error: 'notANumber' });
    expect(validateTarget('12a')).toEqual({ ok: false, error: 'notANumber' });
    expect(validateTarget('3 3')).toEqual({ ok: false, error: 'notANumber' });
    expect(validateTarget('1,000')).toEqual({ ok: false, error: 'notANumber' });
    expect(validateTarget('+5')).toEqual({ ok: false, error: 'notANumber' });
    expect(validateTarget('1e3')).toEqual({ ok: false, error: 'notANumber' });
  });

  it('rejects decimals', () => {
    expect(validateTarget('3.5')).toEqual({ ok: false, error: 'notANumber' });
    expect(validateTarget('33.0')).toEqual({ ok: false, error: 'notANumber' });
    expect(validateTarget(3.5).ok).toBe(false);
  });

  it('rejects negative numbers', () => {
    expect(validateTarget('-5')).toEqual({ ok: false, error: 'notANumber' });
    expect(validateTarget(-5).ok).toBe(false);
  });

  it('rejects zero and accepts the minimum', () => {
    expect(validateTarget('0')).toEqual({ ok: false, error: 'tooSmall' });
    expect(validateTarget(0)).toEqual({ ok: false, error: 'tooSmall' });
    expect(validateTarget('1')).toEqual({ ok: true, value: 1 });
    expect(validateTarget(MIN_TARGET)).toEqual({ ok: true, value: MIN_TARGET });
  });

  it('accepts the maximum and rejects one more', () => {
    expect(validateTarget(String(MAX_TARGET))).toEqual({ ok: true, value: MAX_TARGET });
    expect(validateTarget(MAX_TARGET)).toEqual({ ok: true, value: MAX_TARGET });
    expect(validateTarget(String(MAX_TARGET + 1))).toEqual({ ok: false, error: 'tooLarge' });
    expect(validateTarget(MAX_TARGET + 1)).toEqual({ ok: false, error: 'tooLarge' });
  });

  it('reports huge numbers as too large', () => {
    expect(validateTarget('99999999999999999999')).toEqual({ ok: false, error: 'tooLarge' });
    expect(validateTarget('1'.repeat(400))).toEqual({ ok: false, error: 'tooLarge' });
    expect(validateTarget(Number.MAX_SAFE_INTEGER + 1)).toEqual({ ok: false, error: 'tooLarge' });
    expect(validateTarget(1e21).ok).toBe(false);
    expect(validateTarget(Number.POSITIVE_INFINITY).ok).toBe(false);
  });

  it('rejects a number that is not a number', () => {
    expect(validateTarget(Number.NaN).ok).toBe(false);
  });

  it('accepts numeric input directly', () => {
    expect(validateTarget(33)).toEqual({ ok: true, value: 33 });
    expect(validateTarget(1000)).toEqual({ ok: true, value: 1000 });
  });

  it('ignores leading zeros', () => {
    expect(validateTarget('007')).toEqual({ ok: true, value: 7 });
  });
});

describe('isValidTarget', () => {
  it('accepts whole numbers within the allowed range', () => {
    expect(isValidTarget(MIN_TARGET)).toBe(true);
    expect(isValidTarget(33)).toBe(true);
    expect(isValidTarget(MAX_TARGET)).toBe(true);
  });

  it('rejects numbers outside the range', () => {
    expect(isValidTarget(0)).toBe(false);
    expect(isValidTarget(-1)).toBe(false);
    expect(isValidTarget(MAX_TARGET + 1)).toBe(false);
  });

  it('rejects fractions and non-finite numbers', () => {
    expect(isValidTarget(3.5)).toBe(false);
    expect(isValidTarget(Number.NaN)).toBe(false);
    expect(isValidTarget(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it('rejects anything that is not a number', () => {
    expect(isValidTarget('33')).toBe(false);
    expect(isValidTarget(null)).toBe(false);
    expect(isValidTarget(undefined)).toBe(false);
    expect(isValidTarget({ value: 33 })).toBe(false);
    expect(isValidTarget(true)).toBe(false);
  });
});

describe('normalizeDhikrName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeDhikrName('  Ya Rahman  ')).toBe('Ya Rahman');
  });

  it('collapses runs of whitespace into one space', () => {
    expect(normalizeDhikrName('Ya    Rahman')).toBe('Ya Rahman');
    expect(normalizeDhikrName('Ya\t\nRahman')).toBe('Ya Rahman');
  });

  it('leaves a clean name alone', () => {
    expect(normalizeDhikrName('Ya Rahman')).toBe('Ya Rahman');
  });

  it('reduces whitespace-only input to an empty string', () => {
    expect(normalizeDhikrName('   ')).toBe('');
  });
});

describe('validateDhikrName', () => {
  const existing = ['SubhanAllah', 'Ya Rahman'];

  it('requires a name', () => {
    expect(validateDhikrName('', existing)).toEqual({ ok: false, error: 'required' });
    expect(validateDhikrName('   ', existing)).toEqual({ ok: false, error: 'required' });
  });

  it('returns the normalized name', () => {
    expect(validateDhikrName('  Ya   Raheem ', existing)).toEqual({ ok: true, value: 'Ya Raheem' });
  });

  it('accepts a name with no other names taken', () => {
    expect(validateDhikrName('Ya Rahman', [])).toEqual({ ok: true, value: 'Ya Rahman' });
  });

  it('limits the length after normalizing', () => {
    const longest = 'a'.repeat(MAX_DHIKR_NAME_LENGTH);
    expect(validateDhikrName(longest, [])).toEqual({ ok: true, value: longest });
    expect(validateDhikrName(`  ${longest}  `, [])).toEqual({ ok: true, value: longest });
    expect(validateDhikrName(`${longest}b`, [])).toEqual({ ok: false, error: 'tooLong' });
  });

  it('rejects a duplicate regardless of case', () => {
    expect(validateDhikrName('SubhanAllah', existing)).toEqual({ ok: false, error: 'duplicate' });
    expect(validateDhikrName('subhanallah', existing)).toEqual({ ok: false, error: 'duplicate' });
    expect(validateDhikrName('YA RAHMAN', existing)).toEqual({ ok: false, error: 'duplicate' });
  });

  it('rejects a duplicate that only differs in whitespace', () => {
    expect(validateDhikrName('  ya   rahman ', existing)).toEqual({ ok: false, error: 'duplicate' });
    expect(validateDhikrName('Ya Rahman', ['Ya    Rahman'])).toEqual({
      ok: false,
      error: 'duplicate',
    });
  });

  it('accepts a name that only shares a prefix with a taken one', () => {
    expect(validateDhikrName('Ya Rahman al-Rahim', existing)).toEqual({
      ok: true,
      value: 'Ya Rahman al-Rahim',
    });
  });

  it('accepts the own name of the Dhikr being edited when it is excluded', () => {
    const others = existing.filter((name) => name !== 'Ya Rahman');
    expect(validateDhikrName('Ya Rahman', others)).toEqual({ ok: true, value: 'Ya Rahman' });
    expect(validateDhikrName('ya rahman', others)).toEqual({ ok: true, value: 'ya rahman' });
  });

  it('reports an empty name before checking for duplicates', () => {
    expect(validateDhikrName('', [''])).toEqual({ ok: false, error: 'required' });
  });
});
