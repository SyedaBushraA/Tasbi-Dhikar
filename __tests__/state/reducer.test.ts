import { createDefaultAppState } from '@/constants/defaults';
import { DEFAULT_DHIKR_ID } from '@/constants/dhikr';
import { DEFAULT_TARGET } from '@/constants/targets';
import { appReducer } from '@/state/reducer';
import type { AppState, CustomDhikr } from '@/types';
import { toDayKey } from '@/utils/date';

/** Local timestamp in September 2026, so day keys do not depend on the timezone. */
function at(day: number, hour = 10, minute = 0): number {
  return new Date(2026, 8, day, hour, minute).getTime();
}

const YA_RAHMAN: CustomDhikr = {
  id: 'custom-1',
  name: 'Ya Rahman',
  target: 100,
  createdAt: at(10),
};

function stateWith(overrides: Partial<AppState> = {}): AppState {
  const base = createDefaultAppState();
  return { ...base, ...overrides };
}

/** Counts `times` taps, one second apart, starting at the given moment. */
function countTaps(state: AppState, times: number, start = at(14)): AppState {
  let next = state;
  for (let index = 0; index < times; index++) {
    next = appReducer(next, { type: 'tap', now: start + index * 1000, sessionId: `s${index}` });
  }
  return next;
}

describe('tap', () => {
  it('adds one count and records it on the day it happened', () => {
    const state = appReducer(stateWith(), { type: 'tap', now: at(14), sessionId: 's1' });

    expect(state.counter.count).toBe(1);
    expect(state.stats.daily[toDayKey(at(14))]).toBe(1);
  });

  it('remembers when the round started and when it was last counted', () => {
    const first = appReducer(stateWith(), { type: 'tap', now: at(14, 9), sessionId: 's1' });
    const second = appReducer(first, { type: 'tap', now: at(14, 11), sessionId: 's2' });

    expect(second.counter.startedAt).toBe(at(14, 9));
    expect(second.counter.lastTapAt).toBe(at(14, 11));
  });

  it('is ignored while the round is paused', () => {
    const paused = stateWith({ counter: { ...createDefaultAppState().counter, paused: true } });
    expect(appReducer(paused, { type: 'tap', now: at(14), sessionId: 's1' })).toBe(paused);
  });

  it('saves a session and marks the round finished at the target', () => {
    const start = stateWith({
      counter: { ...createDefaultAppState().counter, target: 3 },
    });
    const finished = countTaps(start, 3);

    expect(finished.counter.count).toBe(3);
    expect(finished.counter.completedSessionId).toBe('s2');
    expect(finished.history).toHaveLength(1);
    expect(finished.history[0]).toMatchObject({
      id: 's2',
      dhikrId: DEFAULT_DHIKR_ID,
      dhikrName: 'SubhanAllah',
      count: 3,
      target: 3,
    });
    expect(finished.stats.completedSessions).toBe(1);
  });

  it('keeps the name of a custom Dhikr in the history entry', () => {
    const start = stateWith({
      customDhikr: [YA_RAHMAN],
      counter: { ...createDefaultAppState().counter, dhikrId: YA_RAHMAN.id, target: 1 },
    });
    const finished = countTaps(start, 1);

    expect(finished.history[0]?.dhikrName).toBe('Ya Rahman');
  });

  it('reaches a target of 1000 exactly once and then stops counting', () => {
    const start = stateWith({ counter: { ...createDefaultAppState().counter, target: 1000 } });
    const finished = countTaps(start, 1000);
    const afterTarget = countTaps(finished, 5, at(15));

    expect(finished.counter.count).toBe(1000);
    expect(finished.history).toHaveLength(1);
    expect(finished.stats.completedSessions).toBe(1);
    expect(finished.stats.daily[toDayKey(at(14))]).toBe(1000);
    expect(afterTarget).toBe(finished);
  });
});

