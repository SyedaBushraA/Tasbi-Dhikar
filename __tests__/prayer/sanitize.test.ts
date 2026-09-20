import { DEFAULT_SETTINGS, createDefaultPrayerSettings } from '@/constants/defaults';
import { sanitizePrayerSettings, sanitizeSettings } from '@/storage/sanitize';
import type { PrayerSettings } from '@/types';

import { HYDERABAD } from '../helpers/prayer';

const defaults = createDefaultPrayerSettings();

/** Saved data comes back as plain JSON, never as the objects the app holds. */
function saved(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

describe('sanitizePrayerSettings', () => {
  it('starts from the defaults when nothing was saved', () => {
    expect(sanitizePrayerSettings(undefined)).toEqual(defaults);
    expect(sanitizePrayerSettings(null)).toEqual(defaults);
    expect(sanitizePrayerSettings('broken')).toEqual(defaults);
    expect(sanitizePrayerSettings([])).toEqual(defaults);
    expect(sanitizePrayerSettings({})).toEqual(defaults);
  });

  it('assumes nothing: no place, no notification, no Adhan', () => {
    const fresh = sanitizePrayerSettings({});
    expect(fresh.location).toBeNull();
    expect(Object.values(fresh.notifications).some(Boolean)).toBe(false);
    expect(fresh.adhanEnabled).toBe(false);
    expect(fresh.methodConfirmed).toBe(false);
  });

  it('gives back a complete set of settings unchanged', () => {
    const valid: PrayerSettings = {
      location: HYDERABAD,
      method: 'Karachi',
      methodConfirmed: true,
      asrMethod: 'hanafi',
      adjustments: { fajr: 2, sunrise: 0, dhuhr: -1, asr: 0, maghrib: 3, isha: -5 },
      notifications: { fajr: true, dhuhr: false, asr: true, maghrib: true, isha: false },
      alertsBlocked: true,
      adhanEnabled: true,
      adhan: { fajr: true, dhuhr: false, asr: false, maghrib: true, isha: true },
      fajrAdhanSeparate: false,
      adhanVolume: 0.55,
    };

    expect(sanitizePrayerSettings(saved(valid))).toEqual(valid);
  });

  it('falls back to the default calculation method for an unknown one', () => {
    expect(sanitizePrayerSettings({ method: 'Karachi' }).method).toBe('Karachi');
    expect(sanitizePrayerSettings({ method: 'MadeUp' }).method).toBe(defaults.method);
    expect(sanitizePrayerSettings({ method: 7 }).method).toBe(defaults.method);
  });

  it('only knows two Asr times', () => {
    expect(sanitizePrayerSettings({ asrMethod: 'hanafi' }).asrMethod).toBe('hanafi');
    expect(sanitizePrayerSettings({ asrMethod: 'standard' }).asrMethod).toBe('standard');
    expect(sanitizePrayerSettings({ asrMethod: 'shafi' }).asrMethod).toBe('standard');
  });

  it('drops a place that is not usable', () => {
    const base = saved(HYDERABAD) as Record<string, unknown>;

    expect(sanitizePrayerSettings({ location: 'Hyderabad' }).location).toBeNull();
    expect(sanitizePrayerSettings({ location: { ...base, latitude: 100 } }).location).toBeNull();
    expect(sanitizePrayerSettings({ location: { ...base, latitude: '17' } }).location).toBeNull();
    expect(sanitizePrayerSettings({ location: { ...base, longitude: 200 } }).location).toBeNull();
    expect(
      sanitizePrayerSettings({ location: { ...base, longitude: Number.NaN } }).location,
    ).toBeNull();
    expect(sanitizePrayerSettings({ location: { ...base, source: 'gps' } }).location).toBeNull();
    expect(sanitizePrayerSettings({ location: { ...base, name: '' } }).location).toBeNull();
    expect(sanitizePrayerSettings({ location: { ...base, name: 42 } }).location).toBeNull();
  });

  it('accepts the edges of the globe', () => {
    const base = saved(HYDERABAD) as Record<string, unknown>;
    const poles = sanitizePrayerSettings({
      location: { ...base, latitude: -90, longitude: 180 },
    }).location;

    expect(poles?.latitude).toBe(-90);
    expect(poles?.longitude).toBe(180);
  });

  it('tidies up the parts of a place that are only sometimes known', () => {
    const base = saved(HYDERABAD) as Record<string, unknown>;

    expect(sanitizePrayerSettings({ location: { ...base, countryCode: 'in' } }).location).toEqual(
      expect.objectContaining({ countryCode: 'IN' }),
    );

    const noCountry = sanitizePrayerSettings({ location: { ...base, countryCode: 'ind' } }).location;
    expect(noCountry?.countryCode).toBeUndefined();
    expect(
      sanitizePrayerSettings({ location: { ...base, countryCode: 7 } }).location?.countryCode,
    ).toBeUndefined();

    const bare = sanitizePrayerSettings({
      location: { source: 'coordinates', name: 'A place', latitude: 0, longitude: 0 },
    }).location;
    expect(bare).toEqual({
      source: 'coordinates',
      name: 'A place',
      latitude: 0,
      longitude: 0,
      updatedAt: 0,
    });
  });

  it('shortens a name that is far too long', () => {
    const base = saved(HYDERABAD) as Record<string, unknown>;
    const name = sanitizePrayerSettings({ location: { ...base, name: 'x'.repeat(200) } }).location
      ?.name;
    expect(name).toHaveLength(80);
  });

  it('forgets an adjustment that is out of range or not whole minutes', () => {
    const adjustments = sanitizePrayerSettings({
      adjustments: { fajr: 61, dhuhr: -61, asr: 2.5, maghrib: 'late', isha: 12 },
    }).adjustments;

    expect(adjustments).toEqual({
      fajr: 0,
      sunrise: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 12,
    });
  });

  it('keeps the adjustments at the edge of the allowed range', () => {
    const adjustments = sanitizePrayerSettings({ adjustments: { fajr: 60, isha: -60 } }).adjustments;
    expect(adjustments.fajr).toBe(60);
    expect(adjustments.isha).toBe(-60);
  });

  it('reads a switch per prayer and keeps the default for anything else', () => {
    const notifications = sanitizePrayerSettings({
      notifications: { fajr: true, dhuhr: 'yes', asr: 1 },
    }).notifications;
    expect(notifications).toEqual({
      fajr: true,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    });

    const adhan = sanitizePrayerSettings({ adhan: { fajr: false, dhuhr: null } }).adhan;
    expect(adhan).toEqual({ fajr: false, dhuhr: true, asr: true, maghrib: true, isha: true });

    expect(sanitizePrayerSettings({ notifications: 'all' }).notifications).toEqual(
      defaults.notifications,
    );
  });

  it('keeps the Adhan volume usable', () => {
    expect(sanitizePrayerSettings({ adhanVolume: 0 }).adhanVolume).toBe(0);
    expect(sanitizePrayerSettings({ adhanVolume: 1 }).adhanVolume).toBe(1);
    expect(sanitizePrayerSettings({ adhanVolume: 0.25 }).adhanVolume).toBe(0.25);
    expect(sanitizePrayerSettings({ adhanVolume: 1.4 }).adhanVolume).toBe(defaults.adhanVolume);
    expect(sanitizePrayerSettings({ adhanVolume: -1 }).adhanVolume).toBe(defaults.adhanVolume);
    expect(sanitizePrayerSettings({ adhanVolume: Number.NaN }).adhanVolume).toBe(
      defaults.adhanVolume,
    );
    expect(sanitizePrayerSettings({ adhanVolume: 'loud' }).adhanVolume).toBe(defaults.adhanVolume);
  });

  it('reads the Adhan switches as they were saved', () => {
    const settings = sanitizePrayerSettings({ adhanEnabled: true, fajrAdhanSeparate: false });
    expect(settings.adhanEnabled).toBe(true);
    expect(settings.fajrAdhanSeparate).toBe(false);

    const odd = sanitizePrayerSettings({ adhanEnabled: 'on', fajrAdhanSeparate: 0 });
    expect(odd.adhanEnabled).toBe(defaults.adhanEnabled);
    expect(odd.fajrAdhanSeparate).toBe(defaults.fajrAdhanSeparate);
  });
});

describe('sanitizeSettings clock format', () => {
  it('keeps a clock format the app knows', () => {
    expect(sanitizeSettings({ clockFormat: '24h' }).clockFormat).toBe('24h');
    expect(sanitizeSettings({ clockFormat: '12h' }).clockFormat).toBe('12h');
  });

  it('falls back to the default for anything else', () => {
    expect(sanitizeSettings(undefined).clockFormat).toBe(DEFAULT_SETTINGS.clockFormat);
    expect(sanitizeSettings({}).clockFormat).toBe(DEFAULT_SETTINGS.clockFormat);
    expect(sanitizeSettings({ clockFormat: '48h' }).clockFormat).toBe(DEFAULT_SETTINGS.clockFormat);
    expect(sanitizeSettings({ clockFormat: 24 }).clockFormat).toBe(DEFAULT_SETTINGS.clockFormat);
  });
});
