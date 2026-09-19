import { MAX_DHIKR_NAME_LENGTH } from '@/constants/dhikr';
import { MAX_TARGET, MIN_TARGET } from '@/constants/targets';

export type TargetError = 'required' | 'notANumber' | 'tooSmall' | 'tooLarge';

export type TargetValidation =
  | { ok: true; value: number }
  | { ok: false; error: TargetError };

/** Accepts what a user typed (or a number) and returns a usable whole target. */
export function validateTarget(input: string | number): TargetValidation {
  const text = typeof input === 'number' ? String(input) : input.trim();
  if (text.length === 0) return { ok: false, error: 'required' };
  if (!/^\d+$/.test(text)) return { ok: false, error: 'notANumber' };

  const value = Number(text);
  if (!Number.isSafeInteger(value)) return { ok: false, error: 'tooLarge' };
  if (value < MIN_TARGET) return { ok: false, error: 'tooSmall' };
  if (value > MAX_TARGET) return { ok: false, error: 'tooLarge' };
  return { ok: true, value };
}

export function isValidTarget(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_TARGET &&
    value <= MAX_TARGET
  );
}

export type DhikrNameError = 'required' | 'tooLong' | 'duplicate';

export type DhikrNameValidation =
  | { ok: true; value: string }
  | { ok: false; error: DhikrNameError };

/** Collapses whitespace so "  Ya   Rahman " and "Ya Rahman" are the same name. */
export function normalizeDhikrName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * @param existingNames names already in use (built-in and custom), excluding
 * the Dhikr being edited.
 */
export function validateDhikrName(
  input: string,
  existingNames: readonly string[],
): DhikrNameValidation {
  const value = normalizeDhikrName(input);
  if (value.length === 0) return { ok: false, error: 'required' };
  if (value.length > MAX_DHIKR_NAME_LENGTH) return { ok: false, error: 'tooLong' };

  const lower = value.toLowerCase();
  const taken = existingNames.some((name) => normalizeDhikrName(name).toLowerCase() === lower);
  if (taken) return { ok: false, error: 'duplicate' };
  return { ok: true, value };
}
