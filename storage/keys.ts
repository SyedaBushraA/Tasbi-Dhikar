import type { AppState } from '@/types';

/** One storage entry per slice of state, so a small change never rewrites everything. */
export const STORAGE_KEYS: Readonly<Record<keyof AppState, string>> = {
  settings: 'tasbi:v1:settings',
  customDhikr: 'tasbi:v1:customDhikr',
  counter: 'tasbi:v1:counter',
  stats: 'tasbi:v1:stats',
  history: 'tasbi:v1:history',
  prayer: 'tasbi:v1:prayer',
};

export const APP_STATE_SLICES = Object.keys(STORAGE_KEYS) as (keyof AppState)[];
