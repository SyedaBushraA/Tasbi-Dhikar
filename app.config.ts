import { existsSync } from 'fs';
import { join } from 'path';

import type { ExpoConfig } from 'expo/config';

/**
 * BEFORE PUBLISHING: replace this with a reverse-domain identifier that you own
 * (for example "com.yourcompany.tasbi"). It becomes the permanent Android
 * application id and iOS bundle identifier, and cannot be changed after the
 * first store release.
 */
const APP_IDENTIFIER = 'com.tasbiapp.dhikr';

const BRAND_GREEN = '#1F6F5C';
const SPLASH_LIGHT = '#F6F4EE';
const SPLASH_DARK = '#0F1815';

const LOCATION_PURPOSE = 'Your location is used to calculate prayer times.';

/**
 * Adhan recordings in assets/sounds are registered as notification sounds when
 * present (see constants/adhanAudio.ts). Only add recordings you have the
 * right to distribute. Full recordings: adhan.mp3 and optionally
 * adhan_fajr.mp3 (Android and playback in the app). iPhone notification
 * sounds must be at most 30 seconds: adhan_short.wav and optionally
 * adhan_fajr_short.wav.
 */
const ADHAN_SOUND_CANDIDATES = [
  'adhan.mp3',
  'adhan.wav',
  'adhan_fajr.mp3',
  'adhan_fajr.wav',
  'adhan_short.wav',
  'adhan_short.caf',
  'adhan_fajr_short.wav',
  'adhan_fajr_short.caf',
];
const adhanSounds = ADHAN_SOUND_CANDIDATES.filter((file) =>
  existsSync(join(__dirname, 'assets', 'sounds', file)),
);

const config: ExpoConfig = {
  name: 'Tasbi',
  slug: 'tasbi',
  description: 'A simple, peaceful, offline Dhikr counter and prayer times for the whole family.',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'tasbi',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: APP_IDENTIFIER,
    buildNumber: '1',
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      // Prayer times need no more than kilometre precision, so the app asks
      // for the approximate position, as it does on Android.
      NSLocationDefaultAccuracyReduced: true,
    },
  },
  android: {
    package: APP_IDENTIFIER,
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: BRAND_GREEN,
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    // Only what the app really needs: vibration for haptics; notifications for
    // the optional reminder and prayer alerts (kept across a restart of the
    // phone, and on time when the user allows exact alarms); approximate
    // location, once and only when the user asks for it, for prayer times.
    // SCHEDULE_EXACT_ALARM is kept deliberately: a prayer alert that arrives
    // minutes late is the wrong alert, and the prayer settings point the user
    // at the "Alarms & reminders" permission this asks for. It is the
    // permission the user grants, not the restricted USE_EXACT_ALARM.
    permissions: [
      'android.permission.VIBRATE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.ACCESS_COARSE_LOCATION',
    ],
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
    ],
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 160,
        resizeMode: 'contain',
        backgroundColor: SPLASH_LIGHT,
        dark: {
          image: './assets/images/splash-icon.png',
          backgroundColor: SPLASH_DARK,
        },
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: BRAND_GREEN,
        defaultChannel: 'daily-reminder',
        sounds: adhanSounds.map((file) => `./assets/sounds/${file}`),
      },
    ],
    [
      'expo-audio',
      {
        // Playback only (short sounds and the Adhan while the app is open):
        // no microphone, no background audio.
        microphonePermission: false,
        recordAudioAndroid: false,
        enableBackgroundPlayback: false,
        enableBackgroundRecording: false,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: LOCATION_PURPOSE,
        locationAlwaysAndWhenInUsePermission: false,
        locationAlwaysPermission: false,
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
  ],
  owner: 'bushra_syeda',
  extra: {
    /** Adhan files found in assets/sounds, read by the prayer notification service. */
    adhanSounds,
    eas: { projectId: 'a0549eb8-17e9-4989-80dd-a1ac3408dd55' },
  },
  experiments: {
    typedRoutes: true,
  },
};

export default config;
