import { PERSIST_DEBOUNCE_MS, createDefaultAppState } from '@/constants/defaults';
import type { AppStorage } from '@/storage/appStorage';
import { APP_STATE_SLICES } from '@/storage/keys';
import type { AppState } from '@/types';

import { type AppAction, appReducer } from './reducer';

export interface StoreStatus {
  /** Saved data has been loaded; before that the UI must not be shown. */
  hydrated: boolean;
  /** The last write to local storage failed. The app keeps working in memory. */
  saveFailed: boolean;
}

export interface AppStore {
  getState(): AppState;
  getStatus(): StoreStatus;
  dispatch(action: AppAction): void;
  subscribe(listener: () => void): () => void;
  /** Loads saved data. Safe to call more than once. */
  hydrate(): Promise<void>;
  /** Writes pending changes now, for example when the app goes to the background. */
  flush(): Promise<void>;
}

export interface StoreOptions {
  debounceMs?: number;
}

/** Slices that change with every tap and are therefore written after a short quiet period. */
const DEBOUNCED_SLICES: ReadonlySet<keyof AppState> = new Set(['counter', 'stats']);

export function createAppStore(storage: AppStorage, options: StoreOptions = {}): AppStore {
  const debounceMs = options.debounceMs ?? PERSIST_DEBOUNCE_MS;
  const listeners = new Set<() => void>();
  const dirty = new Set<keyof AppState>();

  let state = createDefaultAppState();
  let status: StoreStatus = { hydrated: false, saveFailed: false };
  let hydration: Promise<void> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let writeQueue: Promise<void> = Promise.resolve();

  function notify(): void {
    listeners.forEach((listener) => listener());
  }

  function setStatus(patch: Partial<StoreStatus>): void {
    const next = { ...status, ...patch };
    if (next.hydrated === status.hydrated && next.saveFailed === status.saveFailed) return;
    status = next;
    notify();
  }

  function cancelTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function flush(): Promise<void> {
    cancelTimer();
    writeQueue = writeQueue.then(async () => {
      if (dirty.size === 0) return;
      const slices = [...dirty];
      dirty.clear();

      const snapshot = state;
      const payload: Partial<AppState> = {};
      for (const slice of slices) Object.assign(payload, { [slice]: snapshot[slice] });

      // A storage that throws instead of reporting false must not poison the
      // queue: every later write would be skipped without anyone noticing.
      const saved = await storage.save(payload).catch(() => false);
      if (!saved) slices.forEach((slice) => dirty.add(slice)); // retried with the next write
      setStatus({ saveFailed: !saved });
    });
    return writeQueue;
  }

  function schedulePersist(changed: (keyof AppState)[]): void {
    changed.forEach((slice) => dirty.add(slice));
    if (changed.every((slice) => DEBOUNCED_SLICES.has(slice))) {
      cancelTimer();
      timer = setTimeout(() => void flush(), debounceMs);
    } else {
      void flush();
    }
  }

  return {
    getState: () => state,
    getStatus: () => status,

    dispatch(action) {
      const previous = state;
      const next = appReducer(previous, action);
      if (next === previous) return;
      state = next;

      if (status.hydrated && action.type !== 'hydrate') {
        const changed = APP_STATE_SLICES.filter((slice) => previous[slice] !== next[slice]);
        if (changed.length > 0) schedulePersist(changed);
      }
      notify();
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    hydrate() {
      hydration ??= storage
        .load()
        .catch(() => createDefaultAppState())
        .then((loaded) => {
          state = appReducer(state, { type: 'hydrate', state: loaded });
          status = { ...status, hydrated: true };
          notify();
        });
      return hydration;
    },

    flush,
  };
}
