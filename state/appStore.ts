import { completionFeedback, selectionFeedback, tapFeedback } from '@/services/haptics';
import { locateDevice } from '@/services/location';
import { syncPrayerAlerts } from '@/services/prayerNotifications';
import { cancelDailyReminder, scheduleDailyReminder, syncDailyReminder } from '@/services/reminders';
import { playComplete, playTick } from '@/services/sound';
import { appStorage } from '@/storage/appStorage';

import { type ActionServices, createAppActions } from './actions';
import { createAppStore } from './store';

const deviceServices: ActionServices = {
  haptics: { tap: tapFeedback, complete: completionFeedback, selection: selectionFeedback },
  sound: { tick: playTick, complete: playComplete },
  reminders: {
    schedule: scheduleDailyReminder,
    cancel: cancelDailyReminder,
    sync: syncDailyReminder,
  },
  prayer: {
    locate: locateDevice,
    syncAlerts: syncPrayerAlerts,
  },
  now: () => Date.now(),
};

/** The one store of the running app, backed by the storage of the phone. */
export const appStore = createAppStore(appStorage);
export const appActions = createAppActions(appStore, deviceServices);
