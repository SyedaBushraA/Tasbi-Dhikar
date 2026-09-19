import {
  MAX_PENDING_NOTIFICATIONS,
  PRAYER_NOTIFICATION_PREFIX,
  PRAYER_SCHEDULE_DAYS,
  RESERVED_NOTIFICATIONS,
  SALAH_ORDER,
} from '@/constants/prayer';
import type { SalahName } from '@/types';
import { shiftDayKey } from '@/utils/date';
import { calculatePrayerDay } from '@/utils/prayer';
import {
  type AdhanSoundAvailability,
  type PlanOptions,
  type PlannedPrayerAlert,
  adhanChoiceFor,
  diffPrayerAlerts,
  planPrayerAlerts,
} from '@/utils/prayerSchedule';

import { at, meridianPlace, prayerSettings, requireTime } from '../helpers/prayer';

const MINUTE = 60_000;
const DAY_KEY = '2026-09-20';
const PLACE = meridianPlace(DAY_KEY);
/** Before the first prayer of the day, so a whole day is still ahead. */
const NOW = at(9, 20, 1);

const MAX_ALERTS = MAX_PENDING_NOTIFICATIONS - RESERVED_NOTIFICATIONS;
const NO_SOUNDS: AdhanSoundAvailability = { standard: false, fajr: false };
const STANDARD_ONLY: AdhanSoundAvailability = { standard: true, fajr: false };
const BOTH_SOUNDS: AdhanSoundAvailability = { standard: true, fajr: true };

function allOn(): Record<SalahName, boolean> {
  return { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };
}

function options(patch: Partial<PlanOptions> = {}): PlanOptions {
  return {
    days: PRAYER_SCHEDULE_DAYS,
    maxAlerts: MAX_ALERTS,
    sounds: NO_SOUNDS,
    clockFormat: '12h',
    language: 'en',
    ...patch,
  };
}

const enabled = prayerSettings({ location: PLACE, notifications: allOn() });

