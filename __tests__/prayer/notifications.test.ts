import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  MAX_PENDING_NOTIFICATIONS,
  PRAYER_NOTIFICATION_PREFIX,
  PRAYER_SCHEDULE_DAYS,
  RESERVED_NOTIFICATIONS,
} from '@/constants/prayer';
import { translate } from '@/i18n';
import { adhanNotificationSounds, syncPrayerAlerts } from '@/services/prayerNotifications';
import type { PrayerAlertInput } from '@/state/prayerActions';
import type { PrayerSettings } from '@/types';
import { formatTimeOfDay } from '@/utils/prayer';
import { type AdhanSoundAvailability, planPrayerAlerts } from '@/utils/prayerSchedule';

import { at, meridianPlace, prayerSettings } from '../helpers/prayer';

jest.mock('expo', () => ({ isRunningInExpoGo: () => false }));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { adhanSounds: [] } } },
}));

jest.mock('expo-notifications', () => ({
  getAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  AndroidNotificationPriority: { HIGH: 'high' },
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
  ios?: { status: number };
}

interface ScheduleRequest {
  identifier?: string;
  content: {
    title: string;
    body: string;
    data: { kind: string; prayer: string; adhan: string | null };
    sound: string;
    priority: string;
  };
  trigger: { type: string; date: number; channelId: string };
}

interface ChannelRequest {
  name: string;
  description: string;
  importance: number;
  sound?: string;
}

interface NotificationsMock {
  getAllScheduledNotificationsAsync: jest.Mock<Promise<{ identifier: string }[]>, []>;
  scheduleNotificationAsync: jest.Mock<Promise<string>, [ScheduleRequest]>;
  cancelScheduledNotificationAsync: jest.Mock<Promise<void>, [string]>;
  setNotificationChannelAsync: jest.Mock<Promise<null>, [string, ChannelRequest]>;
  getPermissionsAsync: jest.Mock<Promise<PermissionState>, []>;
  requestPermissionsAsync: jest.Mock<Promise<PermissionState>, [unknown]>;
}

const notifications = jest.requireMock<NotificationsMock>('expo-notifications');

const DAY_KEY = '2026-09-20';
const PLACE = meridianPlace(DAY_KEY);
/** Before the first prayer of the day, so a whole day is still ahead. */
const NOW = at(9, 20, 1);
const REMINDER_ID = 'daily-dhikr-reminder';
const NO_SOUNDS: AdhanSoundAvailability = { standard: false, fajr: false };

const fajrOnly = prayerSettings({ location: PLACE, notifications: { fajr: true } });

function setPlatform(os: 'ios' | 'android'): void {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true, writable: true });
}

/** Pretends these Adhan files were bundled with the app. */
function bundleSounds(files: readonly string[]): void {
  Object.defineProperty(Constants, 'expoConfig', {
    value: { extra: { adhanSounds: [...files] } },
    configurable: true,
    writable: true,
  });
}

interface FakeScheduler {
  identifiers(): string[];
  request(identifier: string): ScheduleRequest | undefined;
}

/** The notifications the phone currently holds, as the service sees them. */
function fakeScheduler(existing: readonly string[] = []): FakeScheduler {
  const identifiers = new Set<string>(existing);
  const requests = new Map<string, ScheduleRequest>();

  notifications.getAllScheduledNotificationsAsync.mockImplementation(() =>
    Promise.resolve([...identifiers].map((identifier) => ({ identifier }))),
  );
  notifications.scheduleNotificationAsync.mockImplementation((request) => {
    const identifier = request.identifier ?? '';
    identifiers.add(identifier);
    requests.set(identifier, request);
    return Promise.resolve(identifier);
  });
  notifications.cancelScheduledNotificationAsync.mockImplementation((identifier) => {
    identifiers.delete(identifier);
    requests.delete(identifier);
    return Promise.resolve();
  });

  return {
    identifiers: () => [...identifiers],
    request: (identifier) => requests.get(identifier),
  };
}

