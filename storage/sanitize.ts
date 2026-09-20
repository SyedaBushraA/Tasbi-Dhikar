import {
  DEFAULT_COUNTER,
  DEFAULT_SETTINGS,
  MAX_HISTORY_RECORDS,
  createDefaultPrayerSettings,
  createDefaultStats,
} from '@/constants/defaults';
import { DEFAULT_DHIKR_ID, MAX_CUSTOM_DHIKR, MAX_DHIKR_NAME_LENGTH } from '@/constants/dhikr';
import {
  CALCULATION_METHOD_IDS,
  MAX_ADJUSTMENT,
  MIN_ADJUSTMENT,
  PRAYER_ORDER,
  SALAH_ORDER,
} from '@/constants/prayer';
import { SUPPORTED_LANGUAGES } from '@/i18n/languages';
import type {
  AppState,
  ClockFormat,
  CounterState,
  CustomDhikr,
  LanguageCode,
  LocationSource,
  PrayerLocation,
  PrayerName,
  PrayerSettings,
  ReminderSettings,
  SalahName,
  SessionRecord,
  Settings,
  StatsData,
  ThemePreference,
} from '@/types';
import { isDayKey } from '@/utils/date';
import { findDhikr } from '@/utils/dhikr';
import { isValidLatitude, isValidLongitude } from '@/utils/prayer';
import { isValidTarget, normalizeDhikrName } from '@/utils/validation';

/*
 * Everything read from storage is untrusted: it may be missing, written by an
 * older version, or damaged. Each function here turns an unknown value into
 * valid data, keeping what is usable and replacing the rest with defaults.
 */

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asIntInRange(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;
}

function asTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

const THEMES: readonly ThemePreference[] = ['light', 'dark', 'system'];
const CLOCK_FORMATS: readonly ClockFormat[] = ['12h', '24h'];
const LOCATION_SOURCES: readonly LocationSource[] = ['automatic', 'city', 'coordinates'];

function sanitizeReminder(raw: unknown): ReminderSettings {
  const fallback = DEFAULT_SETTINGS.reminder;
  if (!isRecord(raw)) return { ...fallback };
  return {
    enabled: asBoolean(raw.enabled, fallback.enabled),
    hour: asIntInRange(raw.hour, 0, 23, fallback.hour),
    minute: asIntInRange(raw.minute, 0, 59, fallback.minute),
  };
}

export function sanitizeSettings(raw: unknown): Settings {
  const fallback = DEFAULT_SETTINGS;
  if (!isRecord(raw)) return { ...fallback, reminder: { ...fallback.reminder } };

  const theme = THEMES.find((option) => option === raw.theme) ?? fallback.theme;
  const language: LanguageCode =
    SUPPORTED_LANGUAGES.find((option) => option.code === raw.language)?.code ?? fallback.language;

  return {
    theme,
    language,
    easyMode: asBoolean(raw.easyMode, fallback.easyMode),
    hapticsEnabled: asBoolean(raw.hapticsEnabled, fallback.hapticsEnabled),
    soundEnabled: asBoolean(raw.soundEnabled, fallback.soundEnabled),
    defaultTarget: isValidTarget(raw.defaultTarget) ? raw.defaultTarget : fallback.defaultTarget,
    reminder: sanitizeReminder(raw.reminder),
    onboardingCompleted: asBoolean(raw.onboardingCompleted, fallback.onboardingCompleted),
    clockFormat: CLOCK_FORMATS.find((option) => option === raw.clockFormat) ?? fallback.clockFormat,
  };
}

function sanitizeLocation(raw: unknown): PrayerLocation | null {
  if (!isRecord(raw)) return null;
  const { latitude, longitude } = raw;
  const source = LOCATION_SOURCES.find((option) => option === raw.source);
  const name = asNonEmptyString(raw.name);
  if (typeof latitude !== 'number' || !isValidLatitude(latitude)) return null;
  if (typeof longitude !== 'number' || !isValidLongitude(longitude)) return null;
  if (!source || !name) return null;

  const region = asNonEmptyString(raw.region);
  const countryCode =
    typeof raw.countryCode === 'string' && /^[A-Za-z]{2}$/.test(raw.countryCode)
      ? raw.countryCode.toUpperCase()
      : null;
  const timeZone = asNonEmptyString(raw.timeZone);
  return {
    source,
    name: name.slice(0, 80),
    ...(region ? { region: region.slice(0, 80) } : {}),
    ...(countryCode ? { countryCode } : {}),
    latitude,
    longitude,
    ...(timeZone ? { timeZone } : {}),
    updatedAt: asTimestamp(raw.updatedAt) ?? 0,
  };
}

function sanitizePerSalah(raw: unknown, fallback: Record<SalahName, boolean>): Record<SalahName, boolean> {
  const source = isRecord(raw) ? raw : {};
  const result = { ...fallback };
  for (const name of SALAH_ORDER) result[name] = asBoolean(source[name], fallback[name]);
  return result;
}

