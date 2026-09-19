import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  MAX_PENDING_NOTIFICATIONS,
  PRAYER_NOTIFICATION_PREFIX,
  PRAYER_SCHEDULE_DAYS,
  RESERVED_NOTIFICATIONS,
} from '@/constants/prayer';
import { translate } from '@/i18n';
import type { PrayerAlertInput, PrayerAlertResult } from '@/state/prayerActions';
import type { LanguageCode, SalahName } from '@/types';
import { formatTimeOfDay } from '@/utils/prayer';
import {
  type AdhanChoice,
  type AdhanSoundAvailability,
  type PlannedPrayerAlert,
  diffPrayerAlerts,
  planPrayerAlerts,
} from '@/utils/prayerSchedule';

import { type NotificationData, type Notifications, ensureNotificationPermission, loadNotifications } from './notifications';

/*
 * Prayer notifications are ordinary local notifications at the calculated
 * time of each prayer. The Adhan, when chosen, is the notification's sound:
 * that is what Android and iOS allow while the app is closed. The phone
 * decides how loud it is and how long it may play (iOS: at most 30 seconds).
 */

const CHANNELS = {
  plain: 'prayer-times',
  standard: 'prayer-adhan',
  fajr: 'prayer-adhan-fajr',
} as const;

function channelFor(adhan: AdhanChoice): string {
  return adhan ? CHANNELS[adhan] : CHANNELS.plain;
}

function bundledSounds(): readonly string[] {
  const sounds = (Constants.expoConfig?.extra as { adhanSounds?: unknown } | undefined)?.adhanSounds;
  return Array.isArray(sounds) ? sounds.filter((file): file is string => typeof file === 'string') : [];
}

/** The file used as notification sound for a recording on this platform, if bundled. */
function soundFile(choice: 'standard' | 'fajr'): string | null {
  // Expo Go cannot play sounds that are not part of Expo Go itself.
  if (isRunningInExpoGo()) return null;
  const base = choice === 'fajr' ? 'adhan_fajr' : 'adhan';
  const candidates =
    Platform.OS === 'ios'
      ? [`${base}_short.wav`, `${base}_short.caf`]
      : [`${base}.mp3`, `${base}.wav`];
  const files = bundledSounds();
  return candidates.find((file) => files.includes(file)) ?? null;
}

/** Which Adhan recordings can be used as notification sound on this phone. */
export function adhanNotificationSounds(): AdhanSoundAvailability {
  return { standard: soundFile('standard') !== null, fajr: soundFile('fajr') !== null };
}

async function ensureChannels(Notifications: Notifications, language: LanguageCode): Promise<void> {
  if (Platform.OS !== 'android') return;
  const importance = Notifications.AndroidImportance.HIGH;
  await Notifications.setNotificationChannelAsync(CHANNELS.plain, {
    name: translate(language, 'notifications.prayerChannelName'),
    description: translate(language, 'notifications.prayerChannelDescription'),
    importance,
    sound: 'default',
  });
  // A channel's sound cannot change later, so each recording has its own channel.
  const standard = soundFile('standard');
  if (standard) {
    await Notifications.setNotificationChannelAsync(CHANNELS.standard, {
      name: translate(language, 'notifications.adhanChannelName'),
      description: translate(language, 'notifications.adhanChannelDescription'),
      importance,
      sound: standard,
    });
  }
  const fajr = soundFile('fajr');
  if (fajr) {
    await Notifications.setNotificationChannelAsync(CHANNELS.fajr, {
      name: translate(language, 'notifications.adhanFajrChannelName'),
      description: translate(language, 'notifications.adhanFajrChannelDescription'),
      importance,
      sound: fajr,
    });
  }
}

export interface PrayerNotificationData extends NotificationData {
  kind: 'prayer';
  prayer: SalahName;
  adhan: AdhanChoice;
}

async function schedule(
  Notifications: Notifications,
  alert: PlannedPrayerAlert,
  input: PrayerAlertInput,
): Promise<void> {
  const { language, clockFormat } = input;
  const prayerName = translate(language, `prayer.names.${alert.prayer}`);
  const time = formatTimeOfDay(alert.time, clockFormat, {
    am: translate(language, 'prayer.am'),
    pm: translate(language, 'prayer.pm'),
  });
  const data: PrayerNotificationData = { kind: 'prayer', prayer: alert.prayer, adhan: alert.adhan };

  await Notifications.scheduleNotificationAsync({
    identifier: alert.identifier,
    content: {
      title: translate(language, 'notifications.prayerTitle', { prayer: prayerName }),
      body: translate(language, 'notifications.prayerBody', { prayer: prayerName, time }),
      data,
      // Android takes the sound from the channel; iOS from the content.
      sound: alert.adhan ? (soundFile(alert.adhan) ?? 'default') : 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: alert.time,
      channelId: channelFor(alert.adhan),
    },
  });
}

async function cancelAll(Notifications: Notifications, identifiers: readonly string[]): Promise<void> {
  await Promise.all(
    identifiers.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)),
  );
}

/** Makes the scheduled prayer notifications match the settings. */
export async function syncPrayerAlerts(
  input: PrayerAlertInput,
  options: { requestPermission: boolean },
): Promise<PrayerAlertResult> {
  const Notifications = loadNotifications();
  if (!Notifications) return 'failed';

  try {
    const plan = planPrayerAlerts(input.prayer, input.now, {
      days: PRAYER_SCHEDULE_DAYS,
      maxAlerts: MAX_PENDING_NOTIFICATIONS - RESERVED_NOTIFICATIONS,
      sounds: adhanNotificationSounds(),
      clockFormat: input.clockFormat,
      language: input.language,
    });

    const scheduled = (await Notifications.getAllScheduledNotificationsAsync()).map(
      (request) => request.identifier,
    );

    if (plan.length === 0) {
      await cancelAll(
        Notifications,
        scheduled.filter((id) => id.startsWith(PRAYER_NOTIFICATION_PREFIX)),
      );
      return 'none';
    }

    // On Android 13+ the permission question only appears once a channel exists.
    await ensureChannels(Notifications, input.language);
    if (!(await ensureNotificationPermission(Notifications, options.requestPermission))) {
      return 'denied';
    }

    const changes = diffPrayerAlerts(scheduled, plan);
    await cancelAll(Notifications, changes.cancel);
    for (const alert of changes.schedule) await schedule(Notifications, alert, input);
    return 'scheduled';
  } catch {
    return 'failed';
  }
}
