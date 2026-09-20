import {
  ALERT_RESYNC_QUIET_MS,
  SALAH_ORDER,
  suggestedAsrMethod,
  suggestedMethod,
} from '@/constants/prayer';
import type {
  AsrMethod,
  CalculationMethodId,
  ClockFormat,
  LanguageCode,
  PrayerLocation,
  PrayerSettings,
  SalahName,
} from '@/types';

import type { PrayerSettingsPatch } from './reducer';
import type { AppStore } from './store';

export type LocateResult =
  | { status: 'ok'; location: PrayerLocation }
  /** The user refused the location permission. */
  | { status: 'denied' }
  /** Location services are off, or no position could be found. */
  | { status: 'unavailable' }
  | { status: 'failed' };

/** 'none': nothing needed scheduling (no location, or every prayer notification is off). */
export type PrayerAlertResult = 'scheduled' | 'none' | 'denied' | 'failed';

export interface PrayerAlertInput {
  prayer: PrayerSettings;
  clockFormat: ClockFormat;
  language: LanguageCode;
  now: number;
}

/** Device features for prayer times. Injected so the logic can be tested without a phone. */
export interface PrayerServices {
  /** One-time position of the phone. Asks for the location permission if needed. */
  locate(): Promise<LocateResult>;
  /**
   * Makes the scheduled prayer notifications match the settings: adds what is
   * missing, removes what no longer applies. Asks for the notification
   * permission only when `requestPermission` is true.
   */
  syncAlerts(input: PrayerAlertInput, options: { requestPermission: boolean }): Promise<PrayerAlertResult>;
  now(): number;
}

export interface PrayerActions {
  /** Changes prayer settings and brings the scheduled notifications up to date. */
  updatePrayerSettings(patch: PrayerSettingsPatch): void;
  /**
   * Stores the place prayer times are calculated for. Until the user has
   * confirmed a method, the method and Asr time suggested for the country are
   * preselected (not confirmed) so the method screen can offer them.
   */
  setPrayerLocation(location: PrayerLocation): void;
  /** Uses the position of the phone once. Only this asks for the location permission. */
  locateAutomatically(): Promise<LocateResult>;
  /** The user has chosen (or accepted) a calculation method and Asr time. */
  confirmCalculation(method: CalculationMethodId, asrMethod: AsrMethod): void;
  /**
   * Turns the notification of one prayer on or off. Turning one on asks for
   * the notification permission if needed; if it is refused the switch goes back off.
   */
  setPrayerNotification(prayer: SalahName, enabled: boolean): Promise<PrayerAlertResult>;
  /** The same for all five prayers at once. */
  setAllPrayerNotifications(enabled: boolean): Promise<PrayerAlertResult>;
  /**
   * Tops up scheduled notifications (they are planned a limited number of days
   * ahead). Call on start and when the app returns to the foreground. Never
   * prompts; turns the notifications off if the permission was revoked and
   * marks them as blocked, so the prayer settings can explain it.
   */
  syncPrayerAlerts(): Promise<void>;
}

export interface PrayerActionOptions {
  /** Quiet period before changed settings rewrite what is scheduled. */
  resyncQuietMs?: number;
}

/** Changes that do not affect what is scheduled. */
const LOCAL_ONLY_FIELDS: ReadonlySet<keyof PrayerSettingsPatch> = new Set([
  'adhanVolume',
  'alertsBlocked',
]);

function allSalah(value: boolean): Record<SalahName, boolean> {
  const result = {} as Record<SalahName, boolean>;
  for (const name of SALAH_ORDER) result[name] = value;
  return result;
}