describe('planPrayerAlerts', () => {
  it('plans nothing without a place', () => {
    expect(planPrayerAlerts(prayerSettings({ notifications: allOn() }), NOW, options())).toEqual([]);
  });

  it('plans nothing while every prayer notification is off', () => {
    expect(planPrayerAlerts(prayerSettings({ location: PLACE }), NOW, options())).toEqual([]);
  });

  it('covers every enabled prayer of every planned day', () => {
    const plan = planPrayerAlerts(enabled, NOW, options());
    expect(plan).toHaveLength(PRAYER_SCHEDULE_DAYS * SALAH_ORDER.length);

    const days = [...new Set(plan.map((alert) => alert.dayKey))];
    expect(days).toHaveLength(PRAYER_SCHEDULE_DAYS);
    expect(days[0]).toBe(DAY_KEY);
    expect(days[days.length - 1]).toBe(shiftDayKey(DAY_KEY, PRAYER_SCHEDULE_DAYS - 1));
  });

  it('leaves out the prayers the user did not ask for', () => {
    const plan = planPrayerAlerts(
      prayerSettings({ location: PLACE, notifications: { fajr: true, isha: true } }),
      NOW,
      options(),
    );
    expect(plan).toHaveLength(PRAYER_SCHEDULE_DAYS * 2);
    expect([...new Set(plan.map((alert) => alert.prayer))].sort()).toEqual(['fajr', 'isha']);
  });

  it('keeps the alerts in the order they will arrive', () => {
    const plan = planPrayerAlerts(enabled, NOW, options());
    for (let index = 1; index < plan.length; index++) {
      expect(plan[index]?.time ?? 0).toBeGreaterThan(plan[index - 1]?.time ?? 0);
    }
  });

  it('uses the final time, after the manual adjustment', () => {
    const adjusted = prayerSettings({
      location: PLACE,
      notifications: allOn(),
      adjustments: { fajr: 4 },
    });
    const day = calculatePrayerDay(adjusted, PLACE, DAY_KEY);
    const plan = planPrayerAlerts(adjusted, NOW, options());

    expect(plan[0]).toMatchObject({ prayer: 'fajr', dayKey: DAY_KEY, time: requireTime(day, 'fajr') });
  });

  it('skips a prayer that is past or less than half a minute away', () => {
    const day = calculatePrayerDay(enabled, PLACE, DAY_KEY);
    const fajr = requireTime(day, 'fajr');

    const tooClose = planPrayerAlerts(enabled, fajr - 29_000, options());
    expect(tooClose.some((alert) => alert.time === fajr)).toBe(false);
    expect(tooClose[0]?.prayer).toBe('dhuhr');

    const past = planPrayerAlerts(enabled, fajr + MINUTE, options());
    expect(past.some((alert) => alert.time === fajr)).toBe(false);

    const justInTime = planPrayerAlerts(enabled, fajr - 30_000, options());
    expect(justInTime[0]).toMatchObject({ prayer: 'fajr', dayKey: DAY_KEY, time: fajr });
  });

  it('never plans further ahead than it was asked to', () => {
    expect(planPrayerAlerts(enabled, NOW, options({ days: 3 }))).toHaveLength(
      3 * SALAH_ORDER.length,
    );
    expect(planPrayerAlerts(enabled, NOW, options({ days: 1 }))).toHaveLength(SALAH_ORDER.length);
  });

  it('never plans more alerts than the phone will hold', () => {
    expect(MAX_ALERTS).toBe(63);

    const plan = planPrayerAlerts(enabled, NOW, options({ days: 30 }));
    expect(plan).toHaveLength(MAX_ALERTS);

    const few = planPrayerAlerts(enabled, NOW, options({ maxAlerts: 7 }));
    expect(few).toHaveLength(7);
    expect(few.map((alert) => alert.identifier)).toEqual(
      plan.slice(0, 7).map((alert) => alert.identifier),
    );
  });

  it('gives every alert its own identifier', () => {
    const plan = planPrayerAlerts(enabled, NOW, options());
    const identifiers = plan.map((alert) => alert.identifier);

    expect(new Set(identifiers).size).toBe(identifiers.length);
    for (const identifier of identifiers) {
      expect(identifier.startsWith(PRAYER_NOTIFICATION_PREFIX)).toBe(true);
    }
  });

  it('gives the same identifier again while nothing changed', () => {
    const first = planPrayerAlerts(enabled, NOW, options());
    const second = planPrayerAlerts(enabled, NOW, options());
    expect(second.map((alert) => alert.identifier)).toEqual(first.map((alert) => alert.identifier));
  });

  it('gives a new identifier when the time, the sound or the wording changes', () => {
    const base = planPrayerAlerts(enabled, NOW, options())[0]?.identifier;
    expect(base).toBeDefined();

    const shifted = planPrayerAlerts(
      prayerSettings({ location: PLACE, notifications: allOn(), adjustments: { fajr: 3 } }),
      NOW,
      options(),
    )[0]?.identifier;
    const withAdhan = planPrayerAlerts(
      prayerSettings({ location: PLACE, notifications: allOn(), adhanEnabled: true }),
      NOW,
      options({ sounds: BOTH_SOUNDS }),
    )[0]?.identifier;
    const other24h = planPrayerAlerts(enabled, NOW, options({ clockFormat: '24h' }))[0]?.identifier;
    const otherLanguage = planPrayerAlerts(enabled, NOW, options({ language: 'ur' }))[0]?.identifier;

    expect(new Set([base, shifted, withAdhan, other24h, otherLanguage]).size).toBe(5);
  });

  it('records which recording each alert will play', () => {
    const plan = planPrayerAlerts(
      prayerSettings({ location: PLACE, notifications: allOn(), adhanEnabled: true }),
      NOW,
      options({ sounds: BOTH_SOUNDS }),
    );
    const firstDay = plan.slice(0, SALAH_ORDER.length);

    expect(firstDay.find((alert) => alert.prayer === 'fajr')?.adhan).toBe('fajr');
    expect(firstDay.find((alert) => alert.prayer === 'asr')?.adhan).toBe('standard');
  });

  it('plans a plain notification while the Adhan is off', () => {
    const plan = planPrayerAlerts(enabled, NOW, options({ sounds: BOTH_SOUNDS }));
    expect(plan.every((alert) => alert.adhan === null)).toBe(true);
  });
});

