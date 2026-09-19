import { DEFAULT_DHIKR_ID } from '@/constants/dhikr';
import { MAX_ADJUSTMENT, MIN_ADJUSTMENT } from '@/constants/prayer';
import type {
  AppState,
  CounterState,
  CustomDhikr,
  PrayerName,
  PrayerSettings,
  SalahName,
  SessionRecord,
  Settings,
} from '@/types';
import { canCount, canUndo, newRound, targetChangeRestartsRound } from '@/utils/counter';
import { toDayKey } from '@/utils/date';
import { findDhikr, resolveDhikr } from '@/utils/dhikr';
import { addSession, removeSession } from '@/utils/history';
import { addToDay } from '@/utils/stats';

export type AppAction =
  | { type: 'hydrate'; state: AppState }
  | { type: 'tap'; now: number; sessionId: string }
  | { type: 'undo'; now: number }
  | { type: 'reset' }
  | { type: 'setPaused'; paused: boolean }
  | { type: 'startNewRound' }
  | { type: 'selectDhikr'; dhikrId: string }
  | { type: 'setTarget'; target: number }
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'addCustomDhikr'; dhikr: CustomDhikr }
  | { type: 'updateCustomDhikr'; id: string; name: string; target: number }
  | { type: 'deleteCustomDhikr'; id: string }
  | { type: 'clearHistory' }
  | { type: 'updatePrayer'; patch: PrayerSettingsPatch };

/** A change to the prayer settings. Nested per-prayer values can be changed one at a time. */
export type PrayerSettingsPatch = Partial<
  Omit<PrayerSettings, 'adjustments' | 'notifications' | 'adhan'>
