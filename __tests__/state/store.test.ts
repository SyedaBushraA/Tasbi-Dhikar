import { PERSIST_DEBOUNCE_MS } from '@/constants/defaults';
import { createAppStore } from '@/state/store';
import type { AppState } from '@/types';

import { createMemoryStorage } from '../helpers/storage';

/** Local timestamp in September 2026, so day keys do not depend on the timezone. */
function at(day: number, hour = 10, minute = 0): number {
  return new Date(2026, 8, day, hour, minute).getTime();
}

function tap(now: number, sessionId: string) {
  return { type: 'tap', now, sessionId } as const;
}

/** Which slices a write carried. */
function slicesOf(write: Partial<AppState>): (keyof AppState)[] {
  return Object.keys(write) as (keyof AppState)[];
}

describe('createAppStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('writes nothing before the saved data has been loaded', async () => {
    const storage = createMemoryStorage();
    const store = createAppStore(storage);

    store.dispatch(tap(at(14), 's1'));
    store.dispatch({ type: 'updateSettings', patch: { easyMode: true } });
    jest.advanceTimersByTime(PERSIST_DEBOUNCE_MS * 2);
    await store.flush();

    expect(storage.writes).toEqual([]);
  });

  it('loads the saved data once, however often hydration is asked for', async () => {
    const storage = createMemoryStorage({ settings: { defaultTarget: 99 } });
    const store = createAppStore(storage);

    await Promise.all([store.hydrate(), store.hydrate()]);
    await store.hydrate();

    expect(storage.loads).toBe(1);
    expect(store.getState().settings.defaultTarget).toBe(99);
    expect(store.getStatus().hydrated).toBe(true);
  });

  it('opens on the defaults when the saved data cannot be read', async () => {
    const storage = createMemoryStorage();
    jest.spyOn(storage, 'load').mockRejectedValue(new Error('storage unavailable'));
    const store = createAppStore(storage);

    await store.hydrate();

    expect(store.getStatus().hydrated).toBe(true);
    expect(store.getState().counter.count).toBe(0);
  });

  it('waits for a quiet moment before writing the running count', async () => {
    const storage = createMemoryStorage();
    const store = createAppStore(storage);
    await store.hydrate();

    store.dispatch(tap(at(14), 's1'));
    jest.advanceTimersByTime(PERSIST_DEBOUNCE_MS - 1);
    expect(storage.writes).toEqual([]);

    jest.advanceTimersByTime(1);
    await store.flush();

    expect(storage.writes).toHaveLength(1);
    expect(slicesOf(storage.writes[0] ?? {}).sort()).toEqual(['counter', 'stats']);
  });

  it('starts the quiet period again with every count', async () => {
    const storage = createMemoryStorage();
    const store = createAppStore(storage);
    await store.hydrate();

    store.dispatch(tap(at(14), 's1'));
    jest.advanceTimersByTime(PERSIST_DEBOUNCE_MS - 100);
    store.dispatch(tap(at(14, 10, 1), 's2'));
    jest.advanceTimersByTime(PERSIST_DEBOUNCE_MS - 100);
    expect(storage.writes).toEqual([]);

    jest.advanceTimersByTime(100);
    await store.flush();

    expect(storage.writes).toHaveLength(1);
    expect(store.getState().counter.count).toBe(2);
  });

  it('writes a finished round straight away, because history changed', async () => {
    const storage = createMemoryStorage({
      counter: { dhikrId: 'subhanallah', target: 1, count: 0, paused: false },
    });
    const store = createAppStore(storage);
    await store.hydrate();

    store.dispatch(tap(at(14), 's1'));
    await store.flush();

    expect(storage.writes).toHaveLength(1);
    expect(slicesOf(storage.writes[0] ?? {}).sort()).toEqual(['counter', 'history', 'stats']);
  });

  it('writes changed settings straight away', async () => {
    const storage = createMemoryStorage();
    const store = createAppStore(storage);
    await store.hydrate();

    store.dispatch({ type: 'updateSettings', patch: { easyMode: true } });
    await store.flush();

    expect(storage.writes.map(slicesOf)).toEqual([['settings']]);
    expect(storage.snapshot().settings.easyMode).toBe(true);
  });

  it('writes changed prayer settings straight away', async () => {
    const storage = createMemoryStorage();
    const store = createAppStore(storage);
    await store.hydrate();

    store.dispatch({ type: 'updatePrayer', patch: { adhanEnabled: true } });
    await store.flush();

    expect(storage.writes.map(slicesOf)).toEqual([['prayer']]);
    expect(storage.snapshot().prayer.adhanEnabled).toBe(true);
  });

  it('flushes pending counts at once and leaves nothing behind', async () => {
    const storage = createMemoryStorage();
    const store = createAppStore(storage);
    await store.hydrate();

    store.dispatch(tap(at(14), 's1'));
    await store.flush();
    expect(storage.writes).toHaveLength(1);

    jest.advanceTimersByTime(PERSIST_DEBOUNCE_MS * 2);
    await store.flush();
    expect(storage.writes).toHaveLength(1);
  });

  it('flushing without changes writes nothing', async () => {
    const storage = createMemoryStorage();
    const store = createAppStore(storage);
    await store.hydrate();

    await store.flush();

    expect(storage.writes).toEqual([]);
  });

  it('reports a failed write and retries it together with the next change', async () => {
    const storage = createMemoryStorage();
    const store = createAppStore(storage);
    await store.hydrate();

    storage.failWrites(true);
    store.dispatch({ type: 'updatePrayer', patch: { adhanEnabled: true } });
    await store.flush();

    expect(store.getStatus().saveFailed).toBe(true);
    expect(storage.writes).toEqual([]);

    storage.failWrites(false);
    store.dispatch({ type: 'updateSettings', patch: { easyMode: true } });
    await store.flush();

    expect(store.getStatus().saveFailed).toBe(false);
    expect(slicesOf(storage.writes[0] ?? {}).sort()).toEqual(['prayer', 'settings']);
  });

  it('tells subscribers about a change and stops once they unsubscribe', async () => {
    const storage = createMemoryStorage();
    const store = createAppStore(storage);
    await store.hydrate();

    const listener = jest.fn<void, []>();
    const unsubscribe = store.subscribe(listener);

    store.dispatch(tap(at(14), 's1'));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.dispatch(tap(at(14, 10, 1), 's2'));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('says nothing and writes nothing when an action changes nothing', async () => {
    const storage = createMemoryStorage();
    const store = createAppStore(storage);
    await store.hydrate();
    const before = store.getState();

    const listener = jest.fn<void, []>();
    store.subscribe(listener);
    store.dispatch({ type: 'setPaused', paused: false });
    store.dispatch({ type: 'reset' });
    jest.advanceTimersByTime(PERSIST_DEBOUNCE_MS * 2);
    await store.flush();

    expect(listener).not.toHaveBeenCalled();
    expect(store.getState()).toBe(before);
    expect(storage.writes).toEqual([]);
  });

  it('tells subscribers when a write fails', async () => {
    const storage = createMemoryStorage();
    const store = createAppStore(storage);
    await store.hydrate();

    const listener = jest.fn<void, []>();
    store.subscribe(listener);
    storage.failWrites(true);
    store.dispatch({ type: 'updateSettings', patch: { easyMode: true } });
    await store.flush();

    // One for the change itself, one for the failure.
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.getStatus().saveFailed).toBe(true);
  });
});