describe('undo', () => {
  it('takes back the last count and the statistic of its day', () => {
    const counted = countTaps(stateWith(), 2);
    const state = appReducer(counted, { type: 'undo', now: at(14, 11) });

    expect(state.counter.count).toBe(1);
    expect(state.stats.daily[toDayKey(at(14))]).toBe(1);
  });

  it('never goes below zero', () => {
    const empty = stateWith();
    expect(appReducer(empty, { type: 'undo', now: at(14) })).toBe(empty);

    const one = countTaps(empty, 1);
    const back = appReducer(one, { type: 'undo', now: at(14, 11) });
    expect(back.counter.count).toBe(0);
    expect(appReducer(back, { type: 'undo', now: at(14, 12) })).toBe(back);
  });

  it('forgets the times of the round once it is empty again', () => {
    const back = appReducer(countTaps(stateWith(), 1), { type: 'undo', now: at(14, 11) });

    expect(back.counter.startedAt).toBeNull();
    expect(back.counter.lastTapAt).toBeNull();
  });

  it('takes back the saved session when the final count is undone', () => {
    const start = stateWith({ counter: { ...createDefaultAppState().counter, target: 2 } });
    const finished = countTaps(start, 2);
    const back = appReducer(finished, { type: 'undo', now: at(14, 11) });

    expect(back.history).toEqual([]);
    expect(back.stats.completedSessions).toBe(0);
    expect(back.counter.completedSessionId).toBeNull();
    expect(back.counter.count).toBe(1);
  });

  it('removes the count from the day it was added to, not from today', () => {
    const yesterday = countTaps(stateWith(), 1, at(13, 23, 30));
    const state = appReducer(yesterday, { type: 'undo', now: at(14, 0) });

    expect(state.stats.daily[toDayKey(at(13))]).toBeUndefined();
    expect(state.stats.daily[toDayKey(at(14))]).toBeUndefined();
  });
});

describe('reset and startNewRound', () => {
  it('do nothing to a round that has not started', () => {
    const empty = stateWith();
    expect(appReducer(empty, { type: 'reset' })).toBe(empty);
    expect(appReducer(empty, { type: 'startNewRound' })).toBe(empty);
  });

  it('clear the count and keep the Dhikr and the target', () => {
    const counted = countTaps(stateWith({ customDhikr: [YA_RAHMAN] }), 3);
    const state = appReducer(counted, { type: 'reset' });

    expect(state.counter).toEqual({
      dhikrId: DEFAULT_DHIKR_ID,
      target: DEFAULT_TARGET,
      count: 0,
      paused: false,
      startedAt: null,
      lastTapAt: null,
      completedSessionId: null,
    });
  });

  it('keep the history and the statistics of what was counted', () => {
    const start = stateWith({ counter: { ...createDefaultAppState().counter, target: 2 } });
    const finished = countTaps(start, 2);
    const state = appReducer(finished, { type: 'startNewRound' });

    expect(state.history).toHaveLength(1);
    expect(state.stats.daily[toDayKey(at(14))]).toBe(2);
  });

  it('release a paused round that has nothing counted yet', () => {
    const paused = appReducer(stateWith(), { type: 'setPaused', paused: true });
    expect(appReducer(paused, { type: 'reset' }).counter.paused).toBe(false);
  });
});

describe('setPaused', () => {
  it('pauses and resumes the round', () => {
    const paused = appReducer(stateWith(), { type: 'setPaused', paused: true });
    expect(paused.counter.paused).toBe(true);
    expect(appReducer(paused, { type: 'setPaused', paused: false }).counter.paused).toBe(false);
  });

  it('does nothing when it is already in that state', () => {
    const state = stateWith();
    expect(appReducer(state, { type: 'setPaused', paused: false })).toBe(state);
  });
});

