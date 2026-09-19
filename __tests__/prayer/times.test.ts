import { CALCULATION_METHOD_IDS, PRAYER_ORDER, SALAH_ORDER } from '@/constants/prayer';
import { translate } from '@/i18n';
import type { PrayerName } from '@/types';
import { shiftDayKey, toDayKey } from '@/utils/date';
import {
  calculatePrayerDay,
  countdownTo,
  findNextPrayer,
  formatCoordinate,
  formatTimeOfDay,
  isValidLatitude,
  isValidLongitude,
  methodDetails,
} from '@/utils/prayer';

import {
  HYDERABAD,
  LONGYEARBYEN,
  at,
  meridianPlace,
  prayerSettings,
  requireTime,
  wallClock,
} from '../helpers/prayer';

const MINUTE = 60_000;
const PERIODS = { am: 'AM', pm: 'PM' };

describe('methodDetails', () => {
  it('reports the twilight angles of an angle-based method', () => {
    expect(methodDetails('MuslimWorldLeague')).toEqual({
      fajrAngle: 18,
      ishaAngle: 17,
      ishaInterval: null,
    });
    expect(methodDetails('Karachi')).toEqual({ fajrAngle: 18, ishaAngle: 18, ishaInterval: null });
    expect(methodDetails('Egyptian')).toEqual({
      fajrAngle: 19.5,
      ishaAngle: 17.5,
      ishaInterval: null,
    });
    expect(methodDetails('NorthAmerica')).toEqual({
      fajrAngle: 15,
      ishaAngle: 15,
      ishaInterval: null,
    });
  });

  it('reports an interval instead of an angle where Isha follows Maghrib', () => {
    expect(methodDetails('UmmAlQura')).toEqual({
      fajrAngle: 18.5,
      ishaAngle: null,
      ishaInterval: 90,
    });
    expect(methodDetails('Qatar')).toEqual({ fajrAngle: 18, ishaAngle: null, ishaInterval: 90 });
  });

  it('gives every offered method exactly one way of finding Isha', () => {
    for (const method of CALCULATION_METHOD_IDS) {
      const details = methodDetails(method);
      expect(details.fajrAngle).toBeGreaterThan(0);
      expect(details.ishaAngle === null).not.toBe(details.ishaInterval === null);
    }
  });
});

describe('calculatePrayerDay', () => {
  const settings = prayerSettings({ location: HYDERABAD });

  it('returns a time for every prayer of the day, in the order they happen', () => {
    const day = calculatePrayerDay(settings, HYDERABAD, '2026-09-20');

    expect(day.dayKey).toBe('2026-09-20');
    expect(Object.keys(day.times).sort()).toEqual([...PRAYER_ORDER].sort());

    const times = PRAYER_ORDER.map((name) => requireTime(day, name));
    for (const time of times) expect(Number.isFinite(time)).toBe(true);
    for (let index = 1; index < times.length; index++) {
      expect(times[index] ?? 0).toBeGreaterThan(times[index - 1] ?? 0);
    }
  });

  it('places every time on that day in the time zone of the place', () => {
    const day = calculatePrayerDay(settings, HYDERABAD, '2026-09-20');
    for (const name of PRAYER_ORDER) {
      expect(wallClock(requireTime(day, name), 'Asia/Kolkata').day).toBe('2026-09-20');
    }
  });

  it('moves only the adjusted prayer, by exactly the chosen minutes', () => {
    const base = calculatePrayerDay(settings, HYDERABAD, '2026-09-20');
    const adjusted = calculatePrayerDay(
      prayerSettings({ location: HYDERABAD, adjustments: { fajr: 5, isha: -7 } }),
      HYDERABAD,
      '2026-09-20',
    );

    expect(requireTime(adjusted, 'fajr')).toBe(requireTime(base, 'fajr') + 5 * MINUTE);
    expect(requireTime(adjusted, 'isha')).toBe(requireTime(base, 'isha') - 7 * MINUTE);
    for (const name of ['sunrise', 'dhuhr', 'asr', 'maghrib'] as PrayerName[]) {
      expect(requireTime(adjusted, name)).toBe(requireTime(base, name));
    }
  });

  it('gives the Hanafi Asr later than the standard one and leaves the rest alone', () => {
    const standard = calculatePrayerDay(settings, HYDERABAD, '2026-09-20');
    const hanafi = calculatePrayerDay(
      prayerSettings({ location: HYDERABAD, asrMethod: 'hanafi' }),
      HYDERABAD,
      '2026-09-20',
    );

    expect(requireTime(hanafi, 'asr')).toBeGreaterThan(requireTime(standard, 'asr'));
    expect(requireTime(hanafi, 'dhuhr')).toBe(requireTime(standard, 'dhuhr'));
    expect(requireTime(hanafi, 'maghrib')).toBe(requireTime(standard, 'maghrib'));
  });

  it('changes with the calculation method', () => {
    const league = calculatePrayerDay(settings, HYDERABAD, '2026-09-20');
    const karachi = calculatePrayerDay(
      prayerSettings({ location: HYDERABAD, method: 'Karachi' }),
      HYDERABAD,
      '2026-09-20',
    );
    expect(requireTime(karachi, 'isha')).not.toBe(requireTime(league, 'isha'));
    expect(requireTime(karachi, 'maghrib')).toBe(requireTime(league, 'maghrib'));
  });

  it('answers inside the polar circle without throwing, in summer and in winter', () => {
    const polar = prayerSettings({ location: LONGYEARBYEN });

    for (const dayKey of ['2026-06-21', '2026-12-21']) {
      const day = calculatePrayerDay(polar, LONGYEARBYEN, dayKey);
      expect(day.dayKey).toBe(dayKey);
      expect(Object.keys(day.times).sort()).toEqual([...PRAYER_ORDER].sort());
      for (const name of PRAYER_ORDER) {
        const time = day.times[name];
        expect(time === null || Number.isFinite(time)).toBe(true);
      }
    }
  });
});

