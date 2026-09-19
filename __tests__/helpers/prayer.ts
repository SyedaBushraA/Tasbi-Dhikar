import { createDefaultAppState, createDefaultPrayerSettings } from '@/constants/defaults';
import type { ReminderContent, ReminderResult } from '@/services/reminders';
import { type ActionServices, type AppActions, createAppActions } from '@/state/actions';
import type { LocateResult, PrayerAlertInput, PrayerAlertResult } from '@/state/prayerActions';
import type { PrayerSettingsPatch } from '@/state/reducer';
import { type AppStore, createAppStore } from '@/state/store';
import type { AppStorage } from '@/storage/appStorage';
import type { AppState, PrayerDay, PrayerLocation, PrayerName, PrayerSettings, Settings } from '@/types';
import { dayKeyToDate } from '@/utils/date';

/*
 * Shared fixtures for the prayer tests. Times are built from local date parts
 * and places carry their own coordinates, so nothing here depends on the time
 * zone or the clock of the machine the tests run on.
 */

/** Local timestamp in 2026. Month is 1-12, so the dates read like the day keys. */
export function at(month: number, day: number, hour = 0, minute = 0, second = 0): number {
  return new Date(2026, month - 1, day, hour, minute, second).getTime();
}

export const HYDERABAD: PrayerLocation = {
  source: 'city',
  name: 'Hyderabad',
  region: 'Telangana',
  countryCode: 'IN',
  latitude: 17.384,
  longitude: 78.4564,
  timeZone: 'Asia/Kolkata',
  updatedAt: at(9, 1),
};

export const MAKKAH: PrayerLocation = {
  source: 'city',
  name: 'Makkah',
  countryCode: 'SA',
  latitude: 21.4266,
  longitude: 39.8256,
  timeZone: 'Asia/Riyadh',
  updatedAt: at(9, 1),
};

export const LONDON: PrayerLocation = {
  source: 'city',
  name: 'London',
  region: 'England',
  countryCode: 'GB',
  latitude: 51.5085,
  longitude: -0.1257,
  timeZone: 'Europe/London',
  updatedAt: at(9, 1),
};

export const NEW_YORK: PrayerLocation = {
  source: 'city',
  name: 'New York City',
  region: 'New York',
  countryCode: 'US',
  latitude: 40.7143,
  longitude: -74.006,
  timeZone: 'America/New_York',
  updatedAt: at(9, 1),
};

/** Inside the polar circle: in June the sun never sets, in December it never rises. */
export const LONGYEARBYEN: PrayerLocation = {
  source: 'city',
  name: 'Longyearbyen',
  region: 'Svalbard',
  countryCode: 'SJ',
  latitude: 78.2233,
  longitude: 15.6469,
  timeZone: 'Arctic/Longyearbyen',
  updatedAt: at(9, 1),
};

/**
 * A place on the meridian of the machine running the tests. Its solar day and
 * the local day of the device are the same, so tests that mix a timestamp with
 * a day key give the same answer in every time zone. The latitude is well
 * outside the polar circles, so every prayer always has a time.
 */
export function meridianPlace(dayKey: string, latitude = 21.4): PrayerLocation {
  const minutesEastOfUtc = -dayKeyToDate(dayKey).getTimezoneOffset();
  const longitude = Math.min(180, Math.max(-180, minutesEastOfUtc / 4));
  return { source: 'coordinates', name: 'Meridian', latitude, longitude, updatedAt: at(9, 1) };
}

/** Default prayer settings with the given changes applied, per-prayer values merged. */
export function prayerSettings(patch: PrayerSettingsPatch = {}): PrayerSettings {
  const base = createDefaultPrayerSettings();
  return {
    ...base,
    ...patch,
    adjustments: { ...base.adjustments, ...(patch.adjustments ?? {}) },
    notifications: { ...base.notifications, ...(patch.notifications ?? {}) },
    adhan: { ...base.adhan, ...(patch.adhan ?? {}) },
  };
}

/** The calculated time, failing the test when the place has none that day. */
export function requireTime(day: PrayerDay, name: PrayerName): number {
  const time = day.times[name];
  if (time === null) throw new Error(`${name} has no time on ${day.dayKey}`);
  return time;
}

