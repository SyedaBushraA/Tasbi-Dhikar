import { MAX_HISTORY_RECORDS } from '@/constants/defaults';
import type { HistorySection, SessionRecord } from '@/types';

import { toDayKey } from './date';

/** Adds a session at the front (newest first) and drops the oldest beyond the cap. */
export function addSession(
  history: readonly SessionRecord[],
  record: SessionRecord,
): SessionRecord[] {
  return [record, ...history].slice(0, MAX_HISTORY_RECORDS);
}

export function removeSession(history: readonly SessionRecord[], id: string): SessionRecord[] {
  return history.filter((record) => record.id !== id);
}

/** Groups sessions by local day, newest day and newest session first. */
export function groupHistoryByDay(history: readonly SessionRecord[]): HistorySection[] {
  const sorted = [...history].sort((a, b) => b.completedAt - a.completedAt);
  const sections: HistorySection[] = [];
  for (const record of sorted) {
    const dayKey = toDayKey(record.completedAt);
    const last = sections[sections.length - 1];
    if (last && last.dayKey === dayKey) {
      last.sessions.push(record);
      last.total += record.count;
    } else {
      sections.push({ dayKey, total: record.count, sessions: [record] });
    }
  }
  return sections;
}
