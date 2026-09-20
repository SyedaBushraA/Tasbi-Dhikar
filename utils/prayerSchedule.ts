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

/**
 * An alert this close is no longer added: the phone would deliver it late, or
 * not at all. One that is already pending is left alone instead, so opening
 * the app moments before a prayer never removes the notification that is about
 * to arrive.
 */
export const MIN_ALERT_LEAD_MS = 30 * 1000;

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
 * The prayer notifications that should be pending from `now` on: every enabled
 * prayer of the next `days` days that is still ahead, earliest first, at most
 * `maxAlerts`. Whether an alert is close enough to be worth adding is decided
 * in diffPrayerAlerts, so a prayer that is seconds away still counts as
 * planned and its pending notification survives.
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

  // Starts a day early for the same reason as findNextPrayer: a phone whose
  // time zone runs ahead of the place is already on the next day key while
  // prayers of the place's current day are still to come. Past times are
  // filtered out below, so an aligned phone plans exactly `days` days.
  for (let offset = -1; offset < options.days; offset++) {
    const day = calculatePrayerDay(settings, location, shiftDayKey(today, offset));
    for (const name of enabled) {
      const time = day.times[name];
      if (time === null || time <= now) continue;
      const adhan = adhanChoiceFor(name, settings, options.sounds);
      plan.push({
        identifier: `${PRAYER_NOTIFICATION_PREFIX}${day.dayKey}-${name}-${time}-${adhan ?? 'plain'}-${wording}`,
        prayer: name,
        dayKey: day.dayKey,
        time,
        adhan,
      });
    }
  }
  // Inside the polar circles a day's prayers are not always in the usual
  // order, so the nearest alerts are kept, not the first five of each day.
  plan.sort((first, second) => first.time - second.time);
  return plan.slice(0, options.maxAlerts);
}

export interface AlertChanges {
  cancel: string[];
  schedule: PlannedPrayerAlert[];
}

/** The time an alert identifier carries, or null when it was not written here. */
function alertTimeOf(identifier: string): number | null {
  const match = /^\d{4}-\d{2}-\d{2}-[a-z]+-(\d+)-/.exec(
    identifier.slice(PRAYER_NOTIFICATION_PREFIX.length),
  );
  if (!match) return null;
  const time = Number(match[1]);
  return Number.isFinite(time) ? time : null;
}

/** What to cancel and what to add so the scheduled prayer alerts match the plan. */
export function diffPrayerAlerts(
  scheduledIdentifiers: readonly string[],
  plan: readonly PlannedPrayerAlert[],
  now: number,
): AlertChanges {
  const wanted = new Set(plan.map((alert) => alert.identifier));
  const existing = new Set(
    scheduledIdentifiers.filter((id) => id.startsWith(PRAYER_NOTIFICATION_PREFIX)),
  );
  const deadline = now + MIN_ALERT_LEAD_MS;

  return {
    cancel: [...existing].filter((id) => {
      if (wanted.has(id)) return false;
      // An alert that is seconds away is left pending whatever the new plan
      // says: cancelling it would silence the prayer that is arriving now.
      const time = alertTimeOf(id);
      return time === null || time <= now || time >= deadline;
    }),
    schedule: plan.filter((alert) => !existing.has(alert.identifier) && alert.time >= deadline),
  };
}
