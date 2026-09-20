import { MIN_TAP_INTERVAL_MS } from '@/constants/defaults';
import { MAX_CUSTOM_DHIKR } from '@/constants/dhikr';
import { translate } from '@/i18n';
import type { ReminderContent, ReminderResult } from '@/services/reminders';
import type { CustomDhikr, LanguageCode, Settings } from '@/types';
import { createId } from '@/utils/id';
import { listDhikr } from '@/utils/dhikr';
import { validateDhikrName, validateTarget } from '@/utils/validation';
import type { DhikrNameError, TargetError } from '@/utils/validation';

import { type PrayerActions, type PrayerServices, createPrayerActions } from './prayerActions';
import type { AppStore } from './store';

/** Device features the actions use. Injected so the logic can be tested without a phone. */
export interface ActionServices {
  haptics: { tap(): void; complete(): void; selection(): void };
  sound: { tick(): void; complete(): void };
  reminders: {
    schedule(hour: number, minute: number, content: ReminderContent): Promise<ReminderResult>;
    cancel(): Promise<void>;
    sync(enabled: boolean, hour: number, minute: number, content: ReminderContent): Promise<boolean>;
  };
  prayer: Omit<PrayerServices, 'now'>;
  now(): number;
}

export type SaveDhikrResult =
  | { ok: true; dhikr: CustomDhikr }
  | { ok: false; nameError?: DhikrNameError; targetError?: TargetError; limitReached?: boolean };

export interface AppActions extends PrayerActions {
  /** Adds one count. Returns false if the tap was ignored. */
  tap(): boolean;
  undo(): void;
  reset(): void;
  startNewRound(): void;
  togglePause(): void;
  selectDhikr(dhikrId: string): void;
  setTarget(target: number): void;
  updateSettings(patch: Partial<Settings>): void;
  completeOnboarding(): void;
  /** Validates and stores a custom Dhikr. Pass an id to edit an existing one. */
  saveCustomDhikr(input: { id?: string; name: string; target: string | number }): SaveDhikrResult;
  deleteCustomDhikr(id: string): void;
  clearHistory(): void;
  /** Turns the reminder on (asking for permission if needed) and saves the result. */
  enableReminder(): Promise<ReminderResult>;
  disableReminder(): Promise<void>;
  setReminderTime(hour: number, minute: number): Promise<ReminderResult | 'saved'>;
  /** Re-creates a missing reminder on start, or turns the setting off if permission was revoked. */
  syncReminder(): Promise<void>;
}

function reminderContent(language: LanguageCode): ReminderContent {
  return {
    title: translate(language, 'notifications.reminderTitle'),
    body: translate(language, 'notifications.reminderBody'),
    channelName: translate(language, 'notifications.channelName'),
    channelDescription: translate(language, 'notifications.channelDescription'),
  };
}

