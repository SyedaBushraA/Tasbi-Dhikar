export type ThemePreference = 'light' | 'dark' | 'system';

export type LanguageCode = 'en' | 'ar' | 'ur' | 'te' | 'hi';

export interface ReminderSettings {
  enabled: boolean;
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
}

export type ClockFormat = '12h' | '24h';

export interface Settings {
  theme: ThemePreference;
  language: LanguageCode;
  easyMode: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  defaultTarget: number;
  reminder: ReminderSettings;
  onboardingCompleted: boolean;
  /** How clock times are shown across the app, prayer times included. */
  clockFormat: ClockFormat;
}

/** Everything in the day that has a time, in the order it happens. */
export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

/** The five daily prayers. Sunrise marks the end of Fajr and is not a prayer. */
export type SalahName = Exclude<PrayerName, 'sunrise'>;

/** Calculation methods supported by the prayer-time library. */
export type CalculationMethodId =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'MoonsightingCommittee'
  | 'NorthAmerica'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'Tehran'
  | 'Turkey';

/** Standard: Shafi'i, Maliki and Hanbali (shadow length 1). Hanafi: shadow length 2, later Asr. */
export type AsrMethod = 'standard' | 'hanafi';

export type LocationSource = 'automatic' | 'city' | 'coordinates';

export interface PrayerLocation {
  source: LocationSource;
  /** City name, or a short label for coordinates entered by hand. */
  name: string;
  /** State or province, when known. */
  region?: string;
  /** ISO 3166-1 alpha-2, when known. Used to suggest a calculation method. */
  countryCode?: string;
  latitude: number;
  longitude: number;
  /** IANA time zone of the place, when known. */
  timeZone?: string;
  updatedAt: number;
}

export interface PrayerSettings {
  /** Where prayer times are calculated for. Null until the user chooses. */
  location: PrayerLocation | null;
  method: CalculationMethodId;
  /** The user has seen and accepted the method, instead of it being assumed. */
  methodConfirmed: boolean;
  asrMethod: AsrMethod;
  /** Minutes added to (or, when negative, taken from) each calculated time. */
  adjustments: Record<PrayerName, number>;
  /** A notification at the time of each prayer. */
  notifications: Record<SalahName, boolean>;
  /** Master switch for the Adhan sound on prayer notifications. */
  adhanEnabled: boolean;
  /** Which prayers use the Adhan instead of the normal notification sound. */
  adhan: Record<SalahName, boolean>;
  /** Use the separate Fajr recording for Fajr, when one is included. */
  fajrAdhanSeparate: boolean;
  /** 0-1. Volume of the Adhan when the app itself plays it (test, or at prayer time while open). */
  adhanVolume: number;
}

/** Calculated times of one day as timestamps. Null when a time does not exist at that place and date. */
export interface PrayerDay {
  dayKey: string;
  times: Record<PrayerName, number | null>;
}

export interface NextPrayer {
  name: SalahName;
  time: number;
  /** The day the prayer belongs to (tomorrow for Fajr after Isha). */
  dayKey: string;
}

/** A Dhikr the user created themselves. */
export interface CustomDhikr {
  id: string;
  name: string;
  target: number;
  createdAt: number;
}

/** A Dhikr as shown in the app, either built in or custom. */
export interface Dhikr {
  id: string;
  name: string;
  /** Arabic script, only available for built-in Dhikr. */
  arabic?: string;
  /** Own target. Built-in Dhikr use the default target from Settings instead. */
  target?: number;
  isCustom: boolean;
}

export interface CounterState {
  dhikrId: string;
  target: number;
  count: number;
  paused: boolean;
  /** Time of the first count of the current round. */
  startedAt: number | null;
  /** Time of the most recent count of the current round. */
  lastTapAt: number | null;
  /** Set once the target is reached and the round was saved to history. */
  completedSessionId: string | null;
}

/** One completed round, as stored in history. */
export interface SessionRecord {
  id: string;
  dhikrId: string;
  /** Name at the time of completion, so history survives deleting a custom Dhikr. */
  dhikrName: string;
  count: number;
  target: number;
  completedAt: number;
}

export interface StatsData {
  /** Number of Dhikr counted per local day, keyed by YYYY-MM-DD. */
  daily: Record<string, number>;
  completedSessions: number;
}

/** Everything the app keeps in memory and persists locally. */
export interface AppState {
  settings: Settings;
  customDhikr: CustomDhikr[];
  counter: CounterState;
  stats: StatsData;
  history: SessionRecord[];
  prayer: PrayerSettings;
}

export interface StatsSummary {
  today: number;
  thisWeek: number;
  total: number;
  completedSessions: number;
  /** Consecutive days with at least one Dhikr, counting back from today. */
  currentStreak: number;
}

export interface HistorySection {
  dayKey: string;
  /** Sum of the counts of all sessions of that day. */
  total: number;
  sessions: SessionRecord[];
}
