import { createDefaultAppState } from '@/constants/defaults';
import { MAX_ADJUSTMENT, MIN_ADJUSTMENT } from '@/constants/prayer';
import { type PrayerSettingsPatch, appReducer } from '@/state/reducer';
import type { AppState, PrayerSettings } from '@/types';

import { HYDERABAD, prayerSettings } from '../helpers/prayer';

function stateWith(prayer: PrayerSettings): AppState {
  return { ...createDefaultAppState(), prayer };
}

function update(prayer: PrayerSettings, patch: PrayerSettingsPatch): PrayerSettings {
  return appReducer(stateWith(prayer), { type: 'updatePrayer', patch }).prayer;
}

describe("appReducer 'updatePrayer'", () => {
  it('changes only what the patch mentions', () => {
    const before = prayerSettings({ method: 'Karachi', asrMethod: 'hanafi' });
    const after = update(before, { methodConfirmed: true });

    expect(after.methodConfirmed).toBe(true);
    expect(after.method).toBe('Karachi');
    expect(after.asrMethod).toBe('hanafi');
    expect(after.location).toBeNull();
  });

  it('stores and clears the place', () => {
    const withPlace = update(prayerSettings(), { location: HYDERABAD });
    expect(withPlace.location).toEqual(HYDERABAD);
    expect(update(withPlace, { location: null }).location).toBeNull();
  });

  it('merges one prayer at a time into the per-prayer settings', () => {
    const before = prayerSettings({ notifications: { fajr: true }, adhan: { isha: false } });
    const after = update(before, { notifications: { asr: true }, adhan: { fajr: false } });

    expect(after.notifications).toEqual({
      fajr: true,
      dhuhr: false,
      asr: true,
      maghrib: false,
      isha: false,
    });
    expect(after.adhan).toEqual({
      fajr: false,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: false,
    });
  });

  it('merges one prayer at a time into the adjustments', () => {
    const before = prayerSettings({ adjustments: { fajr: 2 } });
    const after = update(before, { adjustments: { isha: -3 } });

    expect(after.adjustments).toEqual({
      fajr: 2,
      sunrise: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: -3,
    });
  });

  it('keeps every adjustment within an hour either way', () => {
    const after = update(prayerSettings(), { adjustments: { fajr: 500, isha: -500 } });
    expect(after.adjustments.fajr).toBe(MAX_ADJUSTMENT);
    expect(after.adjustments.isha).toBe(MIN_ADJUSTMENT);

    const edges = update(prayerSettings(), { adjustments: { fajr: 60, isha: -60 } });
    expect(edges.adjustments.fajr).toBe(60);
    expect(edges.adjustments.isha).toBe(-60);
  });

  it('rounds an adjustment to whole minutes', () => {
    const after = update(prayerSettings(), {
      adjustments: { fajr: 2.4, dhuhr: 2.6, asr: -2.6 },
    });
    expect(after.adjustments.fajr).toBe(2);
    expect(after.adjustments.dhuhr).toBe(3);
    expect(after.adjustments.asr).toBe(-3);
  });

  it('ignores an adjustment that is not a number', () => {
    const before = prayerSettings({ adjustments: { fajr: 7 } });
    const after = update(before, {
      adjustments: { fajr: Number.NaN, dhuhr: Number.POSITIVE_INFINITY },
    });

    expect(after.adjustments.fajr).toBe(7);
    expect(after.adjustments.dhuhr).toBe(0);
  });

  it('keeps the Adhan volume between silence and full', () => {
    expect(update(prayerSettings(), { adhanVolume: 1.5 }).adhanVolume).toBe(1);
    expect(update(prayerSettings(), { adhanVolume: -0.5 }).adhanVolume).toBe(0);
    expect(update(prayerSettings(), { adhanVolume: 0 }).adhanVolume).toBe(0);
    expect(update(prayerSettings(), { adhanVolume: 0.35 }).adhanVolume).toBe(0.35);
  });

  it('ignores an Adhan volume that is not a number', () => {
    const before = prayerSettings({ adhanVolume: 0.4 });
    expect(update(before, { adhanVolume: Number.NaN }).adhanVolume).toBe(0.4);
    expect(update(before, { adhanVolume: Number.POSITIVE_INFINITY }).adhanVolume).toBe(0.4);
  });

  it('leaves the rest of the app alone', () => {
    const before = stateWith(prayerSettings());
    const after = appReducer(before, { type: 'updatePrayer', patch: { adhanEnabled: true } });

    expect(after).not.toBe(before);
    expect(after.settings).toBe(before.settings);
    expect(after.counter).toBe(before.counter);
    expect(after.history).toBe(before.history);
    expect(after.stats).toBe(before.stats);
  });

  it('does not change the settings it was given', () => {
    const before = prayerSettings({ adjustments: { fajr: 1 }, notifications: { fajr: true } });
    update(before, { adjustments: { fajr: 9 }, notifications: { fajr: false }, adhanVolume: 0.1 });

    expect(before.adjustments.fajr).toBe(1);
    expect(before.notifications.fajr).toBe(true);
    expect(before.adhanVolume).toBe(0.8);
  });
});
