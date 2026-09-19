const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** Local calendar day of a timestamp as YYYY-MM-DD. */
export function toDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isDayKey(value: string): boolean {
  return DAY_KEY_PATTERN.test(value);
}

/** Local midnight of a day key. */
export function dayKeyToDate(dayKey: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** Day key shifted by a number of calendar days. Safe across DST changes. */
export function shiftDayKey(dayKey: string, days: number): string {
  const date = dayKeyToDate(dayKey);
  date.setDate(date.getDate() + days);
  return toDayKey(date.getTime());
}

/** Day key of the first day of the week that contains the timestamp. */
export function startOfWeekKey(timestamp: number, weekStartsOn: number): string {
  const today = toDayKey(timestamp);
  const weekday = dayKeyToDate(today).getDay();
  const daysSinceStart = (weekday - weekStartsOn + 7) % 7;
  return shiftDayKey(today, -daysSinceStart);
}

export type RelativeDay = 'today' | 'yesterday' | 'other';

export function relativeDay(dayKey: string, now: number): RelativeDay {
  const today = toDayKey(now);
  if (dayKey === today) return 'today';
  if (dayKey === shiftDayKey(today, -1)) return 'yesterday';
  return 'other';
}

/** "Mon, 14 Sep 2026" style heading in the given locale. */
export function formatDayKey(dayKey: string, locale: string): string {
  const date = dayKeyToDate(dayKey);
  try {
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dayKey;
  }
}

/** "8:05 PM" style clock time of a timestamp in the given locale. */
export function formatClockTime(timestamp: number, locale: string): string {
  const date = new Date(timestamp);
  try {
    return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

export interface TwelveHourTime {
  /** 1-12 */
  hour12: number;
  minute: number;
  period: 'AM' | 'PM';
}

export function to12Hour(hour: number, minute: number): TwelveHourTime {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return { hour12, minute, period };
}

export function to24Hour(time: TwelveHourTime): { hour: number; minute: number } {
  const base = time.hour12 % 12;
  return { hour: time.period === 'PM' ? base + 12 : base, minute: time.minute };
}

/** "8:00 PM" for hour 20, minute 0. */
export function formatReminderTime(hour: number, minute: number): string {
  const time = to12Hour(hour, minute);
  return `${time.hour12}:${pad(time.minute)} ${time.period}`;
}
