import { useCallback } from 'react';

import { PRAYER_ORDER } from '@/constants/prayer';
import { type Translator, useTranslation } from '@/hooks/useTranslation';
import { useAppSelector } from '@/state';
import type { CalculationMethodId, PrayerName } from '@/types';
import { formatTimeOfDay, methodDetails } from '@/utils/prayer';

/* Wording shared by the prayer settings screens, so it reads the same everywhere. */

/** Formats a calculated time, or the dash for a time that does not exist that day. */
export function usePrayerTimeText(): (time: number | null) => string {
  const clockFormat = useAppSelector((state) => state.settings.clockFormat);
  const { t } = useTranslation();

  return useCallback(
    (time: number | null) =>
      time === null
        ? t('prayer.timeUnavailable')
        : formatTimeOfDay(time, clockFormat, { am: t('prayer.am'), pm: t('prayer.pm') }),
    [clockFormat, t],
  );
}

/** The country in the user's language, falling back to the code when it is not known. */
export function countryLabel(countryCode: string | undefined, locale: string): string | null {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    // Not every phone can name regions; the code still says which country is meant.
    return code;
  }
}

/** "Fajr 18°, Isha 17°" or "Fajr 18.5°, Isha 90 minutes after Maghrib". */
export function methodDetailsText(
  method: CalculationMethodId,
  t: Translator['t'],
  n: Translator['n'],
): string {
  const details = methodDetails(method);
  if (details.ishaAngle === null) {
    return t('prayerSettings.calculation.interval', {
      fajr: n(details.fajrAngle),
      minutes: n(details.ishaInterval ?? 0),
    });
  }
  return t('prayerSettings.calculation.angles', {
    fajr: n(details.fajrAngle),
    isha: n(details.ishaAngle),
  });
}

/** "+2" or "0" or "-3": the sign says at a glance which way the time moved. */
export function signedMinutes(minutes: number, n: Translator['n']): string {
  return minutes > 0 ? `+${n(minutes)}` : n(minutes);
}

/** "+2 min", as shown next to the stepper buttons. */
export function adjustmentValue(minutes: number, t: Translator['t'], n: Translator['n']): string {
  return t('prayerSettings.adjustments.value', { minutes: signedMinutes(minutes, n) });
}

/** The same value in words, for screen readers. */
export function adjustmentValueLabel(
  minutes: number,
  t: Translator['t'],
  tCount: Translator['tCount'],
): string {
  if (minutes === 0) return t('prayerSettings.adjustments.a11y.unchanged');
  const key = minutes > 0 ? 'minutesLater' : 'minutesEarlier';
  return tCount(`prayerSettings.adjustments.a11y.${key}`, Math.abs(minutes));
}

/** "None", or the times that were moved: "Fajr +2, Isha -3". */
export function adjustmentsSummary(
  adjustments: Record<PrayerName, number>,
  t: Translator['t'],
  n: Translator['n'],
): string {
  const moved = PRAYER_ORDER.filter((name) => adjustments[name] !== 0).map(
    (name) => `${t(`prayer.names.${name}`)} ${signedMinutes(adjustments[name], n)}`,
  );
  return moved.length === 0 ? t('prayerSettings.adjustments.none') : moved.join(', ');
}