describe('selectDhikr', () => {
  it('starts a fresh round on the chosen Dhikr', () => {
    const counted = countTaps(stateWith(), 4);
    const state = appReducer(counted, { type: 'selectDhikr', dhikrId: 'astaghfirullah' });

    expect(state.counter.dhikrId).toBe('astaghfirullah');
    expect(state.counter.count).toBe(0);
    expect(state.counter.target).toBe(DEFAULT_TARGET);
  });

  it('uses the default target for a built-in Dhikr', () => {
    const state = stateWith({
      settings: { ...createDefaultAppState().settings, defaultTarget: 99 },
    });
    const chosen = appReducer(state, { type: 'selectDhikr', dhikrId: 'salawat' });

    expect(chosen.counter.target).toBe(99);
  });

  it('uses the own target of a custom Dhikr', () => {
    const state = stateWith({ customDhikr: [YA_RAHMAN] });
    const chosen = appReducer(state, { type: 'selectDhikr', dhikrId: YA_RAHMAN.id });

    expect(chosen.counter.target).toBe(100);
  });

  it('ignores a Dhikr that does not exist', () => {
    const state = stateWith();
    expect(appReducer(state, { type: 'selectDhikr', dhikrId: 'custom-gone' })).toBe(state);
  });

  it('ignores the Dhikr that is already being counted', () => {
    const counted = countTaps(stateWith(), 4);
    expect(appReducer(counted, { type: 'selectDhikr', dhikrId: DEFAULT_DHIKR_ID })).toBe(counted);
  });
});

describe('setTarget', () => {
  it('changes the target and keeps the count', () => {
    const counted = countTaps(stateWith(), 4);
    const state = appReducer(counted, { type: 'setTarget', target: 99 });

    expect(state.counter.target).toBe(99);
    expect(state.counter.count).toBe(4);
  });

  it('starts a new round when the count already reached the new target', () => {
    const counted = countTaps(stateWith(), 4);
    const state = appReducer(counted, { type: 'setTarget', target: 4 });

    expect(state.counter.target).toBe(4);
    expect(state.counter.count).toBe(0);
  });

  it('does nothing when the target is unchanged', () => {
    const state = stateWith();
    expect(appReducer(state, { type: 'setTarget', target: DEFAULT_TARGET })).toBe(state);
  });
});

describe('updateSettings', () => {
  it('applies the patch and leaves the rest alone', () => {
    const state = appReducer(stateWith(), {
      type: 'updateSettings',
      patch: { theme: 'dark', clockFormat: '24h' },
    });

    expect(state.settings.theme).toBe('dark');
    expect(state.settings.clockFormat).toBe('24h');
    expect(state.settings.language).toBe('en');
  });

  it('keeps the reminder when another setting changes', () => {
    const withReminder = appReducer(stateWith(), {
      type: 'updateSettings',
      patch: { reminder: { enabled: true, hour: 6, minute: 30 } },
    });
    const state = appReducer(withReminder, { type: 'updateSettings', patch: { theme: 'dark' } });

    expect(state.settings.reminder).toEqual({ enabled: true, hour: 6, minute: 30 });
  });

  it('moves an untouched built-in round to the new default target', () => {
    const state = appReducer(stateWith(), {
      type: 'updateSettings',
      patch: { defaultTarget: 99 },
    });

    expect(state.counter.target).toBe(99);
  });

  it('leaves a round that has already been counted on its own target', () => {
    const counted = countTaps(stateWith(), 1);
    const state = appReducer(counted, { type: 'updateSettings', patch: { defaultTarget: 99 } });

    expect(state.counter.target).toBe(DEFAULT_TARGET);
  });

  it('leaves a custom Dhikr on its own target', () => {
    const chosen = appReducer(stateWith({ customDhikr: [YA_RAHMAN] }), {
      type: 'selectDhikr',
      dhikrId: YA_RAHMAN.id,
    });
    const state = appReducer(chosen, { type: 'updateSettings', patch: { defaultTarget: 99 } });

    expect(state.counter.target).toBe(100);
  });
});

