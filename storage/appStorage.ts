import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppState } from '@/types';

import { APP_STATE_SLICES, STORAGE_KEYS } from './keys';
import { sanitizeAppState } from './sanitize';

/**
 * The only place in the app that talks to AsyncStorage. Nothing here throws:
 * a device with full or broken storage must still be able to count.
 */
export interface AppStorage {
  load(): Promise<AppState>;
  /** Writes the given slices. Resolves to false if the write failed. */
  save(slices: Partial<AppState>): Promise<boolean>;
}

function parseJson(text: string | null): unknown {
  if (text === null) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function loadAppState(): Promise<AppState> {
  const raw: Partial<Record<keyof AppState, unknown>> = {};
  try {
    const entries = await AsyncStorage.multiGet(APP_STATE_SLICES.map((slice) => STORAGE_KEYS[slice]));
    for (const slice of APP_STATE_SLICES) {
      const entry = entries.find(([key]) => key === STORAGE_KEYS[slice]);
      raw[slice] = parseJson(entry?.[1] ?? null);
    }
  } catch {
    // Unreadable storage: start from defaults rather than failing to open.
  }
  return sanitizeAppState(raw);
}

export async function saveAppState(slices: Partial<AppState>): Promise<boolean> {
  const entries: [string, string][] = [];
  for (const slice of APP_STATE_SLICES) {
    const value = slices[slice];
    if (value !== undefined) entries.push([STORAGE_KEYS[slice], JSON.stringify(value)]);
  }
  if (entries.length === 0) return true;

  try {
    await AsyncStorage.multiSet(entries);
    return true;
  } catch {
    return false;
  }
}

export const appStorage: AppStorage = {
  load: loadAppState,
  save: saveAppState,
};
