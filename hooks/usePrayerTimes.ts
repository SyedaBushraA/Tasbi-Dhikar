import { useMemo } from 'react';

import { useAppSelector } from '@/state';
import type { NextPrayer, PrayerDay, PrayerLocation } from '@/types';
import { calculatePrayerDay, findNextPrayer } from '@/utils/prayer';

import { useNow } from './useNow';
import { useToday } from './useToday';

export interface PrayerTimesView {
  /** Null until the user has chosen a place. */
  location: PrayerLocation | null;
  /** Times of the current local day, null while there is no place. */
  today: PrayerDay | null;
  next: NextPrayer | null;
  /** The time the times were compared against, refreshed every minute. */
  now: number;
}

/**
 * Today's prayer times and the next prayer for the chosen place. Everything is
 * calculated on the phone and only recalculated when the settings, the day or
 * the minute change.
 */
export function usePrayerTimes(): PrayerTimesView {
  const settings = useAppSelector((state) => state.prayer);
  const today = useToday();
  const now = useNow();
  const { location } = settings;

  const day = useMemo(
    () => (location ? calculatePrayerDay(settings, location, today) : null),
    [settings, location, today],
  );

  const next = useMemo(
    () => (location ? findNextPrayer(settings, location, now) : null),
    [settings, location, now],
  );

  return useMemo(() => ({ location, today: day, next, now }), [location, day, next, now]);
}
