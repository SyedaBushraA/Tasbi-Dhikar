import { type RenderResult, act, render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';

import type { ReminderContent, ReminderResult } from '@/services/reminders';
import { StoreProvider } from '@/state';
import { type ActionServices, type AppActions, createAppActions } from '@/state/actions';
import type { LocateResult, PrayerAlertInput, PrayerAlertResult } from '@/state/prayerActions';
import { type AppStore, createAppStore } from '@/state/store';

import { type MemoryStorage, type SavedState, createMemoryStorage } from './storage';

/** A fixed morning in September 2026, so day keys never depend on the real date. */
export const TEST_NOW = new Date(2026, 8, 14, 10, 0).getTime();

/** Insets of a phone with a notch, so safe-area padding is exercised. */
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export interface TestClock {
  /** The current time, moved on by `step` after every reading. */
  now(): number;
  advance(ms: number): void;
}

/**
 * @param step milliseconds between two readings. A step wide enough for the
 * double-tap guard lets a test tap as often as it likes; 0 freezes the clock.
 */
export function createClock(start: number = TEST_NOW, step = 0): TestClock {
  let current = start;
  return {
    now() {
      const value = current;
      current += step;
      return value;
    },
    advance(ms) {
      current += ms;
    },
  };
}

export interface TestActionServices extends ActionServices {
  haptics: {
    tap: jest.Mock<void, []>;
    complete: jest.Mock<void, []>;
    selection: jest.Mock<void, []>;
  };
  sound: { tick: jest.Mock<void, []>; complete: jest.Mock<void, []> };
  reminders: {
    schedule: jest.Mock<Promise<ReminderResult>, [number, number, ReminderContent]>;
    cancel: jest.Mock<Promise<void>, []>;
    sync: jest.Mock<Promise<boolean>, [boolean, number, number, ReminderContent]>;
  };
  prayer: {
    locate: jest.Mock<Promise<LocateResult>, []>;
    syncAlerts: jest.Mock<
      Promise<PrayerAlertResult>,
      [PrayerAlertInput, { requestPermission: boolean }]
    >;
  };
}

/** Stand-ins for the phone: nothing vibrates, sounds or gets scheduled. */
export function createTestServices(clock: TestClock): TestActionServices {
  return {
    haptics: {
      tap: jest.fn<void, []>(),
      complete: jest.fn<void, []>(),
      selection: jest.fn<void, []>(),
    },
    sound: { tick: jest.fn<void, []>(), complete: jest.fn<void, []>() },
    reminders: {
      schedule: jest.fn<Promise<ReminderResult>, [number, number, ReminderContent]>(() =>
        Promise.resolve<ReminderResult>('scheduled'),
      ),
      cancel: jest.fn<Promise<void>, []>(() => Promise.resolve()),
      sync: jest.fn<Promise<boolean>, [boolean, number, number, ReminderContent]>(() =>
        Promise.resolve(true),
      ),
    },
    prayer: {
      locate: jest.fn<Promise<LocateResult>, []>(() =>
        Promise.resolve<LocateResult>({ status: 'unavailable' }),
      ),
      syncAlerts: jest.fn<
        Promise<PrayerAlertResult>,
        [PrayerAlertInput, { requestPermission: boolean }]
      >(() => Promise.resolve<PrayerAlertResult>('none')),
    },
    now: () => clock.now(),
  };
}

export interface TestHarness {
  store: AppStore;
  actions: AppActions;
  services: TestActionServices;
  storage: MemoryStorage;
  clock: TestClock;
}

export interface HarnessOptions {
  /** Saved data the store is hydrated from. Missing parts fall back to defaults. */
  state?: SavedState;
  clock?: TestClock;
  debounceMs?: number;
}

const TAP_STEP_MS = 1000;

/** A hydrated store with actions on top of it, wired to the fake services. */
export async function createTestHarness(options: HarnessOptions = {}): Promise<TestHarness> {
  const storage = createMemoryStorage(options.state);
  const store = createAppStore(storage, { debounceMs: options.debounceMs ?? 0 });
  const clock = options.clock ?? createClock(TEST_NOW, TAP_STEP_MS);
  const services = createTestServices(clock);
  const actions = createAppActions(store, services);
  await store.hydrate();
  return { store, actions, services, storage, clock };
}

export type RenderWithStoreResult = RenderResult & TestHarness;

/** Renders inside a hydrated store and a safe area, the way the app does. */
export async function renderWithStore(
  ui: ReactElement,
  options: HarnessOptions = {},
): Promise<RenderWithStoreResult> {
  const harness = await createTestHarness(options);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={METRICS}>
        <StoreProvider store={harness.store} actions={harness.actions}>
          {children}
        </StoreProvider>
      </SafeAreaProvider>
    );
  }

  const view = render(ui, { wrapper: Wrapper });
  // Effects that wait on a promise (reduced motion, for one) settle before the first assertion.
  await act(async () => {
    await Promise.resolve();
  });

  return { ...view, ...harness };
}