export function sanitizePrayerSettings(raw: unknown): PrayerSettings {
  const fallback = createDefaultPrayerSettings();
  if (!isRecord(raw)) return fallback;

  const adjustmentsSource = isRecord(raw.adjustments) ? raw.adjustments : {};
  const adjustments = { ...fallback.adjustments };
  for (const name of PRAYER_ORDER) {
    adjustments[name as PrayerName] = asIntInRange(
      adjustmentsSource[name],
      MIN_ADJUSTMENT,
      MAX_ADJUSTMENT,
      0,
    );
  }

  const volume =
    typeof raw.adhanVolume === 'number' && raw.adhanVolume >= 0 && raw.adhanVolume <= 1
      ? raw.adhanVolume
      : fallback.adhanVolume;

  return {
    location: sanitizeLocation(raw.location),
    method: CALCULATION_METHOD_IDS.find((id) => id === raw.method) ?? fallback.method,
    methodConfirmed: asBoolean(raw.methodConfirmed, fallback.methodConfirmed),
    asrMethod: raw.asrMethod === 'hanafi' ? 'hanafi' : 'standard',
    adjustments,
    notifications: sanitizePerSalah(raw.notifications, fallback.notifications),
    adhanEnabled: asBoolean(raw.adhanEnabled, fallback.adhanEnabled),
    adhan: sanitizePerSalah(raw.adhan, fallback.adhan),
    fajrAdhanSeparate: asBoolean(raw.fajrAdhanSeparate, fallback.fajrAdhanSeparate),
    adhanVolume: volume,
  };
}

export function sanitizeCustomDhikr(raw: unknown): CustomDhikr[] {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set<string>();
  const result: CustomDhikr[] = [];

  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = asNonEmptyString(item.id);
    const name = typeof item.name === 'string' ? normalizeDhikrName(item.name) : '';
    if (!id || seenIds.has(id) || name.length === 0 || !isValidTarget(item.target)) continue;

    seenIds.add(id);
    result.push({
      id,
      name: name.slice(0, MAX_DHIKR_NAME_LENGTH),
      target: item.target,
      createdAt: asTimestamp(item.createdAt) ?? 0,
    });
    if (result.length >= MAX_CUSTOM_DHIKR) break;
  }
  return result;
}

export function sanitizeCounter(raw: unknown): CounterState {
  if (!isRecord(raw)) return { ...DEFAULT_COUNTER };

  const target = isValidTarget(raw.target) ? raw.target : DEFAULT_COUNTER.target;
  const count = asIntInRange(raw.count, 0, target, 0);
  const completedSessionId = count >= target ? asNonEmptyString(raw.completedSessionId) : null;

  return {
    dhikrId: asNonEmptyString(raw.dhikrId) ?? DEFAULT_DHIKR_ID,
    target,
    count,
    paused: asBoolean(raw.paused, false),
    startedAt: count > 0 ? asTimestamp(raw.startedAt) : null,
    lastTapAt: count > 0 ? asTimestamp(raw.lastTapAt) : null,
    completedSessionId,
  };
}

export function sanitizeStats(raw: unknown): StatsData {
  if (!isRecord(raw)) return createDefaultStats();

  const daily: Record<string, number> = {};
  if (isRecord(raw.daily)) {
    for (const [dayKey, value] of Object.entries(raw.daily)) {
      if (!isDayKey(dayKey)) continue;
      const count = asIntInRange(value, 1, Number.MAX_SAFE_INTEGER, 0);
      if (count > 0) daily[dayKey] = count;
    }
  }
  return {
    daily,
    completedSessions: asIntInRange(raw.completedSessions, 0, Number.MAX_SAFE_INTEGER, 0),
  };
}

export function sanitizeHistory(raw: unknown): SessionRecord[] {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set<string>();
  const result: SessionRecord[] = [];

  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = asNonEmptyString(item.id);
    const dhikrName = asNonEmptyString(item.dhikrName);
    const completedAt = asTimestamp(item.completedAt);
    if (!id || seenIds.has(id) || !dhikrName || completedAt === null) continue;
    if (!isValidTarget(item.target) || !isValidTarget(item.count)) continue;

    seenIds.add(id);
    result.push({
      id,
      dhikrId: asNonEmptyString(item.dhikrId) ?? '',
      dhikrName,
      count: item.count,
      target: item.target,
      completedAt,
    });
  }

  result.sort((a, b) => b.completedAt - a.completedAt);
  return result.slice(0, MAX_HISTORY_RECORDS);
}

/** Sanitizes every slice and then repairs references between them. */
export function sanitizeAppState(raw: Partial<Record<keyof AppState, unknown>>): AppState {
  const settings = sanitizeSettings(raw.settings);
  const customDhikr = sanitizeCustomDhikr(raw.customDhikr);
  const history = sanitizeHistory(raw.history);
  const stats = sanitizeStats(raw.stats);
  let counter = sanitizeCounter(raw.counter);

  const dhikr = findDhikr(counter.dhikrId, customDhikr);
  if (!dhikr) {
    // The selected Dhikr no longer exists: go back to a clean default round.
    counter = { ...DEFAULT_COUNTER, target: settings.defaultTarget };
  } else if (
    counter.completedSessionId !== null &&
    !history.some((record) => record.id === counter.completedSessionId)
  ) {
    // A finished round whose history entry is gone can only be restarted.
    counter = { ...counter, count: 0, startedAt: null, lastTapAt: null, completedSessionId: null };
  } else if (counter.completedSessionId === null && counter.count >= counter.target) {
    // Count reached the target but the completion was never recorded.
    counter = { ...counter, count: Math.max(0, counter.target - 1) };
  }

  return { settings, customDhikr, counter, stats, history, prayer: sanitizePrayerSettings(raw.prayer) };
}
