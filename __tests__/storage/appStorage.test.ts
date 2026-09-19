import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDefaultAppState } from '@/constants/defaults';
import { loadAppState, saveAppState } from '@/storage/appStorage';
import { STORAGE_KEYS } from '@/storage/keys';
import type { AppState } from '@/types';

/** Local timestamp in September 2026, so day keys do not depend on the timezone. */
function at(day: number, hour = 10, minute = 0): number {
  return new Date(2026, 8, day, hour, minute).getTime();
}

/** A state in which every slice differs from the defaults and survives sanitizing. */
function savedState(): AppState {
  return {
    settings: {
      theme: 'dark',
      language: 'en',
      easyMode: true,
      hapticsEnabled: false,
      soundEnabled: true,
      defaultTarget: 99,
      reminder: { enabled: true, hour: 6, minute: 30 },
      onboardingCompleted: true,
      clockFormat: '24h',
    },
    customDhikr: [{ id: 'custom-1', name: 'Ya Rahman', target: 100, createdAt: at(10) }],
    counter: {
      dhikrId: 'custom-1',
      target: 100,
      count: 12,
      paused: false,
      startedAt: at(14, 9),
      lastTapAt: at(14, 9, 30),
      completedSessionId: null,
    },
    stats: { daily: { '2026-09-14': 45 }, completedSessions: 2 },
    history: [
      {
        id: 's1',
        dhikrId: 'subhanallah',
        dhikrName: 'SubhanAllah',
        count: 33,
        target: 33,
        completedAt: at(13, 20),
      },
    ],
    prayer: {
      location: {
        source: 'city',
        name: 'Hyderabad',
        region: 'Telangana',
        countryCode: 'IN',
        latitude: 17.385,
        longitude: 78.487,
        timeZone: 'Asia/Kolkata',
        updatedAt: at(12),
      },
      method: 'Karachi',
      methodConfirmed: true,
      asrMethod: 'hanafi',
      adjustments: { fajr: 2, sunrise: 0, dhuhr: -1, asr: 0, maghrib: 3, isha: 0 },
      notifications: { fajr: true, dhuhr: false, asr: true, maghrib: true, isha: false },
      adhanEnabled: true,
      adhan: { fajr: true, dhuhr: true, asr: false, maghrib: true, isha: true },
      fajrAdhanSeparate: false,
      adhanVolume: 0.5,
    },
  };
}

describe('loadAppState', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the defaults when the phone has nothing saved', async () => {
    await expect(loadAppState()).resolves.toEqual(createDefaultAppState());
  });

  it('reads back every slice that was written', async () => {
    const state = savedState();
    await saveAppState(state);
    await expect(loadAppState()).resolves.toEqual(state);
  });

  it('resets only the damaged slice', async () => {
    const state = savedState();
    await saveAppState(state);
    await AsyncStorage.setItem(STORAGE_KEYS.history, '{ this is not json');

    const loaded = await loadAppState();
    expect(loaded.history).toEqual([]);
    expect(loaded.settings).toEqual(state.settings);
    expect(loaded.customDhikr).toEqual(state.customDhikr);
  });

  it('starts from the defaults when storage cannot be read at all', async () => {
    await saveAppState(savedState());
    // The AsyncStorage test double is itself built from jest mocks, so a spy on
    // it is never restored. Failing a single call keeps the rest of the file honest.
    jest.spyOn(AsyncStorage, 'multiGet').mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(loadAppState()).resolves.toEqual(createDefaultAppState());
  });

  it('ignores a slice that holds something other than an object', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify('dark'));
    await AsyncStorage.setItem(STORAGE_KEYS.history, JSON.stringify(null));

    const loaded = await loadAppState();
    expect(loaded.settings).toEqual(createDefaultAppState().settings);
    expect(loaded.history).toEqual([]);
  });
});

describe('saveAppState', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('writes only the slices it was given', async () => {
    const state = savedState();
    await expect(saveAppState({ counter: state.counter })).resolves.toBe(true);

    await expect(AsyncStorage.getItem(STORAGE_KEYS.counter)).resolves.toBe(
      JSON.stringify(state.counter),
    );
    await expect(AsyncStorage.getItem(STORAGE_KEYS.settings)).resolves.toBeNull();
    await expect(AsyncStorage.getItem(STORAGE_KEYS.stats)).resolves.toBeNull();
  });

  it('writes several slices in one go', async () => {
    const multiSet = jest.spyOn(AsyncStorage, 'multiSet');
    const state = savedState();
    await saveAppState({ settings: state.settings, prayer: state.prayer });

    const written = multiSet.mock.calls[0]?.[0];
    expect(written?.map(([key]) => key)).toEqual([STORAGE_KEYS.settings, STORAGE_KEYS.prayer]);
  });

  it('succeeds without touching storage when there is nothing to write', async () => {
    const multiSet = jest.spyOn(AsyncStorage, 'multiSet');
    await expect(saveAppState({})).resolves.toBe(true);
    expect(multiSet).not.toHaveBeenCalled();
  });

  it('reports a failure instead of throwing when the write is refused', async () => {
    jest.spyOn(AsyncStorage, 'multiSet').mockRejectedValueOnce(new Error('disk full'));

    await expect(saveAppState({ settings: savedState().settings })).resolves.toBe(false);
  });
});
