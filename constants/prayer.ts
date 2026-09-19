import type { AsrMethod, CalculationMethodId, PrayerName, SalahName } from '@/types';

export const PRAYER_ORDER: readonly PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const SALAH_ORDER: readonly SalahName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** The methods offered to the user, most widely used first. Their angles come from the library. */
export const CALCULATION_METHOD_IDS: readonly CalculationMethodId[] = [
  'MuslimWorldLeague',
  'Karachi',
  'UmmAlQura',
  'Egyptian',
  'NorthAmerica',
  'MoonsightingCommittee',
  'Dubai',
  'Qatar',
  'Kuwait',
  'Singapore',
  'Turkey',
  'Tehran',
];

export const DEFAULT_CALCULATION_METHOD: CalculationMethodId = 'MuslimWorldLeague';

/**
 * The method most commonly used by the authorities of a country. Only a
 * suggestion: the user always confirms it, because local mosques may differ.
 */
const METHOD_BY_COUNTRY: Readonly<Record<string, CalculationMethodId>> = {
  // South Asia: University of Islamic Sciences, Karachi
  PK: 'Karachi',
  IN: 'Karachi',
  BD: 'Karachi',
  AF: 'Karachi',
  NP: 'Karachi',
  LK: 'Karachi',
  // Arabian Peninsula
  SA: 'UmmAlQura',
  YE: 'UmmAlQura',
  AE: 'Dubai',
  QA: 'Qatar',
  KW: 'Kuwait',
  // Egyptian General Authority of Survey: Egypt and much of Africa and the Levant
  EG: 'Egyptian',
  SD: 'Egyptian',
  LY: 'Egyptian',
  SY: 'Egyptian',
  LB: 'Egyptian',
  IQ: 'Egyptian',
  JO: 'Egyptian',
  PS: 'Egyptian',
  // North America
  US: 'NorthAmerica',
  CA: 'NorthAmerica',
  // United Kingdom
  GB: 'MoonsightingCommittee',
  // South-East Asia
  SG: 'Singapore',
  MY: 'Singapore',
  ID: 'Singapore',
  BN: 'Singapore',
  // Others
  TR: 'Turkey',
  IR: 'Tehran',
};

/** Countries where the Hanafi Asr time is the most common choice. Also only a suggestion. */
const HANAFI_COUNTRIES: ReadonlySet<string> = new Set(['PK', 'IN', 'BD', 'AF', 'TR']);

export function suggestedMethod(countryCode: string | undefined): CalculationMethodId {
  return (countryCode && METHOD_BY_COUNTRY[countryCode.toUpperCase()]) || DEFAULT_CALCULATION_METHOD;
}

export function suggestedAsrMethod(countryCode: string | undefined): AsrMethod {
  return countryCode && HANAFI_COUNTRIES.has(countryCode.toUpperCase()) ? 'hanafi' : 'standard';
}

/** Manual adjustment range per prayer, in minutes. */
export const MIN_ADJUSTMENT = -60;
export const MAX_ADJUSTMENT = 60;

/**
 * Prayer notifications are scheduled this many days ahead and topped up
 * whenever the app is opened. iOS keeps at most 64 pending notifications per
 * app, one of which may be the daily Dhikr reminder.
 */
export const PRAYER_SCHEDULE_DAYS = 12;
export const MAX_PENDING_NOTIFICATIONS = 64;
export const RESERVED_NOTIFICATIONS = 1;

/** Identifiers of scheduled prayer notifications start with this. */
export const PRAYER_NOTIFICATION_PREFIX = 'prayer-';
