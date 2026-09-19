import { createDefaultPrayerSettings } from '@/constants/defaults';
import { MAX_ADJUSTMENT, MIN_ADJUSTMENT, PRAYER_ORDER } from '@/constants/prayer';
import type {
  AsrMethod,
  CalculationMethodId,
  PrayerDay,
  PrayerLocation,
  PrayerName,
  PrayerSettings,
} from '@/types';
import { calculatePrayerDay, methodDetails } from '@/utils/prayer';

import {
  ALADHAN_REFERENCE,
  DEFAULT_TOLERANCE_MINUTES,
  type ReferenceCase,
} from './fixtures/aladhanReference';

/*
 * Prayer times are calculated, never looked up, so they are only worth
 * trusting if a second, unrelated implementation arrives at the same times.
 * The fixture holds timings read once from the AlAdhan API; these tests
 * compare against those frozen values and never reach the network.
 *
 * The library returns absolute instants, so the times of a day do not depend
 * on the zone the phone happens to be in. That is why each case names its
 * zone and the wall clock is read for that zone by name: the test then gives
 * the same answer on a phone or a machine standing anywhere in the world.
 */

const MINUTE = 60000;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = formatters.get(timeZone);
  if (cached !== undefined) return cached;
  const created = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  formatters.set(timeZone, created);
  return created;
}

interface WallClock {
  /** The calendar day in that place, as YYYY-MM-DD. */
  dayKey: string;
  /** The clock time in that place, as HH:mm. */
  time: string;
  minutesOfDay: number;
}

function wallClock(timestamp: number, timeZone: string): WallClock {
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of formatterFor(timeZone).formatToParts(new Date(timestamp))) {
    parts[part.type] = part.value;
  }
  const { year, month, day, hour, minute } = parts;
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    throw new Error(`The clock of ${timeZone} could not be read`);
  }
  return {
    dayKey: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
    minutesOfDay: Number(hour) * 60 + Number(minute),
  };
}