> & {
  adjustments?: Partial<Record<PrayerName, number>>;
  notifications?: Partial<Record<SalahName, boolean>>;
  adhan?: Partial<Record<SalahName, boolean>>;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function updatePrayer(prayer: PrayerSettings, patch: PrayerSettingsPatch): PrayerSettings {
  const adjustments = { ...prayer.adjustments };
  for (const [name, minutes] of Object.entries(patch.adjustments ?? {}) as [PrayerName, number][]) {
    if (Number.isFinite(minutes)) {
      adjustments[name] = clamp(Math.round(minutes), MIN_ADJUSTMENT, MAX_ADJUSTMENT);
    }
  }
  const adhanVolume =
    patch.adhanVolume !== undefined && Number.isFinite(patch.adhanVolume)
      ? clamp(patch.adhanVolume, 0, 1)
      : prayer.adhanVolume;

  return {
    ...prayer,
    ...patch,
    adjustments,
    notifications: { ...prayer.notifications, ...patch.notifications },
    adhan: { ...prayer.adhan, ...patch.adhan },
    adhanVolume,
  };
}

function roundFor(dhikrId: string, target: number): CounterState {
  return {
    dhikrId,
    target,
    count: 0,
    paused: false,
    startedAt: null,
    lastTapAt: null,
    completedSessionId: null,
  };
}

/** Applies a target to the running round, restarting it if the count is already past it. */
function withTarget(counter: CounterState, target: number): CounterState {
  if (counter.target === target) return counter;
  return targetChangeRestartsRound(counter, target)
    ? roundFor(counter.dhikrId, target)
    : { ...counter, target };
}

function tap(state: AppState, now: number, sessionId: string): AppState {
  const { counter } = state;
  if (!canCount(counter)) return state;

  const count = counter.count + 1;
  const stats = addToDay(state.stats, toDayKey(now), 1);
  const progressed: CounterState = {
    ...counter,
    count,
    startedAt: counter.startedAt ?? now,
    lastTapAt: now,
  };

  if (count < counter.target) return { ...state, counter: progressed, stats };

  const record: SessionRecord = {
    id: sessionId,
    dhikrId: counter.dhikrId,
    dhikrName: resolveDhikr(counter.dhikrId, state.customDhikr).name,
    count,
    target: counter.target,
    completedAt: now,
  };
  return {
    ...state,
    counter: { ...progressed, completedSessionId: sessionId },
    stats: { ...stats, completedSessions: stats.completedSessions + 1 },
    history: addSession(state.history, record),
  };
}

function undo(state: AppState, now: number): AppState {
  const { counter } = state;
  if (!canUndo(counter)) return state;

  // Take the count back from the day it was added to.
  let stats = addToDay(state.stats, toDayKey(counter.lastTapAt ?? now), -1);
  let history = state.history;

  if (counter.completedSessionId !== null) {
    // Undoing the final count also takes the saved session back.
    history = removeSession(history, counter.completedSessionId);
    stats = { ...stats, completedSessions: Math.max(0, stats.completedSessions - 1) };
  }

  const count = counter.count - 1;
  return {
    ...state,
    counter: {
      ...counter,
      count,
      startedAt: count === 0 ? null : counter.startedAt,
      lastTapAt: count === 0 ? null : counter.lastTapAt,
      completedSessionId: null,
    },
    stats,
    history,
  };
}

function updateSettings(state: AppState, patch: Partial<Settings>): AppState {
  const settings: Settings = {
    ...state.settings,
    ...patch,
    reminder: { ...state.settings.reminder, ...patch.reminder },
  };

  // A new default target applies right away to a built-in Dhikr that has not been started.
  const dhikr = findDhikr(state.counter.dhikrId, state.customDhikr);
  const followsDefault = dhikr !== undefined && !dhikr.isCustom && state.counter.count === 0;
  const counter =
    followsDefault && state.counter.target !== settings.defaultTarget
      ? { ...state.counter, target: settings.defaultTarget }
      : state.counter;

  return { ...state, settings, counter };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'tap':
      return tap(state, action.now, action.sessionId);

    case 'undo':
      return undo(state, action.now);

    case 'reset':
    case 'startNewRound':
      if (state.counter.count === 0 && !state.counter.paused) return state;
      return { ...state, counter: newRound(state.counter) };

    case 'setPaused':
      if (state.counter.paused === action.paused) return state;
      return { ...state, counter: { ...state.counter, paused: action.paused } };

    case 'selectDhikr': {
      if (action.dhikrId === state.counter.dhikrId) return state;
      const dhikr = findDhikr(action.dhikrId, state.customDhikr);
      if (!dhikr) return state;
      const target = dhikr.target ?? state.settings.defaultTarget;
      return { ...state, counter: roundFor(dhikr.id, target) };
    }

    case 'setTarget': {
      const counter = withTarget(state.counter, action.target);
      return counter === state.counter ? state : { ...state, counter };
    }

    case 'updateSettings':
      return updateSettings(state, action.patch);

    case 'addCustomDhikr':
      if (state.customDhikr.some((dhikr) => dhikr.id === action.dhikr.id)) return state;
      return { ...state, customDhikr: [...state.customDhikr, action.dhikr] };

    case 'updateCustomDhikr': {
      if (!state.customDhikr.some((dhikr) => dhikr.id === action.id)) return state;
      const customDhikr = state.customDhikr.map((dhikr) =>
        dhikr.id === action.id ? { ...dhikr, name: action.name, target: action.target } : dhikr,
      );
      const counter =
        state.counter.dhikrId === action.id
          ? withTarget(state.counter, action.target)
          : state.counter;
      return { ...state, customDhikr, counter };
    }

    case 'deleteCustomDhikr': {
      if (!state.customDhikr.some((dhikr) => dhikr.id === action.id)) return state;
      const customDhikr = state.customDhikr.filter((dhikr) => dhikr.id !== action.id);
      const counter =
        state.counter.dhikrId === action.id
          ? roundFor(DEFAULT_DHIKR_ID, state.settings.defaultTarget)
          : state.counter;
      return { ...state, customDhikr, counter };
    }

    case 'clearHistory': {
      // A finished round points at a history entry that is about to disappear.
      const counter =
        state.counter.completedSessionId !== null ? newRound(state.counter) : state.counter;
      return { ...state, counter, history: [], stats: { daily: {}, completedSessions: 0 } };
    }

    case 'updatePrayer':
      return { ...state, prayer: updatePrayer(state.prayer, action.patch) };
  }
}
