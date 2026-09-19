import type { CounterState } from '@/types';

export function isComplete(counter: CounterState): boolean {
  return counter.completedSessionId !== null || counter.count >= counter.target;
}

export function remaining(counter: CounterState): number {
  return Math.max(0, counter.target - counter.count);
}

/** Progress towards the target from 0 to 1. */
export function progress(counter: CounterState): number {
  if (counter.target <= 0) return 0;
  return Math.min(1, Math.max(0, counter.count / counter.target));
}

export function canCount(counter: CounterState): boolean {
  return !counter.paused && !isComplete(counter);
}

export function canUndo(counter: CounterState): boolean {
  return counter.count > 0;
}

/** A fresh round that keeps the selected Dhikr and target. */
export function newRound(counter: CounterState): CounterState {
  return {
    dhikrId: counter.dhikrId,
    target: counter.target,
    count: 0,
    paused: false,
    startedAt: null,
    lastTapAt: null,
    completedSessionId: null,
  };
}

/**
 * Whether switching to this target has to start a new round, because the
 * current count already reached it.
 */
export function targetChangeRestartsRound(counter: CounterState, target: number): boolean {
  return counter.count > 0 && (isComplete(counter) || counter.count >= target);
}
