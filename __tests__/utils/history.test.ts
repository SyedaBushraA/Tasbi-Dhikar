import { MAX_HISTORY_RECORDS } from '@/constants/defaults';
import type { SessionRecord } from '@/types';
import { addSession, groupHistoryByDay, removeSession } from '@/utils/history';

/** Local timestamp in September 2026, so day keys do not depend on the timezone. */
function at(day: number, hour = 10, minute = 0): number {
  return new Date(2026, 8, day, hour, minute).getTime();
}

function session(id: string, completedAt: number, count = 33): SessionRecord {
  return {
    id,
    dhikrId: 'subhanallah',
    dhikrName: 'SubhanAllah',
    count,
    target: count,
    completedAt,
  };
}

describe('addSession', () => {
  it('puts the new session first', () => {
    const older = session('older', at(14, 9));
    const newer = session('newer', at(14, 11));
    expect(addSession([older], newer)).toEqual([newer, older]);
  });

  it('adds to an empty history', () => {
    const only = session('only', at(14));
    expect(addSession([], only)).toEqual([only]);
  });

  it('does not change the given history', () => {
    const history = [session('older', at(14, 9))];
    addSession(history, session('newer', at(14, 11)));
    expect(history).toHaveLength(1);
  });

  it('drops the oldest session beyond the cap', () => {
    const full = Array.from({ length: MAX_HISTORY_RECORDS }, (_, index) =>
      session(`old-${index}`, at(1) - index * 60_000),
    );
    const newest = session('newest', at(2));
    const result = addSession(full, newest);

    expect(result).toHaveLength(MAX_HISTORY_RECORDS);
    expect(result[0]).toBe(newest);
    expect(result.some((record) => record.id === `old-${MAX_HISTORY_RECORDS - 1}`)).toBe(false);
    expect(result[result.length - 1]?.id).toBe(`old-${MAX_HISTORY_RECORDS - 2}`);
  });

  it('keeps a history one short of the cap whole', () => {
    const almostFull = Array.from({ length: MAX_HISTORY_RECORDS - 1 }, (_, index) =>
      session(`old-${index}`, at(1) - index * 60_000),
    );
    expect(addSession(almostFull, session('newest', at(2)))).toHaveLength(MAX_HISTORY_RECORDS);
  });
});

describe('removeSession', () => {
  const history = [session('c', at(14, 12)), session('b', at(14, 11)), session('a', at(14, 10))];

  it('removes the session with the id and keeps the order', () => {
    expect(removeSession(history, 'b').map((record) => record.id)).toEqual(['c', 'a']);
  });

  it('leaves the history unchanged for an unknown id', () => {
    expect(removeSession(history, 'missing')).toEqual(history);
  });

  it('does not change the given history', () => {
    removeSession(history, 'c');
    expect(history).toHaveLength(3);
  });

  it('handles an empty history', () => {
    expect(removeSession([], 'a')).toEqual([]);
  });
});

describe('groupHistoryByDay', () => {
  it('returns no sections for an empty history', () => {
    expect(groupHistoryByDay([])).toEqual([]);
  });

  it('groups sessions by local day, newest day first', () => {
    const history = [
      session('d15', at(15, 8), 10),
      session('d14-late', at(14, 22), 33),
      session('d14-early', at(14, 7), 99),
      session('d12', at(12, 12), 100),
    ];
    const sections = groupHistoryByDay(history);

    expect(sections.map((section) => section.dayKey)).toEqual([
      '2026-09-15',
      '2026-09-14',
      '2026-09-12',
    ]);
    expect(sections.map((section) => section.sessions.map((record) => record.id))).toEqual([
      ['d15'],
      ['d14-late', 'd14-early'],
      ['d12'],
    ]);
  });

  it('sums the counts of each day', () => {
    const sections = groupHistoryByDay([
      session('d14-late', at(14, 22), 33),
      session('d14-early', at(14, 7), 99),
      session('d12', at(12), 100),
    ]);
    expect(sections.map((section) => section.total)).toEqual([132, 100]);
  });

  it('sorts sessions newest first even when the input is out of order', () => {
    const sections = groupHistoryByDay([
      session('first', at(14, 7)),
      session('third', at(14, 12)),
      session('second', at(14, 9)),
    ]);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.sessions.map((record) => record.id)).toEqual(['third', 'second', 'first']);
  });

  it('splits sessions on either side of midnight into different days', () => {
    const sections = groupHistoryByDay([
      session('after', new Date(2026, 8, 15, 0, 0, 30).getTime()),
      session('before', new Date(2026, 8, 14, 23, 59, 30).getTime()),
    ]);
    expect(sections.map((section) => section.dayKey)).toEqual(['2026-09-15', '2026-09-14']);
  });

  it('does not change the given history', () => {
    const history = [session('first', at(14, 7)), session('second', at(14, 9))];
    groupHistoryByDay(history);
    expect(history.map((record) => record.id)).toEqual(['first', 'second']);
  });
});
