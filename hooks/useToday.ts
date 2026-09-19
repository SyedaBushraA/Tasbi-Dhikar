import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { shiftDayKey, toDayKey, dayKeyToDate } from '@/utils/date';

/**
 * The current local day (YYYY-MM-DD). Changes at midnight and when the app
 * comes back to the foreground, so "Today" never shows yesterday's numbers.
 */
export function useToday(): string {
  const [today, setToday] = useState(() => toDayKey(Date.now()));

  useEffect(() => {
    const refresh = () => setToday(toDayKey(Date.now()));

    const nextMidnight = dayKeyToDate(shiftDayKey(today, 1)).getTime();
    const timer = setTimeout(refresh, Math.max(1000, nextMidnight - Date.now() + 1000));
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') refresh();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [today]);

  return today;
}
