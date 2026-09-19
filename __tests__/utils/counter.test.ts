import { DEFAULT_COUNTER } from '@/constants/defaults';
import type { CounterState } from '@/types';
import {
  canCount,
  canUndo,
  isComplete,
  newRound,
  progress,
  remaining,
  targetChangeRestartsRound,
} from '@/utils/counter';

function counter(overrides: Partial<CounterState> = {}): CounterState {
  return { ...DEFAULT_COUNTER, target: 33, ...overrides };
}

describe('isComplete', () => {
  it('is false for a fresh round', () => {
    expect(isComplete(counter())).toBe(false);
  });

  it('is false while the count is below the target', () => {
    expect(isComplete(counter({ count: 32 }))).toBe(false);
  });

  it('is true once the count reaches or passes the target', () => {
    expect(isComplete(counter({ count: 33 }))).toBe(true);
    expect(isComplete(counter({ count: 40 }))).toBe(true);
  });

  it('is true when a completed session is recorded, whatever the count', () => {
    expect(isComplete(counter({ count: 3, completedSessionId: 'session-1' }))).toBe(true);
  });
});

describe('remaining', () => {
  it('is the whole target for a fresh round', () => {
    expect(remaining(counter())).toBe(33);
  });

  it('counts down with the count', () => {
    expect(remaining(counter({ count: 10 }))).toBe(23);
    expect(remaining(counter({ count: 32 }))).toBe(1);
  });

  it('never goes below zero', () => {
    expect(remaining(counter({ count: 33 }))).toBe(0);
    expect(remaining(counter({ count: 50 }))).toBe(0);
  });
});

describe('progress', () => {
  it('is 0 for a fresh round', () => {
    expect(progress(counter())).toBe(0);
  });

  it('is the share of the target that was counted', () => {
    expect(progress(counter({ count: 11 }))).toBeCloseTo(1 / 3);
    expect(progress(counter({ target: 100, count: 50 }))).toBe(0.5);
  });

  it('is 1 at the target', () => {
    expect(progress(counter({ count: 33 }))).toBe(1);
  });

  it('is clamped between 0 and 1', () => {
    expect(progress(counter({ count: 99 }))).toBe(1);
    expect(progress(counter({ count: -5 }))).toBe(0);
  });

  it('is 0 for a target of zero or less instead of dividing by zero', () => {
    expect(progress(counter({ target: 0, count: 5 }))).toBe(0);
    expect(progress(counter({ target: -1, count: 5 }))).toBe(0);
  });
});

describe('canCount', () => {
  it('allows counting in a fresh round', () => {
    expect(canCount(counter())).toBe(true);
  });

  it('allows counting one short of the target', () => {
    expect(canCount(counter({ count: 32 }))).toBe(true);
  });

  it('blocks counting while paused', () => {
    expect(canCount(counter({ paused: true }))).toBe(false);
    expect(canCount(counter({ paused: true, count: 5 }))).toBe(false);
  });

  it('blocks counting once complete', () => {
    expect(canCount(counter({ count: 33 }))).toBe(false);
    expect(canCount(counter({ count: 10, completedSessionId: 'session-1' }))).toBe(false);
  });

  it('blocks counting when paused and complete', () => {
    expect(canCount(counter({ paused: true, count: 33 }))).toBe(false);
  });
});

describe('canUndo', () => {
  it('is false at zero', () => {
    expect(canUndo(counter())).toBe(false);
  });

  it('is true with at least one count', () => {
    expect(canUndo(counter({ count: 1 }))).toBe(true);
    expect(canUndo(counter({ count: 33, completedSessionId: 'session-1' }))).toBe(true);
  });

  it('does not depend on pausing', () => {
    expect(canUndo(counter({ count: 2, paused: true }))).toBe(true);
    expect(canUndo(counter({ count: 0, paused: true }))).toBe(false);
  });
});

describe('newRound', () => {
  const finished = counter({
    dhikrId: 'astaghfirullah',
    target: 99,
    count: 99,
    paused: true,
    startedAt: new Date(2026, 8, 14, 10, 0).getTime(),
    lastTapAt: new Date(2026, 8, 14, 10, 5).getTime(),
    completedSessionId: 'session-1',
  });

  it('keeps the Dhikr and target and clears everything else', () => {
    expect(newRound(finished)).toEqual({
      dhikrId: 'astaghfirullah',
      target: 99,
      count: 0,
      paused: false,
      startedAt: null,
      lastTapAt: null,
      completedSessionId: null,
    });
  });

  it('returns a new object and leaves the old round untouched', () => {
    const fresh = newRound(finished);
    expect(fresh).not.toBe(finished);
    expect(finished.count).toBe(99);
    expect(finished.completedSessionId).toBe('session-1');
  });
});

describe('targetChangeRestartsRound', () => {
  it('never restarts a round that has not started', () => {
    expect(targetChangeRestartsRound(counter(), 1)).toBe(false);
    expect(targetChangeRestartsRound(counter(), 1000)).toBe(false);
  });

  it('keeps the round when the count is still below the new target', () => {
    expect(targetChangeRestartsRound(counter({ count: 5 }), 10)).toBe(false);
    expect(targetChangeRestartsRound(counter({ count: 5 }), 6)).toBe(false);
  });

  it('restarts when the count already reached the new target', () => {
    expect(targetChangeRestartsRound(counter({ count: 5 }), 5)).toBe(true);
    expect(targetChangeRestartsRound(counter({ count: 5 }), 3)).toBe(true);
  });

  it('restarts a completed round even for a larger target', () => {
    const completed = counter({ count: 33, completedSessionId: 'session-1' });
    expect(targetChangeRestartsRound(completed, 100)).toBe(true);
  });
});
