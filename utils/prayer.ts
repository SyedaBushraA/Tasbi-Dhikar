import {
  CalculationMethod,
  type CalculationParameters,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PolarCircleResolution,
  PrayerTimes,
} from 'adhan';

import { PRAYER_ORDER, SALAH_ORDER } from '@/constants/prayer';
import type {
  CalculationMethodId,
  ClockFormat,
  NextPrayer,
  PrayerDay,
  PrayerLocation,
  PrayerName,
  PrayerSettings,
} from '@/types';

import { dayKeyToDate, shiftDayKey, toDayKey } from './date';

/*
 * Prayer times are calculated on the phone with adhan (Batoul Apps), an
 * established open-source implementation of the standard astronomical
 * methods. Nothing here is hard-coded per city and nothing needs a network.
 */

export interface MethodDetails {
  fajrAngle: number;
  /** Null when Isha is a fixed number of minutes after Maghrib. */
  ishaAngle: number | null;
  ishaInterval: number | null;
}

/** Twilight angles of a method, as defined by the library, for display. */
export function methodDetails(method: CalculationMethodId): MethodDetails {
  const params = CalculationMethod[method]();
  return {
    fajrAngle: params.fajrAngle,
    ishaAngle: params.ishaInterval > 0 ? null : params.ishaAngle,
    ishaInterval: params.ishaInterval > 0 ? params.ishaInterval : null,
  };
}

function parametersFor(settings: PrayerSettings, coordinates: Coordinates): CalculationParameters {
  const params = CalculationMethod[settings.method]();
  params.madhab = settings.asrMethod === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  // Far north and south, twilight can last all night; use the rule recommended for the latitude.
  params.highLatitudeRule = HighLatitudeRule.recommended(coordinates);
  // Inside the polar circles the sun may not rise or set; borrow the nearest day that has times.
  params.polarCircleResolution = PolarCircleResolution.AqrabYaum;
  params.adjustments = { ...settings.adjustments };
  return params;
}

function validTime(date: Date): number | null {
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
}

/**
 * Prayer times of one local calendar day at a place.
 * @param dayKey the day as YYYY-MM-DD in the phone's time zone.
 */
export function calculatePrayerDay(
  settings: PrayerSettings,
  location: Pick<PrayerLocation, 'latitude' | 'longitude'>,
  dayKey: string,
): PrayerDay {
  const coordinates = new Coordinates(location.latitude, location.longitude);
  // The library reads the calendar day from the local date parts.
  const prayerTimes = new PrayerTimes(coordinates, dayKeyToDate(dayKey), parametersFor(settings, coordinates));

  const times = {} as Record<PrayerName, number | null>;
  for (const name of PRAYER_ORDER) times[name] = validTime(prayerTimes[name]);
  return { dayKey, times };
}

/**
 * The soonest of the five prayers that is still ahead of `now`, looking into
 * tomorrow after Isha. Null only if no time can be calculated at all.
 */
export function findNextPrayer(
  settings: PrayerSettings,
  location: Pick<PrayerLocation, 'latitude' | 'longitude'>,
  now: number,
): NextPrayer | null {
  const today = toDayKey(now);
  let next: NextPrayer | null = null;
  // The scan starts a day early: when the phone's time zone runs ahead of the
  // place's, the place is still on yesterday's key and its remaining prayers
  // would otherwise be skipped. Past times are filtered out below anyway.
  // Two days cover every case; a third guards against a polar day without Fajr.
  for (let offset = -1; offset <= 2; offset++) {
    const day = calculatePrayerDay(settings, location, shiftDayKey(today, offset));
    for (const name of SALAH_ORDER) {
      const time = day.times[name];
      if (time === null || time <= now) continue;
      // The earliest wins rather than the first in the list: inside the polar
      // circles the borrowed times are not always in the usual order.
      if (next === null || time < next.time) next = { name, time, dayKey: day.dayKey };
    }
  }
  return next;
}

export interface Countdown {
  hours: number;
  minutes: number;
}

/**
 * Time left until `target`, rounded up to whole minutes so "in 0 minutes"
 * never shows while the prayer is still ahead.
 */
export function countdownTo(target: number, now: number): Countdown {
  const totalMinutes = Math.max(0, Math.ceil((target - now) / 60000));
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/**
 * "6:28 PM" or "18:28" in the phone's time zone.
 * @param periods translated AM and PM labels.
 */
export function formatTimeOfDay(
  timestamp: number,
  clockFormat: ClockFormat,
  periods: { am: string; pm: string },
): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = pad(date.getMinutes());
  if (clockFormat === '24h') return `${pad(hours)}:${minutes}`;
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${hours < 12 ? periods.am : periods.pm}`;
}

/** Three decimals is about 100 m: far more precise than prayer times need. */
const COORDINATE_DECIMALS = 3;

/** Keeps a stored coordinate no more precise than the prayer calculation needs. */
export function roundCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_DECIMALS;
  return Math.round(value * factor) / factor;
}

/** Degrees with at most 4 decimals and a hemisphere letter, e.g. "17.3840° N". */
export function formatCoordinate(value: number, axis: 'latitude' | 'longitude'): string {
  const hemisphere =
    axis === 'latitude' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  return `${Math.abs(value).toFixed(4)}° ${hemisphere}`;
}

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}
