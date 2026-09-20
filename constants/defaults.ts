import type { AppState, CounterState, PrayerSettings, SalahName, Settings, StatsData } from '@/types';

import { DEFAULT_DHIKR_ID } from './dhikr';
import { DEFAULT_CALCULATION_METHOD } from './prayer';
import { DEFAULT_TARGET } from './targets';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'en',
  easyMode: false,
  hapticsEnabled: true,
  soundEnabled: false,
  defaultTarget: DEFAULT_TARGET,
  reminder: { enabled: false, hour: 20, minute: 0 },
  onboardingCompleted: false,
  clockFormat: '12h',
};

function perSalah(value: boolean): Record<SalahName, boolean> {
  return { fajr: value, dhuhr: value, asr: value, maghrib: value, isha: value };
}

/** Nothing is assumed: no location, and no notification until the user turns it on. */
export function createDefaultPrayerSettings(): PrayerSettings {
  return {
    location: null,
    method: DEFAULT_CALCULATION_METHOD,
    methodConfirmed: false,
    asrMethod: 'standard',
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    notifications: perSalah(false),
    adhanEnabled: false,
    adhan: perSalah(true),
    fajrAdhanSeparate: true,
    adhanVolume: 0.8,
  };
}

export const DEFAULT_COUNTER: CounterState = {
  dhikrId: DEFAULT_DHIKR_ID,
  target: DEFAULT_TARGET,
  count: 0,
  paused: false,
  startedAt: null,
  lastTapAt: null,
  completedSessionId: null,
};

/** A factory, so the empty `daily` map is never shared between states. */
export function createDefaultStats(): StatsData {
  return { daily: {}, completedSessions: 0 };
}

export function createDefaultAppState(): AppState {
  return {
    settings: { ...DEFAULT_SETTINGS, reminder: { ...DEFAULT_SETTINGS.reminder } },
    customDhikr: [],
    counter: { ...DEFAULT_COUNTER },
    stats: createDefaultStats(),
    history: [],
    prayer: createDefaultPrayerSettings(),
  };
}

/** Oldest sessions beyond this are dropped from the list; totals are kept in stats. */
export const MAX_HISTORY_RECORDS = 1000;

/** Taps closer together than this are treated as one accidental double tap. */
export const MIN_TAP_INTERVAL_MS = 35;

/** Quiet period before the running count is written to storage. */
export const PERSIST_DEBOUNCE_MS = 400;

/** 0 = Sunday, 1 = Monday. Used for "this week" in statistics. */
export const WEEK_STARTS_ON = 1;
