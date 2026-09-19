import { PRAYER_ORDER } from '@/constants/prayer';
import type { PrayerLocation } from '@/types';
import { shiftDayKey } from '@/utils/date';
import { calculatePrayerDay } from '@/utils/prayer';

import { LONDON, NEW_YORK, prayerSettings, requireTime, wallClock } from '../helpers/prayer';

/*
 * Prayer times are calculated from the calendar day and the coordinates, so
 * the timestamps they return are the same wherever the tests run. The clock
 * change is therefore checked where it is visible: on the clock of the place
 * itself, read through its own time zone, on the four 2026 switch dates.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

interface Switch {
  place: PrayerLocation;
  timeZone: string;
  /** The day before the clocks change. */
  before: string;
  /** The day the clocks change. */
  after: string;
  /** Minutes the local clock moves: forward in spring, back in autumn. */
  shift: number;
}

const SWITCHES: readonly Switch[] = [
  {
    place: NEW_YORK,
    timeZone: 'America/New_York',
    before: '2026-03-07',
    after: '2026-03-08',
    shift: 60,
  },
  {
    place: NEW_YORK,
    timeZone: 'America/New_York',
    before: '2026-10-31',
    after: '2026-11-01',
    shift: -60,
  },
  {
    place: LONDON,
    timeZone: 'Europe/London',
    before: '2026-03-28',
    after: '2026-03-29',
    shift: 60,
  },
  {
    place: LONDON,
    timeZone: 'Europe/London',
    before: '2026-10-24',
    after: '2026-10-25',
    shift: -60,
  },
];

describe.each(SWITCHES)('$place.name around $after', ({ place, timeZone, before, after, shift }) => {
  const settings = prayerSettings({ location: place });
  const dayBefore = calculatePrayerDay(settings, place, before);
  const dayAfter = calculatePrayerDay(settings, place, after);

  it('keeps every prayer of the switch day in order', () => {
    const times = PRAYER_ORDER.map((name) => requireTime(dayAfter, name));
    for (let index = 1; index < times.length; index++) {
      expect(times[index] ?? 0).toBeGreaterThan(times[index - 1] ?? 0);
    }
  });

  it('keeps every prayer of the switch day on that day', () => {
    for (const name of PRAYER_ORDER) {
      expect(wallClock(requireTime(dayAfter, name), timeZone).day).toBe(after);
    }
  });

  it('moves the local clock by an hour while the sun barely moves', () => {
    const noonBefore = requireTime(dayBefore, 'dhuhr');
    const noonAfter = requireTime(dayAfter, 'dhuhr');

    const clockShift =
      wallClock(noonAfter, timeZone).minutes - wallClock(noonBefore, timeZone).minutes;
    expect(clockShift).toBeGreaterThan(shift - 5);
    expect(clockShift).toBeLessThan(shift + 5);

    expect(Math.abs(noonAfter - noonBefore - 24 * HOUR)).toBeLessThan(10 * MINUTE);
  });

  it('keeps a day between the two Fajr times', () => {
    const gap = requireTime(dayAfter, 'fajr') - requireTime(dayBefore, 'fajr');
    expect(Math.abs(gap - 24 * HOUR)).toBeLessThan(30 * MINUTE);
  });

  it('counts the switch day as one calendar day', () => {
    expect(shiftDayKey(before, 1)).toBe(after);
    expect(shiftDayKey(after, -1)).toBe(before);
  });
});