export function createAppActions(store: AppStore, services: ActionServices): AppActions {
  let lastTapAt = 0;

  const settings = () => store.getState().settings;
  const prayerActions = createPrayerActions(store, { ...services.prayer, now: services.now });

  const syncReminder = async (): Promise<void> => {
    const { reminder, language } = settings();
    const deliverable = await services.reminders.sync(
      reminder.enabled,
      reminder.hour,
      reminder.minute,
      reminderContent(language),
    );
    if (!deliverable && settings().reminder.enabled) {
      store.dispatch({
        type: 'updateSettings',
        patch: { reminder: { ...settings().reminder, enabled: false } },
      });
    }
  };

  return {
    ...prayerActions,

    tap() {
      const now = services.now();
      // Two taps within a few milliseconds are one finger bouncing, not two Dhikr.
      if (now - lastTapAt < MIN_TAP_INTERVAL_MS) return false;

      const before = store.getState().counter;
      store.dispatch({ type: 'tap', now, sessionId: createId(now) });
      const after = store.getState().counter;
      if (after.count === before.count) return false;

      lastTapAt = now;
      const completed = after.completedSessionId !== null;
      if (settings().hapticsEnabled) {
        if (completed) services.haptics.complete();
        else services.haptics.tap();
      }
      if (settings().soundEnabled) {
        if (completed) services.sound.complete();
        else services.sound.tick();
      }
      return true;
    },

    undo() {
      const before = store.getState().counter.count;
      store.dispatch({ type: 'undo', now: services.now() });
      if (store.getState().counter.count !== before && settings().hapticsEnabled) {
        services.haptics.selection();
      }
    },

    reset() {
      store.dispatch({ type: 'reset' });
    },

    startNewRound() {
      store.dispatch({ type: 'startNewRound' });
    },

    togglePause() {
      store.dispatch({ type: 'setPaused', paused: !store.getState().counter.paused });
    },

    selectDhikr(dhikrId) {
      store.dispatch({ type: 'selectDhikr', dhikrId });
    },

    setTarget(target) {
      if (!validateTarget(target).ok) return;
      store.dispatch({ type: 'setTarget', target });
    },

    updateSettings(patch) {
      store.dispatch({ type: 'updateSettings', patch });
      // The text of prayer notifications shows the time in the chosen format and language.
      if (patch.clockFormat !== undefined || patch.language !== undefined) {
        void prayerActions.syncPrayerAlerts();
      }
      // The daily reminder carries translated text too, so it is rewritten.
      if (patch.language !== undefined) {
        void syncReminder();
      }
    },

    completeOnboarding() {
      store.dispatch({ type: 'updateSettings', patch: { onboardingCompleted: true } });
    },

    saveCustomDhikr(input) {
      const { customDhikr } = store.getState();
      const existing = input.id ? customDhikr.find((dhikr) => dhikr.id === input.id) : undefined;
      if (!existing && customDhikr.length >= MAX_CUSTOM_DHIKR) {
        return { ok: false, limitReached: true };
      }

      const otherNames = listDhikr(customDhikr)
        .filter((dhikr) => dhikr.id !== existing?.id)
        .map((dhikr) => dhikr.name);
      const name = validateDhikrName(input.name, otherNames);
      const target = validateTarget(input.target);
      if (!name.ok || !target.ok) {
        return {
          ok: false,
          nameError: name.ok ? undefined : name.error,
          targetError: target.ok ? undefined : target.error,
        };
      }

      if (existing) {
        store.dispatch({
          type: 'updateCustomDhikr',
          id: existing.id,
          name: name.value,
          target: target.value,
        });
        return { ok: true, dhikr: { ...existing, name: name.value, target: target.value } };
      }

      const now = services.now();
      const dhikr: CustomDhikr = {
        id: `custom-${createId(now)}`,
        name: name.value,
        target: target.value,
        createdAt: now,
      };
      store.dispatch({ type: 'addCustomDhikr', dhikr });
      return { ok: true, dhikr };
    },

    deleteCustomDhikr(id) {
      store.dispatch({ type: 'deleteCustomDhikr', id });
    },

    clearHistory() {
      store.dispatch({ type: 'clearHistory' });
    },

    async enableReminder() {
      const { reminder, language } = settings();
      const result = await services.reminders.schedule(
        reminder.hour,
        reminder.minute,
        reminderContent(language),
      );
      store.dispatch({
        type: 'updateSettings',
        patch: { reminder: { ...settings().reminder, enabled: result === 'scheduled' } },
      });
      return result;
    },

    async disableReminder() {
      store.dispatch({
        type: 'updateSettings',
        patch: { reminder: { ...settings().reminder, enabled: false } },
      });
      await services.reminders.cancel();
    },

    async setReminderTime(hour, minute) {
      const enabled = settings().reminder.enabled;
      store.dispatch({ type: 'updateSettings', patch: { reminder: { enabled, hour, minute } } });
      if (!enabled) return 'saved';

      const result = await services.reminders.schedule(
        hour,
        minute,
        reminderContent(settings().language),
      );
      if (result !== 'scheduled') {
        store.dispatch({
          type: 'updateSettings',
          patch: { reminder: { ...settings().reminder, enabled: false } },
        });
      }
      return result;
    },

    syncReminder,
  };
}