/** Minutes since local midnight of an HH:mm written in the fixture. */
function toMinutes(time: string): number {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function settingsFor(
  method: CalculationMethodId,
  asrMethod: AsrMethod,
  shifts: Partial<Record<PrayerName, number>> = {},
): PrayerSettings {
  const defaults = createDefaultPrayerSettings();
  const adjustments: Record<PrayerName, number> = { ...defaults.adjustments };
  for (const name of PRAYER_ORDER) adjustments[name] = shifts[name] ?? 0;
  return { ...defaults, method, asrMethod, adjustments };
}

function placeAt(latitude: number, longitude: number): PrayerLocation {
  return { source: 'coordinates', name: 'Reference place', latitude, longitude, updatedAt: 0 };
}

/** A calculated time, or a failure that names the prayer that is missing. */
function timeOf(day: PrayerDay, name: PrayerName): number {
  const time = day.times[name];
  if (time === null) throw new Error(`No ${name} time was calculated for ${day.dayKey}`);
  return time;
}

function dayFor(reference: ReferenceCase): PrayerDay {
  return calculatePrayerDay(
    settingsFor(reference.method, reference.asrMethod),
    placeAt(reference.latitude, reference.longitude),
    reference.dayKey,
  );
}

describe('prayer times against an independent implementation', () => {
  for (const reference of ALADHAN_REFERENCE) {
    it(`matches the reference in ${reference.place} on ${reference.dayKey}`, () => {
      const day = dayFor(reference);
      const differences: string[] = [];

      for (const name of PRAYER_ORDER) {
        const expected = reference.timings[name];
        const time = day.times[name];
        if (time === null) {
          differences.push(`${name}: nothing calculated, the reference says ${expected}`);
          continue;
        }
        const ours = wallClock(time, reference.timeZone);
        // A published method offset the reference does not apply is not a disagreement.
        const offset = reference.methodOffset?.[name] ?? 0;
        const apart = Math.abs(ours.minutesOfDay - offset - toMinutes(expected));
        const allowed = reference.tolerance?.[name] ?? DEFAULT_TOLERANCE_MINUTES;
        if (apart > allowed) {
          const shown = offset === 0 ? ours.time : `${ours.time} less ${offset} min`;
          differences.push(
            `${name}: ${shown} against ${expected}, ${apart} min apart (allowed ${allowed})`,
          );
        }
      }

      expect(differences).toEqual([]);
    });
  }

  it('covers enough places, methods and seasons to be worth trusting', () => {
    expect(ALADHAN_REFERENCE.length).toBeGreaterThanOrEqual(12);
    expect(new Set(ALADHAN_REFERENCE.map((one) => one.id)).size).toBe(ALADHAN_REFERENCE.length);
    expect(new Set(ALADHAN_REFERENCE.map((one) => one.method)).size).toBeGreaterThanOrEqual(8);
    expect(new Set(ALADHAN_REFERENCE.map((one) => one.timeZone)).size).toBeGreaterThanOrEqual(10);
    expect(ALADHAN_REFERENCE.some((one) => one.asrMethod === 'hanafi')).toBe(true);
    expect(ALADHAN_REFERENCE.some((one) => one.latitude < 0)).toBe(true);
    expect(ALADHAN_REFERENCE.some((one) => one.latitude > 55)).toBe(true);
    // A wider tolerance or a method offset is only allowed where the reason is written down.
    for (const one of ALADHAN_REFERENCE) {
      if (one.tolerance === undefined && one.methodOffset === undefined) continue;
      expect(one.note?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('puts every prayer on the calendar day that was asked for', () => {
    const wrongDay: string[] = [];
    for (const reference of ALADHAN_REFERENCE) {
      const day = dayFor(reference);
      for (const name of PRAYER_ORDER) {
        const ours = wallClock(timeOf(day, name), reference.timeZone);
        if (ours.dayKey !== reference.dayKey) {
          wrongDay.push(`${reference.id} ${name}: ${ours.dayKey} instead of ${reference.dayKey}`);
        }
      }
    }
    expect(wrongDay).toEqual([]);
  });

  it('runs from Fajr to Isha in order at every reference place', () => {
    // Every place here has a normal day and night; inside the polar circles the order can break.
    const broken: string[] = [];
    for (const reference of ALADHAN_REFERENCE) {
      const day = dayFor(reference);
      const stamps = PRAYER_ORDER.map((name) => timeOf(day, name));
      const rising = stamps.every((time, index) => index === 0 || time > (stamps[index - 1] ?? time));
      if (!rising) broken.push(reference.id);
    }
    expect(broken).toEqual([]);
  });
});

describe('manual adjustments', () => {
  const HYDERABAD = placeAt(17.384, 78.4564);
  const DAY_KEY = '2026-09-20';
  const SHIFTS: Record<PrayerName, number> = {
    fajr: 3,
    sunrise: -2,
    dhuhr: 5,
    asr: -10,
    maghrib: 1,
    isha: 12,
  };

  function hyderabad(shifts?: Partial<Record<PrayerName, number>>): PrayerDay {
    return calculatePrayerDay(settingsFor('Karachi', 'standard', shifts), HYDERABAD, DAY_KEY);
  }

  it('moves every prayer by exactly the chosen number of minutes', () => {
    const plain = hyderabad();
    const tuned = hyderabad(SHIFTS);
    for (const name of PRAYER_ORDER) {
      expect(timeOf(tuned, name) - timeOf(plain, name)).toBe(SHIFTS[name] * MINUTE);
    }
  });

  it('leaves the prayers that were not adjusted where they were', () => {
    const plain = hyderabad();
    const tuned = hyderabad({ asr: 7 });
    for (const name of PRAYER_ORDER) {
      if (name === 'asr') continue;
      expect(timeOf(tuned, name)).toBe(timeOf(plain, name));
    }
    expect(timeOf(tuned, 'asr') - timeOf(plain, 'asr')).toBe(7 * MINUTE);
  });

  it('works at both ends of the allowed range', () => {
    const plain = hyderabad();
    const tuned = hyderabad({ fajr: MIN_ADJUSTMENT, isha: MAX_ADJUSTMENT });
    expect(timeOf(tuned, 'fajr')).toBe(timeOf(plain, 'fajr') + MIN_ADJUSTMENT * MINUTE);
    expect(timeOf(tuned, 'isha')).toBe(timeOf(plain, 'isha') + MAX_ADJUSTMENT * MINUTE);
  });

  it('changes nothing when every adjustment is zero', () => {
    const plain = hyderabad();
    const zeroed = hyderabad({ fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });
    for (const name of PRAYER_ORDER) expect(timeOf(zeroed, name)).toBe(timeOf(plain, name));
  });
});

describe('the Asr method', () => {
  it('puts the Hanafi Asr after the standard one and still before Maghrib', () => {
    for (const reference of ALADHAN_REFERENCE) {
      const place = placeAt(reference.latitude, reference.longitude);
      const standard = calculatePrayerDay(
        settingsFor(reference.method, 'standard'),
        place,
        reference.dayKey,
      );
      const hanafi = calculatePrayerDay(
        settingsFor(reference.method, 'hanafi'),
        place,
        reference.dayKey,
      );
      expect(timeOf(hanafi, 'asr')).toBeGreaterThan(timeOf(standard, 'asr'));
      expect(timeOf(hanafi, 'asr')).toBeGreaterThan(timeOf(hanafi, 'dhuhr'));
      expect(timeOf(hanafi, 'asr')).toBeLessThan(timeOf(hanafi, 'maghrib'));
    }
  });

  it('touches nothing but Asr', () => {
    const place = placeAt(17.384, 78.4564);
    const standard = calculatePrayerDay(settingsFor('Karachi', 'standard'), place, '2026-09-20');
    const hanafi = calculatePrayerDay(settingsFor('Karachi', 'hanafi'), place, '2026-09-20');
    for (const name of PRAYER_ORDER) {
      if (name === 'asr') continue;
      expect(timeOf(hanafi, name)).toBe(timeOf(standard, name));
    }
  });
});

describe('calculation methods', () => {
  /** Places far enough apart that a difference in angles cannot be a local accident. */
  const PLACES: readonly { place: PrayerLocation; dayKey: string }[] = [
    { place: placeAt(40.7128, -74.006), dayKey: '2026-11-02' },
    { place: placeAt(17.384, 78.4564), dayKey: '2026-09-20' },
    { place: placeAt(-6.2088, 106.8456), dayKey: '2026-09-20' },
  ];

  it('reads different twilight angles for different methods', () => {
    const league = methodDetails('MuslimWorldLeague');
    const america = methodDetails('NorthAmerica');
    expect(america.fajrAngle).toBeLessThan(league.fajrAngle);
    expect(league.ishaAngle).not.toBeNull();
    expect(america.ishaAngle).not.toBeNull();
    expect(america.ishaAngle ?? 0).toBeLessThan(league.ishaAngle ?? 0);
  });

  it('gives a later Fajr and an earlier Isha with the narrower North American angles', () => {
    for (const { place, dayKey } of PLACES) {
      const league = calculatePrayerDay(settingsFor('MuslimWorldLeague', 'standard'), place, dayKey);
      const america = calculatePrayerDay(settingsFor('NorthAmerica', 'standard'), place, dayKey);
      // 15 degrees is reached later in the morning and earlier in the evening than 18 and 17.
      expect(timeOf(america, 'fajr')).toBeGreaterThan(timeOf(league, 'fajr'));
      expect(timeOf(america, 'isha')).toBeLessThan(timeOf(league, 'isha'));
      // Sunrise and Maghrib come from the horizon, so no twilight angle can move them.
      expect(timeOf(america, 'sunrise')).toBe(timeOf(league, 'sunrise'));
      expect(timeOf(america, 'maghrib')).toBe(timeOf(league, 'maghrib'));
    }
  });

  it('keeps Isha a fixed interval after Maghrib where the method asks for one', () => {
    const fixed: readonly { method: CalculationMethodId; place: PrayerLocation }[] = [
      { method: 'UmmAlQura', place: placeAt(21.4225, 39.8262) },
      { method: 'Qatar', place: placeAt(25.2854, 51.531) },
    ];
    for (const { method, place } of fixed) {
      const details = methodDetails(method);
      expect(details.ishaAngle).toBeNull();
      expect(details.ishaInterval).toBe(90);
      const day = calculatePrayerDay(settingsFor(method, 'standard'), place, '2026-09-20');
      expect(timeOf(day, 'isha') - timeOf(day, 'maghrib')).toBe(90 * MINUTE);
    }
  });
});