function input(prayer: PrayerSettings, now = NOW): PrayerAlertInput {
  return { prayer, clockFormat: '12h', language: 'en', now };
}

/** The alerts the service is expected to work from. */
function expectedPlan(prayer: PrayerSettings, sounds: AdhanSoundAvailability = NO_SOUNDS) {
  return planPrayerAlerts(prayer, NOW, {
    days: PRAYER_SCHEDULE_DAYS,
    maxAlerts: MAX_PENDING_NOTIFICATIONS - RESERVED_NOTIFICATIONS,
    sounds,
    clockFormat: '12h',
    language: 'en',
  });
}

function prayerName(prayer: 'fajr' | 'dhuhr'): string {
  return translate('en', prayer === 'fajr' ? 'prayer.names.fajr' : 'prayer.names.dhuhr');
}

beforeEach(() => {
  setPlatform('ios');
  bundleSounds([]);
  fakeScheduler();
  notifications.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: false });
  notifications.requestPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: false });
  notifications.setNotificationChannelAsync.mockResolvedValue(null);
});

afterEach(() => {
  setPlatform('ios');
});

describe('adhanNotificationSounds', () => {
  it('finds nothing while no recording is bundled', () => {
    expect(adhanNotificationSounds()).toEqual({ standard: false, fajr: false });
  });

  it('needs a short clip on iPhones, where a long recording cannot be used', () => {
    bundleSounds(['adhan.mp3', 'adhan_fajr.mp3']);
    expect(adhanNotificationSounds()).toEqual({ standard: false, fajr: false });

    bundleSounds(['adhan_short.wav']);
    expect(adhanNotificationSounds()).toEqual({ standard: true, fajr: false });

    bundleSounds(['adhan_short.caf', 'adhan_fajr_short.wav']);
    expect(adhanNotificationSounds()).toEqual({ standard: true, fajr: true });
  });

  it('uses the full recording on Android', () => {
    setPlatform('android');

    bundleSounds(['adhan_short.wav']);
    expect(adhanNotificationSounds()).toEqual({ standard: false, fajr: false });

    bundleSounds(['adhan.mp3']);
    expect(adhanNotificationSounds()).toEqual({ standard: true, fajr: false });

    bundleSounds(['adhan.wav', 'adhan_fajr.mp3']);
    expect(adhanNotificationSounds()).toEqual({ standard: true, fajr: true });
  });
});

