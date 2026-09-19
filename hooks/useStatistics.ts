import { useMemo } from 'react';

import { useAppSelector } from '@/state';
import type { HistorySection, StatsSummary } from '@/types';
import { dayKeyToDate } from '@/utils/date';
import { groupHistoryByDay } from '@/utils/history';
import { summarizeStats } from '@/utils/stats';

import { useToday } from './useToday';

/** Today's total, this week's total, all-time total, sessions and streak. */
export function useStatsSummary(): StatsSummary {
  const stats = useAppSelector((state) => state.stats);
  const today = useToday();
  return useMemo(() => {
    // Noon of the current day: safely inside the day whatever the clock change.
    const now = dayKeyToDate(today).getTime() + 12 * 60 * 60 * 1000;
    return summarizeStats(stats, now);
  }, [stats, today]);
}

/** Completed sessions grouped by day, newest first. */
export function useHistorySections(): HistorySection[] {
  const history = useAppSelector((state) => state.history);
  return useMemo(() => groupHistoryByDay(history), [history]);
}
