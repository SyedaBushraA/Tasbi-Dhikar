import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

export type Notifications = typeof NotificationsModule;

/**
 * Expo Go for Android ships without notification support, and the module
 * throws as soon as it is loaded there. It is therefore loaded on first use
 * and never in that environment, so the rest of the app keeps working.
 * Release builds always have it.
 */
export const notificationsAvailable = !(Platform.OS === 'android' && isRunningInExpoGo());

let notificationsModule: Notifications | null = null;

export function loadNotifications(): Notifications | null {
  if (!notificationsAvailable) return null;
  notificationsModule ??= require('expo-notifications') as Notifications;
  return notificationsModule;
}

/** Marks what a scheduled notification is for, so the app can react to it. */
export type NotificationKind = 'reminder' | 'prayer';

export interface NotificationData extends Record<string, unknown> {
  kind: NotificationKind;
}

export function notificationKind(data: unknown): NotificationKind | null {
  if (typeof data !== 'object' || data === null) return null;
  const kind = (data as Record<string, unknown>).kind;
  return kind === 'reminder' || kind === 'prayer' ? kind : null;
}

export interface ForegroundPresentation {
  /** Whether the notification's own sound plays while the app is open. */
  playSound: boolean;
}

/**
 * Decides how a notification is presented while the app is open. Registered
 * once at start; the prayer service replaces the default decision.
 */
let decidePresentation: (data: unknown) => ForegroundPresentation = () => ({ playSound: false });

export function setForegroundPresentation(decide: (data: unknown) => ForegroundPresentation): void {
  decidePresentation = decide;
}

/** Lets notifications show while the app is open. Call once when the app starts. */
export function configureNotificationHandler(): void {
  try {
    loadNotifications()?.setNotificationHandler({
      handleNotification: async (notification) => {
        const { playSound } = decidePresentation(notification.request.content.data);
        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: playSound,
          shouldSetBadge: false,
        };
      },
    });
  } catch {
    // Without a handler, notifications still arrive while the app is closed.
  }
}

function isGranted(
  Notifications: Notifications,
  permission: NotificationsModule.NotificationPermissionsStatus,
): boolean {
  return (
    permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

/**
 * Whether notifications may be shown. Asks the user only when `request` is
 * true and the question has not been answered before.
 */
export async function ensureNotificationPermission(
  Notifications: Notifications,
  request: boolean,
): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (isGranted(Notifications, current)) return true;
  if (!request || !current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return isGranted(Notifications, requested);
}

export async function hasNotificationPermission(): Promise<boolean> {
  const Notifications = loadNotifications();
  if (!Notifications) return false;
  try {
    return await ensureNotificationPermission(Notifications, false);
  } catch {
    return false;
  }
}
