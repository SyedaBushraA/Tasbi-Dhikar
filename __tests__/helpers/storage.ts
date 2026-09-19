import type { AppStorage } from '@/storage/appStorage';
import { sanitizeAppState } from '@/storage/sanitize';
import type { AppState } from '@/types';

/*
 * Storage that lives in memory, behaving like the real one: values go through
 * JSON, what comes back is sanitized, and writing can be made to fail.
 */

/** What the phone would hold on disk: one JSON value per slice. */
type StoredSlices = Partial<Record<keyof AppState, unknown>>;

type DeepPartial<T> = T extends readonly (infer Item)[]
  ? readonly DeepPartial<Item>[]
  : T extends object
    ? { [Key in keyof T]?: DeepPartial<T[Key]> }
    : T;

/** Saved data as a test writes it: only the parts that matter to the test. */
export type SavedState = DeepPartial<AppState>;

export interface MemoryStorage extends AppStorage {
  /** Every payload handed to save(), in the order it was written. */
  readonly writes: Partial<AppState>[];
  /** How often load() was called. */
  readonly loads: number;
  /** Makes every following write fail, as full or broken storage would. */
  failWrites(failing: boolean): void;
  /** Adds or replaces stored slices, for example before hydrating. */
  seed(slices: SavedState): void;
  /** The state a fresh load would produce right now. */
  snapshot(): AppState;
}

function copy(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

export function createMemoryStorage(initial: SavedState = {}): MemoryStorage {
  const stored: StoredSlices = {};
  const writes: Partial<AppState>[] = [];
  let loads = 0;
  let failing = false;

  function put(slices: SavedState): void {
    for (const [slice, value] of Object.entries(slices as Record<string, unknown>)) {
      if (value === undefined) continue;
      stored[slice as keyof AppState] = copy(value);
    }
  }

  put(initial);

  return {
    get writes() {
      return writes;
    },
    get loads() {
      return loads;
    },

    load() {
      loads += 1;
      return Promise.resolve(sanitizeAppState(stored));
    },

    save(slices) {
      if (failing) return Promise.resolve(false);
      writes.push(slices);
      put(slices);
      return Promise.resolve(true);
    },

    failWrites(next) {
      failing = next;
    },

    seed(slices) {
      put(slices);
    },

    snapshot() {
      return sanitizeAppState(stored);
    },
  };
}