describe('findNextPrayer', () => {
  const dayKey = '2026-09-20';
  const nextDayKey = '2026-09-21';
  const place = meridianPlace(dayKey);
  const settings = prayerSettings({ location: place });
  const today = calculatePrayerDay(settings, place, dayKey);
  const tomorrow = calculatePrayerDay(settings, place, nextDayKey);

  it('finds the first prayer of the day before it starts', () => {
    const now = requireTime(today, 'fajr') - MINUTE;
    expect(findNextPrayer(settings, place, now)).toEqual({
      name: 'fajr',
      time: requireTime(today, 'fajr'),
      dayKey,
    });
  });

  it('finds Asr between Dhuhr and Asr', () => {
    const now = Math.round((requireTime(today, 'dhuhr') + requireTime(today, 'asr')) / 2);
    expect(findNextPrayer(settings, place, now)).toEqual({
      name: 'asr',
      time: requireTime(today, 'asr'),
      dayKey,
    });
  });

  it('moves on to the following prayer at the exact moment of a prayer', () => {
    expect(findNextPrayer(settings, place, requireTime(today, 'dhuhr'))).toEqual({
      name: 'asr',
      time: requireTime(today, 'asr'),
      dayKey,
    });
    expect(findNextPrayer(settings, place, requireTime(today, 'isha'))).toEqual({
      name: 'fajr',
      time: requireTime(tomorrow, 'fajr'),
      dayKey: nextDayKey,
    });
  });

  it('looks into tomorrow after Isha', () => {
    const now = requireTime(today, 'isha') + MINUTE;
    expect(findNextPrayer(settings, place, now)).toEqual({
      name: 'fajr',
      time: requireTime(tomorrow, 'fajr'),
      dayKey: nextDayKey,
    });
  });

  it('never offers sunrise, which is not a prayer', () => {
    const afterSunrise = requireTime(today, 'sunrise') + MINUTE;
    expect(findNextPrayer(settings, place, afterSunrise)).toEqual({
      name: 'dhuhr',
      time: requireTime(today, 'dhuhr'),
      dayKey,
    });

    const start = at(9, 20, 0, 0);
    for (let minutes = 0; minutes < 24 * 60; minutes += 15) {
      const next = findNextPrayer(settings, place, start + minutes * MINUTE);
      expect(next).not.toBeNull();
      if (!next) continue;
      expect(SALAH_ORDER).toContain(next.name);
      expect(next.time).toBeGreaterThan(start + minutes * MINUTE);
    }
  });

  it('crosses midnight without losing the next prayer', () => {
    const beforeMidnight = findNextPrayer(settings, place, at(9, 20, 23, 59));
    const afterMidnight = findNextPrayer(settings, place, at(9, 21, 0, 1));

    expect(beforeMidnight).toEqual({
      name: 'fajr',
      time: requireTime(tomorrow, 'fajr'),
      dayKey: nextDayKey,
    });
    expect(afterMidnight).toEqual(beforeMidnight);
  });

  it('gives the prayer its own day, not the day the app asked on', () => {
    const next = findNextPrayer(settings, place, requireTime(today, 'isha') + MINUTE);
    expect(next?.dayKey).toBe(shiftDayKey(toDayKey(requireTime(today, 'isha')), 1));
  });
});

