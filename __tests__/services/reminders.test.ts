import { Platform } from 'react-native';

import { type ReminderContent, syncDailyReminder } from '@/services/reminders';

jest.mock('expo', () => ({ isRunningInExpoGo: () => false }));

jest.mock('expo-notifications', () => ({
  getAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily' },
  IosAuthorizationStatus: {
    NOT_DETERMINED: 0,
    DENIED: 1,
    AUTHORIZED: 2,
    PROVISIONAL: 3,
    EPHEMERAL: 4,
  },
}));

interface PermissionState {
  granted: boolean;
  canAskAgain: boolean;
}

interface ScheduleRequest {
  identifier?: string;
  content: { title: string; body: string; data: { kind: string } };
  trigger: { type: string; hour: number; minute: number; channelId: string };
}

interface ScheduledNotification {
  identifier: string;
  content: { title: string | null; body: string | null };
}

interface NotificationsMock {
  getAllScheduledNotificationsAsync: jest.Mock<Promise<ScheduledNotification[]>, []>;
  scheduleNotificationAsync: jest.Mock<Promise<string>, [ScheduleRequest]>;
  cancelScheduledNotificationAsync: jest.Mock<Promise<void>, [string]>;
  setNotificationChannelAsync: jest.Mock<Promise<null>, [string, unknown]>;
  getPermissionsAsync: jest.Mock<Promise<PermissionState>, []>;
  requestPermissionsAsync: jest.Mock<Promise<PermissionState>, [unknown]>;
}

const notifications = jest.requireMock<NotificationsMock>('expo-notifications');

const REMINDER_ID = 'daily-dhikr-reminder';

const ENGLISH: ReminderContent = {
  title: 'Time for Dhikr',
  body: 'A quiet moment to remember Allah.',
  channelName: 'Daily reminder',
  channelDescription: 'Your daily Dhikr reminder.',
};

/** The same reminder as it reads after the user switched language. */
const OTHER_LANGUAGE: ReminderContent = {
  title: 'Waqt-e-Zikr',
  body: 'Allah ko yaad karne ka waqt.',
  channelName: 'Rozana yaad dihani',
  channelDescription: 'Aap ki rozana Zikr yaad dihani.',
};

function alreadyScheduled(content: ReminderContent | null): void {
  notifications.getAllScheduledNotificationsAsync.mockResolvedValue(
    content === null
      ? []
      : [{ identifier: REMINDER_ID, content: { title: content.title, body: content.body } }],
  );
}

beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true, writable: true });
  notifications.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
  notifications.requestPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
  notifications.setNotificationChannelAsync.mockResolvedValue(null);
  notifications.scheduleNotificationAsync.mockResolvedValue(REMINDER_ID);
  notifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
  alreadyScheduled(null);
});

describe('syncDailyReminder', () => {
  it('cancels the reminder that is turned off', async () => {
    await expect(syncDailyReminder(false, 20, 0, ENGLISH)).resolves.toBe(true);

    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(REMINDER_ID);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('puts a missing reminder back in place', async () => {
    await expect(syncDailyReminder(true, 6, 30, ENGLISH)).resolves.toBe(true);

    const request = notifications.scheduleNotificationAsync.mock.calls[0]?.[0];
    expect(request?.content.title).toBe(ENGLISH.title);
    expect(request?.trigger).toMatchObject({ hour: 6, minute: 30 });
  });

  it('leaves a reminder that already says the right thing alone', async () => {
    alreadyScheduled(ENGLISH);

    await expect(syncDailyReminder(true, 6, 30, ENGLISH)).resolves.toBe(true);

    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('rewrites a reminder left over from another language', async () => {
    alreadyScheduled(ENGLISH);

    await expect(syncDailyReminder(true, 6, 30, OTHER_LANGUAGE)).resolves.toBe(true);

    const request = notifications.scheduleNotificationAsync.mock.calls[0]?.[0];
    expect(request?.content.title).toBe(OTHER_LANGUAGE.title);
    expect(request?.content.body).toBe(OTHER_LANGUAGE.body);
  });

  it('never asks for permission it does not have', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });

    await expect(syncDailyReminder(true, 6, 30, ENGLISH)).resolves.toBe(false);

    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
