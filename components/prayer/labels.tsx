import type { Translator } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n';
import type {
  AsrMethod,
  CalculationMethodId,
  ClockFormat,
  PrayerLocation,
  PrayerName,
} from '@/types';
import { countdownTo, formatTimeOfDay } from '@/utils/prayer';

/** Below a minute the countdown says "less than a minute" instead of "1 min". */
const MINUTE = 60000;

export function prayerNameKey(name: PrayerName): TranslationKey {
  return `prayer.names.${name}`;
}

export function methodKey(method: CalculationMethodId): TranslationKey {
  return `prayer.methods.${method}`;
}

export function asrMethodKey(asrMethod: AsrMethod): TranslationKey {
  return `prayer.asrMethods.${asrMethod}`;
}

/** A prayer time, or the placeholder when the time does not exist that day. */
export function formatPrayerTime(
  time: number | null,
  clockFormat: ClockFormat,
  t: Translator['t'],
): string {
  if (time === null) return t('prayer.timeUnavailable');
  return formatTimeOfDay(time, clockFormat, { am: t('prayer.am'), pm: t('prayer.pm') });
}

/** Short countdown for the screen, for example "In 1 h 24 min". */
export function countdownLabel(target: number, now: number, translator: Translator): string {
  const { t, n } = translator;
  if (target - now < MINUTE) return t('prayer.countdown.lessThanMinute');

  const { hours, minutes } = countdownTo(target, now);
  if (hours > 0 && minutes > 0) {
    return t('prayer.countdown.hoursMinutes', { hours: n(hours), minutes: n(minutes) });
  }
  if (hours > 0) return t('prayer.countdown.hours', { hours: n(hours) });
  return t('prayer.countdown.minutes', { minutes: n(minutes) });
}

/** The same countdown in full words, for screen readers: "in 1 hour 24 minutes". */
export function spokenCountdown(target: number, now: number, translator: Translator): string {
  const { t, tCount } = translator;
  if (target - now < MINUTE) return t('prayer.a11y.lessThanMinute');

  const { hours, minutes } = countdownTo(target, now);
  const parts: string[] = [];
  if (hours > 0) parts.push(tCount('prayer.a11y.hoursUnit', hours));
  if (minutes > 0 || hours === 0) parts.push(tCount('prayer.a11y.minutesUnit', minutes));
  return t('prayer.a11y.inTime', { duration: parts.join(' ') });
}

/** The country in the language of the app. Not every phone can name regions. */
function countryName(countryCode: string, locale: string): string {
  const code = countryCode.toUpperCase();
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The place with its region and country, as far as they are known. */
export function locationLabel(location: PrayerLocation, locale: string): string {
  const region = location.region === location.name ? undefined : location.region;
  const country = location.countryCode ? countryName(location.countryCode, locale) : undefined;
  return [location.name, region, country]
    .filter((part): part is string => part !== undefined && part.length > 0)
    .join(', ');
}