describe('countdownTo', () => {
  const now = at(9, 20, 12);

  it('counts whole hours and minutes', () => {
    expect(countdownTo(now + 2 * 60 * MINUTE, now)).toEqual({ hours: 2, minutes: 0 });
    expect(countdownTo(now + 210 * MINUTE, now)).toEqual({ hours: 3, minutes: 30 });
    expect(countdownTo(now + 45 * MINUTE, now)).toEqual({ hours: 0, minutes: 45 });
    expect(countdownTo(now + 26 * 60 * MINUTE, now)).toEqual({ hours: 26, minutes: 0 });
  });

  it('rounds part minutes up, so a prayer that is still ahead never reads as now', () => {
    expect(countdownTo(now + 1, now)).toEqual({ hours: 0, minutes: 1 });
    expect(countdownTo(now + 90_000, now)).toEqual({ hours: 0, minutes: 2 });
    expect(countdownTo(now + MINUTE, now)).toEqual({ hours: 0, minutes: 1 });
    expect(countdownTo(now + MINUTE + 1, now)).toEqual({ hours: 0, minutes: 2 });
    expect(countdownTo(now + 60 * MINUTE + 1, now)).toEqual({ hours: 1, minutes: 1 });
  });

  it('is zero at and after the target', () => {
    expect(countdownTo(now, now)).toEqual({ hours: 0, minutes: 0 });
    expect(countdownTo(now - MINUTE, now)).toEqual({ hours: 0, minutes: 0 });
    expect(countdownTo(now - 5 * 60 * MINUTE, now)).toEqual({ hours: 0, minutes: 0 });
  });
});

describe('formatTimeOfDay', () => {
  it('writes a 12 hour clock with AM and PM', () => {
    expect(formatTimeOfDay(at(9, 20, 0, 5), '12h', PERIODS)).toBe('12:05 AM');
    expect(formatTimeOfDay(at(9, 20, 0, 0), '12h', PERIODS)).toBe('12:00 AM');
    expect(formatTimeOfDay(at(9, 20, 12, 0), '12h', PERIODS)).toBe('12:00 PM');
    expect(formatTimeOfDay(at(9, 20, 12, 30), '12h', PERIODS)).toBe('12:30 PM');
    expect(formatTimeOfDay(at(9, 20, 13, 5), '12h', PERIODS)).toBe('1:05 PM');
    expect(formatTimeOfDay(at(9, 20, 18, 28), '12h', PERIODS)).toBe('6:28 PM');
    expect(formatTimeOfDay(at(9, 20, 23, 59), '12h', PERIODS)).toBe('11:59 PM');
  });

  it('pads a 24 hour clock to two digits', () => {
    expect(formatTimeOfDay(at(9, 20, 0, 5), '24h', PERIODS)).toBe('00:05');
    expect(formatTimeOfDay(at(9, 20, 5, 7), '24h', PERIODS)).toBe('05:07');
    expect(formatTimeOfDay(at(9, 20, 12, 0), '24h', PERIODS)).toBe('12:00');
    expect(formatTimeOfDay(at(9, 20, 18, 28), '24h', PERIODS)).toBe('18:28');
    expect(formatTimeOfDay(at(9, 20, 23, 59), '24h', PERIODS)).toBe('23:59');
  });

  it('uses the labels it is given, so they can be translated', () => {
    const periods = { am: translate('en', 'prayer.am'), pm: translate('en', 'prayer.pm') };
    expect(formatTimeOfDay(at(9, 20, 18, 28), '12h', periods)).toBe('6:28 PM');
    expect(formatTimeOfDay(at(9, 20, 5, 7), '12h', { am: 'ص', pm: 'م' })).toBe('5:07 ص');
    expect(formatTimeOfDay(at(9, 20, 18, 28), '12h', { am: 'ص', pm: 'م' })).toBe('6:28 م');
  });
});

describe('formatCoordinate', () => {
  it('names the hemisphere instead of using a minus sign', () => {
    expect(formatCoordinate(17.384, 'latitude')).toBe('17.3840° N');
    expect(formatCoordinate(-17.384, 'latitude')).toBe('17.3840° S');
    expect(formatCoordinate(78.4564, 'longitude')).toBe('78.4564° E');
    expect(formatCoordinate(-74.006, 'longitude')).toBe('74.0060° W');
  });

  it('treats the equator and the prime meridian as north and east', () => {
    expect(formatCoordinate(0, 'latitude')).toBe('0.0000° N');
    expect(formatCoordinate(0, 'longitude')).toBe('0.0000° E');
  });

  it('shows at most four decimals', () => {
    expect(formatCoordinate(12.123456, 'latitude')).toBe('12.1235° N');
    expect(formatCoordinate(-9.5, 'longitude')).toBe('9.5000° W');
  });
});

describe('isValidLatitude and isValidLongitude', () => {
  it('accepts the poles and the date line', () => {
    expect(isValidLatitude(0)).toBe(true);
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(-90)).toBe(true);
    expect(isValidLongitude(0)).toBe(true);
    expect(isValidLongitude(180)).toBe(true);
    expect(isValidLongitude(-180)).toBe(true);
  });

  it('rejects anything past them', () => {
    expect(isValidLatitude(90.0001)).toBe(false);
    expect(isValidLatitude(-90.0001)).toBe(false);
    expect(isValidLatitude(180)).toBe(false);
    expect(isValidLongitude(180.0001)).toBe(false);
    expect(isValidLongitude(-180.0001)).toBe(false);
  });

  it('rejects numbers that are not numbers', () => {
    expect(isValidLatitude(Number.NaN)).toBe(false);
    expect(isValidLatitude(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidLongitude(Number.NaN)).toBe(false);
    expect(isValidLongitude(Number.NEGATIVE_INFINITY)).toBe(false);
  });
});