describe('custom Dhikr', () => {
  it('adds one', () => {
    const state = appReducer(stateWith(), { type: 'addCustomDhikr', dhikr: YA_RAHMAN });
    expect(state.customDhikr).toEqual([YA_RAHMAN]);
  });

  it('ignores an id that is already there', () => {
    const state = stateWith({ customDhikr: [YA_RAHMAN] });
    const again = appReducer(state, {
      type: 'addCustomDhikr',
      dhikr: { ...YA_RAHMAN, name: 'Ya Kareem' },
    });

    expect(again).toBe(state);
  });

  it('renames and retargets one', () => {
    const state = appReducer(stateWith({ customDhikr: [YA_RAHMAN] }), {
      type: 'updateCustomDhikr',
      id: YA_RAHMAN.id,
      name: 'Ya Kareem',
      target: 200,
    });

    expect(state.customDhikr[0]).toEqual({ ...YA_RAHMAN, name: 'Ya Kareem', target: 200 });
  });

  it('carries a new target into the round that is counting it', () => {
    const chosen = appReducer(stateWith({ customDhikr: [YA_RAHMAN] }), {
      type: 'selectDhikr',
      dhikrId: YA_RAHMAN.id,
    });
    const counted = countTaps(chosen, 3);
    const state = appReducer(counted, {
      type: 'updateCustomDhikr',
      id: YA_RAHMAN.id,
      name: YA_RAHMAN.name,
      target: 50,
    });

    expect(state.counter.target).toBe(50);
    expect(state.counter.count).toBe(3);
  });

  it('starts the round again when the new target is already reached', () => {
    const chosen = appReducer(stateWith({ customDhikr: [YA_RAHMAN] }), {
      type: 'selectDhikr',
      dhikrId: YA_RAHMAN.id,
    });
    const counted = countTaps(chosen, 3);
    const state = appReducer(counted, {
      type: 'updateCustomDhikr',
      id: YA_RAHMAN.id,
      name: YA_RAHMAN.name,
      target: 3,
    });

    expect(state.counter.count).toBe(0);
  });

  it('ignores an update to a Dhikr that is gone', () => {
    const state = stateWith({ customDhikr: [YA_RAHMAN] });
    const same = appReducer(state, {
      type: 'updateCustomDhikr',
      id: 'custom-gone',
      name: 'Ya Kareem',
      target: 50,
    });

    expect(same).toBe(state);
  });

  it('deletes one and leaves a round on another Dhikr alone', () => {
    const counted = countTaps(stateWith({ customDhikr: [YA_RAHMAN] }), 2);
    const state = appReducer(counted, { type: 'deleteCustomDhikr', id: YA_RAHMAN.id });

    expect(state.customDhikr).toEqual([]);
    expect(state.counter.count).toBe(2);
  });

  it('goes back to the default Dhikr when the deleted one was being counted', () => {
    const chosen = appReducer(stateWith({ customDhikr: [YA_RAHMAN] }), {
      type: 'selectDhikr',
      dhikrId: YA_RAHMAN.id,
    });
    const counted = countTaps(chosen, 2);
    const state = appReducer(counted, { type: 'deleteCustomDhikr', id: YA_RAHMAN.id });

    expect(state.counter.dhikrId).toBe(DEFAULT_DHIKR_ID);
    expect(state.counter.target).toBe(DEFAULT_TARGET);
    expect(state.counter.count).toBe(0);
  });

  it('ignores a delete of a Dhikr that is gone', () => {
    const state = stateWith({ customDhikr: [YA_RAHMAN] });
    expect(appReducer(state, { type: 'deleteCustomDhikr', id: 'custom-gone' })).toBe(state);
  });
});

describe('clearHistory', () => {
  it('empties the history and the statistics', () => {
    const start = stateWith({ counter: { ...createDefaultAppState().counter, target: 2 } });
    const finished = countTaps(start, 2);
    const state = appReducer(finished, { type: 'clearHistory' });

    expect(state.history).toEqual([]);
    expect(state.stats).toEqual({ daily: {}, completedSessions: 0 });
  });

  it('starts a new round when the finished one pointed at the history', () => {
    const start = stateWith({ counter: { ...createDefaultAppState().counter, target: 2 } });
    const finished = countTaps(start, 2);
    const state = appReducer(finished, { type: 'clearHistory' });

    expect(state.counter.count).toBe(0);
    expect(state.counter.completedSessionId).toBeNull();
  });

  it('leaves a round in progress counting', () => {
    const counted = countTaps(stateWith(), 4);
    const state = appReducer(counted, { type: 'clearHistory' });

    expect(state.counter.count).toBe(4);
  });
});