describe('adhanChoiceFor', () => {
  const on = prayerSettings({ adhanEnabled: true });

  it('is silent while the Adhan is switched off altogether', () => {
    const off = prayerSettings({ adhanEnabled: false });
    for (const prayer of SALAH_ORDER) {
      expect(adhanChoiceFor(prayer, off, BOTH_SOUNDS)).toBeNull();
    }
  });

  it('is silent for a prayer whose own Adhan is off', () => {
    const settings = prayerSettings({ adhanEnabled: true, adhan: { asr: false } });
    expect(adhanChoiceFor('asr', settings, BOTH_SOUNDS)).toBeNull();
    expect(adhanChoiceFor('dhuhr', settings, BOTH_SOUNDS)).toBe('standard');
  });

  it('uses the separate Fajr recording only when there is one', () => {
    const separate = prayerSettings({ adhanEnabled: true, fajrAdhanSeparate: true });
    expect(adhanChoiceFor('fajr', separate, BOTH_SOUNDS)).toBe('fajr');
    expect(adhanChoiceFor('fajr', separate, STANDARD_ONLY)).toBe('standard');
    expect(adhanChoiceFor('fajr', separate, { standard: false, fajr: true })).toBe('fajr');
  });

  it('uses the usual recording for Fajr when the user asked for one Adhan', () => {
    const shared = prayerSettings({ adhanEnabled: true, fajrAdhanSeparate: false });
    expect(adhanChoiceFor('fajr', shared, BOTH_SOUNDS)).toBe('standard');
  });

  it('falls back to the normal notification sound when nothing is bundled', () => {
    for (const prayer of SALAH_ORDER) {
      expect(adhanChoiceFor(prayer, on, NO_SOUNDS)).toBeNull();
    }
  });
});

describe('diffPrayerAlerts', () => {
  const plan = planPrayerAlerts(enabled, NOW, options({ days: 2 }));
  const identifiers = plan.map((alert) => alert.identifier);

  it('schedules everything when nothing is scheduled yet', () => {
    expect(diffPrayerAlerts([], plan)).toEqual({ cancel: [], schedule: plan });
  });

  it('does nothing when the scheduled alerts already match', () => {
    expect(diffPrayerAlerts(identifiers, plan)).toEqual({ cancel: [], schedule: [] });
  });

  it('leaves notifications that are not prayer times alone', () => {
    const changes = diffPrayerAlerts(['daily-dhikr-reminder', ...identifiers], plan);
    expect(changes).toEqual({ cancel: [], schedule: [] });

    expect(diffPrayerAlerts(['daily-dhikr-reminder'], []).cancel).toEqual([]);
  });

  it('cancels what no longer applies and adds what is missing', () => {
    const stale = `${PRAYER_NOTIFICATION_PREFIX}2026-09-01-fajr-1-plain-12hen`;
    const kept = identifiers.slice(0, 3);
    const changes = diffPrayerAlerts([stale, 'daily-dhikr-reminder', ...kept], plan);

    expect(changes.cancel).toEqual([stale]);
    expect(changes.schedule.map((alert: PlannedPrayerAlert) => alert.identifier)).toEqual(
      identifiers.slice(3),
    );
  });

  it('cancels everything when the plan is empty', () => {
    expect(diffPrayerAlerts(identifiers, [])).toEqual({ cancel: identifiers, schedule: [] });
  });
});
