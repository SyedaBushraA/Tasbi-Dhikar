import { DEFAULT_DHIKR } from '@/constants/dhikr';
import type { CustomDhikr, Dhikr } from '@/types';

export function customToDhikr(custom: CustomDhikr): Dhikr {
  return { id: custom.id, name: custom.name, target: custom.target, isCustom: true };
}

/** Built-in Dhikr first, then the user's own in the order they were created. */
export function listDhikr(customDhikr: readonly CustomDhikr[]): Dhikr[] {
  return [...DEFAULT_DHIKR, ...customDhikr.map(customToDhikr)];
}

export function findDhikr(id: string, customDhikr: readonly CustomDhikr[]): Dhikr | undefined {
  const builtIn = DEFAULT_DHIKR.find((dhikr) => dhikr.id === id);
  if (builtIn) return builtIn;
  const custom = customDhikr.find((dhikr) => dhikr.id === id);
  return custom ? customToDhikr(custom) : undefined;
}

/** The Dhikr for an id, falling back to the first built-in one if it no longer exists. */
export function resolveDhikr(id: string, customDhikr: readonly CustomDhikr[]): Dhikr {
  const fallback = DEFAULT_DHIKR[0];
  if (!fallback) throw new Error('At least one built-in Dhikr is required');
  return findDhikr(id, customDhikr) ?? fallback;
}
