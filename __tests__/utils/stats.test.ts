import { WEEK_STARTS_ON } from '@/constants/defaults';
import type { StatsData } from '@/types';
import { addToDay, currentStreak, summarizeStats } from '@/utils/stats';

/** Local timestamp in September 2026, so day keys do not depend on the timezone. */
function at(day: number, hour = 10, minute = 0): number {
  return new Date(2026, 8, day, hour, minute).getTime();
}

function stats(daily: Record<string, number>, completedSessions = 0): StatsData {
  return { daily, completedSessions };
}

describe('addToDay', () => {
  it('starts a new day', () => {
    expect(addToDay(stats({}), '2026-09-14', 1)).toEqual(stats({ '2026-09-14': 1 }));
  });

  it('adds to an existing day', () => {
    expect(addToDay(stats({ '2026-09-14': 5 }), '2026-09-14', 3)).toEqual(
      stats({ '2026-09-14': 8 }),
    );
  });

  it('keeps other days and the session count', () => {
    const before = stats({ '2026-09-13': 2 }, 4);
    expect(addToDay(before, '2026-09-14', 1)).toEqual(
      stats({ '2026-09-13': 2, '2026-09-14': 1 }, 4),
    );
  });

  it('takes counts away with a negative delta', () => {
    expect(addToDay(stats({ '2026-09-14': 5 }), '2026-09-14', -2)).toEqual(
      stats({ '2026-09-14': 3 }),
    );
  });

  it('removes a day that reaches zero', () => {
    const result = addToDay(stats({ '2026-09-14': 1, '2026-09-13': 2 }), '2026-09-14', -1);
    expect(result.daily).toEqual({ '2026-09-13': 2 });
    expect('2026-09-14' in result.daily).toBe(false);
  });

  it('never goes below zero', () => {
    expect(addToDay(stats({ '2026-09-14': 1 }), '2026-09-14', -5).daily).toEqual({});
    expect(addToDay(stats({}), '2026-09-14', -1).daily).toEqual({});
  });

  it('does not change the given stats', () => {
    const before = stats({ '2026-09-14': 1 });
    addToDay(before, '2026-09-14', 1);
    addToDay(before, '2026-09-14', -1);
    expect(before.daily).toEqual({ '2026-09-14': 1 });
  });
});

describe('currentStreak', () => {
  const today = at(14);

  it('is 0 without any counts', () => {
    expect(currentStreak({}, today)).toBe(0);
  });

  it('counts today', () => {
    expect(currentStreak({ '2026-09-14': 1 }, today)).toBe(1);
  });

  it('counts consecutive days back from today', () => {
    const daily = { '2026-09-14': 3, '2026-09-13': 1, '2026-09-12': 5 };
    expect(currentStreak(daily, today)).toBe(3);
  });

  it('does not break when today has no counts yet', () => {
    const daily = { '2026-09-13': 1, '2026-09-12': 1 };
    expect(currentStreak(daily, today)).toBe(2);
  });

  it('stops at the first day without counts', () => {
    expect(currentStreak({ '2026-09-14': 1, '2026-09-12': 1 }, today)).toBe(1);
    expect(currentStreak({ '2026-09-12': 1, '2026-09-11': 1 }, today)).toBe(0);
  });

  it('treats a zero entry as a missing day', () => {
    expect(currentStreak({ '2026-09-14': 0, '2026-09-13': 1 }, today)).toBe(1);
    expect(currentStreak({ '2026-09-14': 1, '2026-09-13': 0, '2026-09-12': 1 }, today)).toBe(1);
  });

  it('ignores days after today', () => {
    expect(currentStreak({ '2026-09-15': 1, '2026-09-14': 1 }, today)).toBe(1);
  });

  it('continues across month and year ends', () => {
    const daily = { '2027-01-02': 1, '2027-01-01': 1, '2026-12-31': 1, '2026-12-30': 1 };
    expect(currentStreak(daily, new Date(2027, 0, 2, 9, 0).getTime())).toBe(4);
  });
});

describe('summarizeStats', () => {
  it('is all zero without any counts', () => {
    expect(summarizeStats(stats({}), at(14))).toEqual({
      today: 0,
      thisWeek: 0,
      total: 0,
      completedSessions: 0,
      currentStreak: 0,
    });
  });

  it('weeks start on Monday', () => {
    expect(WEEK_STARTS_ON).toBe(1);
  });

  it('separates today, this week and the total', () => {
    // 12 Sep 2026 is a Saturday, 14 Sep a Monday and 16 Sep a Wednesday.
    const daily = {
      '2026-09-12': 5,
      '2026-09-14': 10,
      '2026-09-15': 20,
      '2026-09-16': 30,
    };
    expect(summarizeStats(stats(daily, 7), at(16))).toEqual({
      today: 30,
      thisWeek: 60,
      total: 65,
      completedSessions: 7,
      currentStreak: 3,
    });
  });

  it('does not count days after today towards this week', () => {
    const daily = { '2026-09-16': 30, '2026-09-17': 100 };
    const summary = summarizeStats(stats(daily), at(16));
    expect(summary.thisWeek).toBe(30);
    expect(summary.total).toBe(130);
  });

  it('starts the week fresh on Monday', () => {
    const daily = { '2026-09-13': 5, '2026-09-14': 10 };
    const summary = summarizeStats(stats(daily), at(14));
    expect(summary.today).toBe(10);
    expect(summary.thisWeek).toBe(10);
    expect(summary.total).toBe(15);
  });

  it('includes the whole week on Sunday', () => {
    const daily = { '2026-09-13': 1, '2026-09-14': 2, '2026-09-17': 4, '2026-09-20': 3 };
    const summary = summarizeStats(stats(daily), new Date(2026, 8, 20, 23, 59).getTime());
    expect(summary.thisWeek).toBe(9);
    expect(summary.total).toBe(10);
  });

  it('reports the current streak', () => {
    const daily = { '2026-09-13': 1, '2026-09-14': 2 };
    expect(summarizeStats(stats(daily), at(15)).currentStreak).toBe(2);
  });
});