describe('syncPrayerAlerts with nothing to schedule', () => {
  it('clears the prayer notifications and leaves the daily reminder alone', async () => {
    const stale = `${PRAYER_NOTIFICATION_PREFIX}2026-09-01-fajr-1756000000000-plain-12hen`;
    const scheduler = fakeScheduler([stale, REMINDER_ID]);

    await expect(
      syncPrayerAlerts(input(prayerSettings({ location: PLACE })), { requestPermission: true }),
    ).resolves.toBe('none');

    expect(scheduler.identifiers()).toEqual([REMINDER_ID]);
    expect(notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('does the same while no place has been chosen', async () => {
    const scheduler = fakeScheduler([REMINDER_ID]);
    const noPlace = prayerSettings({ notifications: { fajr: true } });

    await expect(syncPrayerAlerts(input(noPlace), { requestPermission: false })).resolves.toBe(
      'none',
    );
    expect(scheduler.identifiers()).toEqual([REMINDER_ID]);
  });
});

describe('syncPrayerAlerts and the notification permission', () => {
  it('does not ask a question it was not allowed to ask', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });

    await expect(syncPrayerAlerts(input(fajrOnly), { requestPermission: false })).resolves.toBe(
      'denied',
    );
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('asks once and schedules after a yes', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    notifications.requestPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: false });

    await expect(syncPrayerAlerts(input(fajrOnly), { requestPermission: true })).resolves.toBe(
      'scheduled',
    );
    expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  it('schedules nothing after a no', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    notifications.requestPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });

    await expect(syncPrayerAlerts(input(fajrOnly), { requestPermission: true })).resolves.toBe(
      'denied',
    );
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('never asks again once the phone says the question is closed', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });

    await expect(syncPrayerAlerts(input(fajrOnly), { requestPermission: true })).resolves.toBe(
      'denied',
    );
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('syncPrayerAlerts scheduling', () => {
  it('schedules one dated notification for every planned prayer', async () => {
    const scheduler = fakeScheduler();
    const plan = expectedPlan(fajrOnly);
    const first = plan[0];
    expect(plan.length).toBe(PRAYER_SCHEDULE_DAYS);
    expect(first).toBeDefined();
    if (!first) return;

    await expect(syncPrayerAlerts(input(fajrOnly), { requestPermission: false })).resolves.toBe(
      'scheduled',
    );

    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(plan.length);
    expect(scheduler.identifiers().sort()).toEqual(plan.map((alert) => alert.identifier).sort());

    const request = scheduler.request(first.identifier);
    expect(request?.trigger).toEqual({
      type: 'date',
      date: first.time,
      channelId: 'prayer-times',
    });
    expect(request?.content.title).toBe(prayerName('fajr'));
    expect(request?.content.body).toContain(prayerName('fajr'));
    expect(request?.content.body).toContain(
      formatTimeOfDay(first.time, '12h', {
        am: translate('en', 'prayer.am'),
        pm: translate('en', 'prayer.pm'),
      }),
    );
    expect(request?.content.data).toEqual({ kind: 'prayer', prayer: 'fajr', adhan: null });
    expect(request?.content.sound).toBe('default');
  });

  it('changes nothing on a second run with the same settings', async () => {
    await syncPrayerAlerts(input(fajrOnly), { requestPermission: false });
    notifications.scheduleNotificationAsync.mockClear();
    notifications.cancelScheduledNotificationAsync.mockClear();

    await expect(syncPrayerAlerts(input(fajrOnly), { requestPermission: false })).resolves.toBe(
      'scheduled',
    );
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  it('replaces every notification after the user adjusts a time', async () => {
    const scheduler = fakeScheduler();
    await syncPrayerAlerts(input(fajrOnly), { requestPermission: false });
    const before = scheduler.identifiers();
    notifications.scheduleNotificationAsync.mockClear();
    notifications.cancelScheduledNotificationAsync.mockClear();

    const adjusted = prayerSettings({
      location: PLACE,
      notifications: { fajr: true },
      adjustments: { fajr: 4 },
    });
    await syncPrayerAlerts(input(adjusted), { requestPermission: false });

    expect(
      notifications.cancelScheduledNotificationAsync.mock.calls.map((call) => call[0]).sort(),
    ).toEqual([...before].sort());
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(before.length);
    expect(scheduler.identifiers().sort()).toEqual(
      expectedPlan(adjusted)
        .map((alert) => alert.identifier)
        .sort(),
    );
  });

  it('keeps the daily reminder while replacing prayer notifications', async () => {
    const scheduler = fakeScheduler([REMINDER_ID]);
    await syncPrayerAlerts(input(fajrOnly), { requestPermission: false });

    const later = prayerSettings({
      location: PLACE,
      notifications: { fajr: true },
      adjustments: { fajr: 6 },
    });
    await syncPrayerAlerts(input(later), { requestPermission: false });

    expect(scheduler.identifiers()).toContain(REMINDER_ID);
    expect(notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith(REMINDER_ID);
  });

  it('reports a failure when the phone refuses to answer', async () => {
    notifications.getAllScheduledNotificationsAsync.mockRejectedValue(new Error('unavailable'));

    await expect(syncPrayerAlerts(input(fajrOnly), { requestPermission: false })).resolves.toBe(
      'failed',
    );
  });
});

describe('syncPrayerAlerts and the Adhan', () => {
  const adhanOn = prayerSettings({
    location: PLACE,
    notifications: { fajr: true, dhuhr: true },
    adhanEnabled: true,
  });

  it('gives each recording its own channel on Android, before asking anything', async () => {
    setPlatform('android');
    bundleSounds(['adhan.mp3', 'adhan_fajr.mp3']);
    fakeScheduler();
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    notifications.requestPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: false });

    await expect(syncPrayerAlerts(input(adhanOn), { requestPermission: true })).resolves.toBe(
      'scheduled',
    );

    const channels = notifications.setNotificationChannelAsync.mock.calls;
    expect(channels.map((call) => call[0])).toEqual([
      'prayer-times',
      'prayer-adhan',
      'prayer-adhan-fajr',
    ]);
    expect(channels[0]?.[1].sound).toBe('default');
    expect(channels[1]?.[1].sound).toBe('adhan.mp3');
    expect(channels[2]?.[1].sound).toBe('adhan_fajr.mp3');

    const firstChannel =
      notifications.setNotificationChannelAsync.mock.invocationCallOrder[0] ??
      Number.MAX_SAFE_INTEGER;
    expect(firstChannel).toBeLessThan(notifications.getPermissionsAsync.mock.invocationCallOrder[0] ?? 0);
    expect(firstChannel).toBeLessThan(
      notifications.requestPermissionsAsync.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('sends each prayer to the channel of the recording it plays', async () => {
    setPlatform('android');
    bundleSounds(['adhan.mp3', 'adhan_fajr.mp3']);
    const scheduler = fakeScheduler();
    const plan = expectedPlan(adhanOn, { standard: true, fajr: true });

    await syncPrayerAlerts(input(adhanOn), { requestPermission: false });

    const fajr = plan.find((alert) => alert.prayer === 'fajr');
    const dhuhr = plan.find((alert) => alert.prayer === 'dhuhr');
    expect(fajr).toBeDefined();
    expect(dhuhr).toBeDefined();
    if (!fajr || !dhuhr) return;

    expect(scheduler.request(fajr.identifier)?.trigger.channelId).toBe('prayer-adhan-fajr');
    expect(scheduler.request(fajr.identifier)?.content.data).toEqual({
      kind: 'prayer',
      prayer: 'fajr',
      adhan: 'fajr',
    });
    expect(scheduler.request(dhuhr.identifier)?.trigger.channelId).toBe('prayer-adhan');
    expect(scheduler.request(dhuhr.identifier)?.content.title).toBe(prayerName('dhuhr'));
  });

  it('names the clip as the sound on iPhones', async () => {
    bundleSounds(['adhan_short.wav']);
    const scheduler = fakeScheduler();
    const plan = expectedPlan(adhanOn, { standard: true, fajr: false });
    const first = plan[0];
    expect(first).toBeDefined();
    if (!first) return;

    await syncPrayerAlerts(input(adhanOn), { requestPermission: false });

    expect(scheduler.request(first.identifier)?.content.sound).toBe('adhan_short.wav');
    expect(scheduler.request(first.identifier)?.content.data).toEqual({
      kind: 'prayer',
      prayer: 'fajr',
      adhan: 'standard',
    });
    expect(notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });

  it('keeps the normal notification sound while the Adhan is off', async () => {
    bundleSounds(['adhan_short.wav']);
    const scheduler = fakeScheduler();
    const plan = expectedPlan(fajrOnly, { standard: true, fajr: false });
    const first = plan[0];
    expect(first).toBeDefined();
    if (!first) return;

    await syncPrayerAlerts(input(fajrOnly), { requestPermission: false });

    expect(scheduler.request(first.identifier)?.content.sound).toBe('default');
    expect(scheduler.request(first.identifier)?.trigger.channelId).toBe('prayer-times');
  });
});