export interface WallClock {
  /** YYYY-MM-DD in the given zone. */
  day: string;
  /** Minutes since local midnight in the given zone. */
  minutes: number;
}

/** A timestamp as it is read off a clock in a named time zone. */
export function wallClock(timestamp: number, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));
  const part = (type: string): string => parts.find((entry) => entry.type === type)?.value ?? '';
  return {
    day: `${part('year')}-${part('month')}-${part('day')}`,
    minutes: Number(part('hour')) * 60 + Number(part('minute')),
  };
}

export interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: unknown): void;
}

/** A promise whose settling the test decides, to hold an action mid-flight. */
export function deferred<T>(): Deferred<T> {
  let settle: (value: T) => void = () => undefined;
  let fail: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });
  return { promise, resolve: (value) => settle(value), reject: (error) => fail(error) };
}

/** Lets queued promise callbacks run, so fire-and-forget work finishes. */
export function flush(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

export interface MemoryStorage extends AppStorage {
  /** The slices written so far, with their latest values. */
  written: Partial<AppState>;
  /** How often a write was attempted. */
  saves: number;
}

/** Local storage that lives only in the test, so nothing touches the device. */
export function memoryStorage(initial: Partial<AppState> = {}): MemoryStorage {
  const stored: AppState = { ...createDefaultAppState(), ...initial };
  const storage: MemoryStorage = {
    written: {},
    saves: 0,
    load: () => Promise.resolve({ ...stored }),
    save: (slices) => {
      storage.saves += 1;
      Object.assign(storage.written, slices);
      Object.assign(stored, slices);
      return Promise.resolve(true);
    },
  };
  return storage;
}

export interface PrayerHarness {
  store: AppStore;
  actions: AppActions;
  storage: MemoryStorage;
  /** Reads the position of the phone once. */
  locate: jest.Mock<Promise<LocateResult>, []>;
  /** Brings the scheduled prayer notifications in line with the settings. */
  syncAlerts: jest.Mock<
    Promise<PrayerAlertResult>,
    [PrayerAlertInput, { requestPermission: boolean }]
  >;
  /** Prayer settings as they are now. */
  prayer(): PrayerSettings;
  /** Moves the clock the actions read. */
  setNow(value: number): void;
}

export interface HarnessOptions {
  prayer?: PrayerSettings;
  settings?: Partial<Settings>;
  now?: number;
}

/** A store and actions wired to fake device services, ready to use. */
export async function prayerHarness(options: HarnessOptions = {}): Promise<PrayerHarness> {
  const defaults = createDefaultAppState();
  const storage = memoryStorage({
    prayer: options.prayer ?? createDefaultPrayerSettings(),
    settings: { ...defaults.settings, ...options.settings },
  });

  let now = options.now ?? at(9, 20, 12);

  const locate = jest.fn<Promise<LocateResult>, []>();
  locate.mockResolvedValue({ status: 'failed' });
  const syncAlerts = jest.fn<
    Promise<PrayerAlertResult>,
    [PrayerAlertInput, { requestPermission: boolean }]
  >();
  syncAlerts.mockResolvedValue('scheduled');

  const scheduleReminder = jest.fn<Promise<ReminderResult>, [number, number, ReminderContent]>();
  scheduleReminder.mockResolvedValue('scheduled');
  const cancelReminder = jest.fn<Promise<void>, []>();
  cancelReminder.mockResolvedValue(undefined);
  const syncReminder = jest.fn<Promise<boolean>, [boolean, number, number, ReminderContent]>();
  syncReminder.mockResolvedValue(true);

  const services: ActionServices = {
    haptics: { tap: jest.fn(), complete: jest.fn(), selection: jest.fn() },
    sound: { tick: jest.fn(), complete: jest.fn() },
    reminders: { schedule: scheduleReminder, cancel: cancelReminder, sync: syncReminder },
    prayer: { locate, syncAlerts },
    now: () => now,
  };

  const store = createAppStore(storage, { debounceMs: 0 });
  const actions = createAppActions(store, services);
  await store.hydrate();

  return {
    store,
    actions,
    storage,
    locate,
    syncAlerts,
    prayer: () => store.getState().prayer,
    setNow: (value) => {
      now = value;
    },
  };
}
