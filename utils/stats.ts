import { WEEK_STARTS_ON } from '@/constants/defaults';
import type { StatsData, StatsSummary } from '@/types';

import { shiftDayKey, startOfWeekKey, toDayKey } from './date';

/** Adds (or with a negative delta removes) counts for a day. Never goes below zero. */
export function addToDay(stats: StatsData, dayKey: string, delta: number): StatsData {
  const next = Math.max(0, (stats.daily[dayKey] ?? 0) + delta);
  const daily = { ...stats.daily };
  if (next === 0) {
    delete daily[dayKey];
  } else {
    daily[dayKey] = next;
  }
  return { ...stats, daily };
}

export function currentStreak(daily: Readonly<Record<string, number>>, now: number): number {
  const today = toDayKey(now);
  // A day that has not had its Dhikr yet does not break the streak.
  let cursor = (daily[today] ?? 0) > 0 ? today : shiftDayKey(today, -1);
  let streak = 0;
  while ((daily[cursor] ?? 0) > 0) {
    streak += 1;
    cursor = shiftDayKey(cursor, -1);
  }
  return streak;
}

export function summarizeStats(stats: StatsData, now: number): StatsSummary {
  const today = toDayKey(now);
  const weekStart = startOfWeekKey(now, WEEK_STARTS_ON);

  let total = 0;
  let thisWeek = 0;
  for (const [dayKey, count] of Object.entries(stats.daily)) {
    total += count;
    // Day keys are zero padded, so string comparison is chronological.
    if (dayKey >= weekStart && dayKey <= today) thisWeek += count;
  }

  return {
    today: stats.daily[today] ?? 0,
    thisWeek,
    total,
    completedSessions: stats.completedSessions,
    currentStreak: currentStreak(stats.daily, now),
  };
}
