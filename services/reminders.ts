import { Platform } from 'react-native';

import {
  type NotificationData,
  ensureNotificationPermission,
  hasNotificationPermission,
  loadNotifications,
} from './notifications';

/*
 * The daily Dhikr reminder is a local notification scheduled on the phone
 * itself. Nothing is sent to or received from a server.
 */
const REMINDER_ID = 'daily-dhikr-reminder';
const CHANNEL_ID = 'daily-reminder';

export type ReminderResult = 'scheduled' | 'denied' | 'failed';

export interface ReminderContent {
  title: string;
  body: string;
  channelName: string;
  channelDescription: string;
}

/** Schedules (or re-schedules) the reminder. Requests permission when needed. */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  content: ReminderContent,
): Promise<ReminderResult> {
  try {
    const Notifications = loadNotifications();
    if (!Notifications) return 'failed';

    if (Platform.OS === 'android') {
      // On Android 13+ the permission prompt only appears once a channel exists.
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: content.channelName,
        description: content.channelDescription,
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    if (!(await ensureNotificationPermission(Notifications, true))) return 'denied';

    const data: NotificationData = { kind: 'reminder' };
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined);
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID,
      content: { title: content.title, body: content.body, data },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
    return 'scheduled';
  } catch {
    return 'failed';
  }
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await loadNotifications()?.cancelScheduledNotificationAsync(REMINDER_ID);
  } catch {
    // Nothing was scheduled.
  }
}

/**
 * Brings the scheduled notification in line with the saved settings, for
 * example after a reinstall restored settings, or after the user revoked the
 * permission in the phone settings. Never prompts.
 *
 * @returns false if the reminder is enabled in settings but cannot be delivered.
 */
export async function syncDailyReminder(
  enabled: boolean,
  hour: number,
  minute: number,
  content: ReminderContent,
): Promise<boolean> {
  try {
    if (!enabled) {
      await cancelDailyReminder();
      return true;
    }
    const Notifications = loadNotifications();
    if (!Notifications || !(await hasNotificationPermission())) return false;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.some((request) => request.identifier === REMINDER_ID)) return true;
    return (await scheduleDailyReminder(hour, minute, content)) === 'scheduled';
  } catch {
    return false;
  }
}
