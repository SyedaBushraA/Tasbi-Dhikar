import { PRAYER_NOTIFICATION_PREFIX, SALAH_ORDER } from '@/constants/prayer';
import type { ClockFormat, LanguageCode, PrayerSettings, SalahName } from '@/types';

import { shiftDayKey, toDayKey } from './date';
import { calculatePrayerDay } from './prayer';

/** Which recording a notification plays; null for the normal notification sound. */
export type AdhanChoice = 'standard' | 'fajr' | null;

export interface AdhanSoundAvailability {
  standard: boolean;
  fajr: boolean;
}

export interface PlannedPrayerAlert {
  /** Unique per day, prayer, time, sound and wording, so any change leads to a new one. */
  identifier: string;
  prayer: SalahName;
  dayKey: string;
  /** Final time, after manual adjustments. */
  time: number;
  adhan: AdhanChoice;
}

export interface PlanOptions {
  days: number;
  maxAlerts: number;
  sounds: AdhanSoundAvailability;
  clockFormat: ClockFormat;
  language: LanguageCode;
}

/** Alerts closer than this are not scheduled any more: they would arrive late or not at all. */
const MIN_LEAD_MS = 30 * 1000;

export function adhanChoiceFor(
  prayer: SalahName,
  settings: PrayerSettings,
  sounds: AdhanSoundAvailability,
): AdhanChoice {
  if (!settings.adhanEnabled || !settings.adhan[prayer]) return null;
  if (prayer === 'fajr' && settings.fajrAdhanSeparate && sounds.fajr) return 'fajr';
  return sounds.standard ? 'standard' : null;
}

/**
 * The prayer notifications that should be scheduled from `now` on: every
 * enabled prayer of the next `days` days, earliest first, at most `maxAlerts`.
 */
export function planPrayerAlerts(
  settings: PrayerSettings,
  now: number,
  options: PlanOptions,
): PlannedPrayerAlert[] {
  const { location } = settings;
  if (!location) return [];
  const enabled = SALAH_ORDER.filter((name) => settings.notifications[name]);
  if (enabled.length === 0) return [];

  const wording = `${options.clockFormat}${options.language}`;
  const today = toDayKey(now);
  const plan: PlannedPrayerAlert[] = [];

  for (let offset = 0; offset < options.days && plan.length < options.maxAlerts; offset++) {
    const day = calculatePrayerDay(settings, location, shiftDayKey(today, offset));
    for (const name of enabled) {
      const time = day.times[name];
      if (time === null || time < now + MIN_LEAD_MS) continue;
      const adhan = adhanChoiceFor(name, settings, options.sounds);
      plan.push({
        identifier: `${PRAYER_NOTIFICATION_PREFIX}${day.dayKey}-${name}-${time}-${adhan ?? 'plain'}-${wording}`,
        prayer: name,
        dayKey: day.dayKey,
        time,
        adhan,
      });
      if (plan.length >= options.maxAlerts) break;
    }
  }
  return plan;
}

export interface AlertChanges {
  cancel: string[];
  schedule: PlannedPrayerAlert[];
}

/** What to cancel and what to add so the scheduled prayer alerts match the plan. */
export function diffPrayerAlerts(
  scheduledIdentifiers: readonly string[],
  plan: readonly PlannedPrayerAlert[],
): AlertChanges {
  const wanted = new Set(plan.map((alert) => alert.identifier));
  const existing = new Set(
    scheduledIdentifiers.filter((id) => id.startsWith(PRAYER_NOTIFICATION_PREFIX)),
  );
  return {
    cancel: [...existing].filter((id) => !wanted.has(id)),
    schedule: plan.filter((alert) => !existing.has(alert.identifier)),
  };
}