export function createPrayerActions(
  store: AppStore,
  services: PrayerServices,
  options: PrayerActionOptions = {},
): PrayerActions {
  const resyncQuietMs = options.resyncQuietMs ?? ALERT_RESYNC_QUIET_MS;
  // Syncs run one after another; changes made meanwhile are covered by one more run.
  let running: Promise<PrayerAlertResult> | null = null;
  let rerun = false;
  let quietTimer: ReturnType<typeof setTimeout> | null = null;

  function alertInput(): PrayerAlertInput {
    const { prayer, settings } = store.getState();
    return {
      prayer,
      clockFormat: settings.clockFormat,
      language: settings.language,
      now: services.now(),
    };
  }

  async function runSync(requestPermission: boolean): Promise<PrayerAlertResult> {
    let result: PrayerAlertResult;
    do {
      rerun = false;
      try {
        result = await services.syncAlerts(alertInput(), { requestPermission });
      } catch {
        result = 'failed';
      }
      // A permission question is asked once, not again for the follow-up run.
      requestPermission = false;
    } while (rerun);
    return result;
  }

  function sync(requestPermission = false): Promise<PrayerAlertResult> {
    if (running) {
      rerun = true;
      return running;
    }
    running = runSync(requestPermission).finally(() => {
      running = null;
    });
    return running;
  }

  /**
   * A sync after a short quiet period, for settings the user changes a step at
   * a time. Every alert carries its time in its identifier, so each step would
   * otherwise cancel and re-create every scheduled notification.
   */
  function syncAfterQuiet(): void {
    if (quietTimer !== null) clearTimeout(quietTimer);
    quietTimer = setTimeout(() => {
      quietTimer = null;
      void sync();
    }, resyncQuietMs);
  }

  function update(patch: PrayerSettingsPatch): void {
    store.dispatch({ type: 'updatePrayer', patch });
  }

  async function setNotifications(
    changes: Partial<Record<SalahName, boolean>>,
  ): Promise<PrayerAlertResult> {
    const turningOn = Object.values(changes).some(Boolean);
    const before = store.getState().prayer.notifications;
    // The user is choosing their alerts again, so a withdrawn permission is no
    // longer news: what happens now is answered by this very attempt.
    update({ notifications: changes, alertsBlocked: false });

    // A permission question must not be merged into a sync that is already running.
    if (running) await running;
    const result = await sync(turningOn);

    if (turningOn && (result === 'denied' || result === 'failed')) {
      // Keep the switches truthful: without permission nothing will arrive.
      const revert: Partial<Record<SalahName, boolean>> = {};
      for (const name of Object.keys(changes) as SalahName[]) revert[name] = before[name];
      update({ notifications: revert });
    }
    return result;
  }

  function setPrayerLocation(location: PrayerLocation): void {
    const { prayer } = store.getState();
    const suggestion: PrayerSettingsPatch = prayer.methodConfirmed
      ? {}
      : {
          method: suggestedMethod(location.countryCode),
          asrMethod: suggestedAsrMethod(location.countryCode),
        };
    update({ location, ...suggestion });
    void sync();
  }

  return {
    updatePrayerSettings(patch) {
      update(patch);
      const affectsAlerts = (Object.keys(patch) as (keyof PrayerSettingsPatch)[]).some(
        (key) => !LOCAL_ONLY_FIELDS.has(key),
      );
      if (affectsAlerts) syncAfterQuiet();
    },

    setPrayerLocation,

    async locateAutomatically() {
      let result: LocateResult;
      try {
        result = await services.locate();
      } catch {
        result = { status: 'failed' };
      }
      if (result.status === 'ok') setPrayerLocation(result.location);
      return result;
    },

    confirmCalculation(method, asrMethod) {
      update({ method, asrMethod, methodConfirmed: true });
      void sync();
    },

    setPrayerNotification(prayer, enabled) {
      return setNotifications({ [prayer]: enabled });
    },

    setAllPrayerNotifications(enabled) {
      return setNotifications(allSalah(enabled));
    },

    async syncPrayerAlerts() {
      const result = await sync(false);
      const { notifications } = store.getState().prayer;
      if (result === 'denied' && Object.values(notifications).some(Boolean)) {
        // Nothing can arrive any more, so the choices go off rather than lie.
        // The mark is what lets the settings say why they are gone.
        update({ notifications: allSalah(false), alertsBlocked: true });
      }
    },
  };
}
