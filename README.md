# Tasbi

A simple, peaceful Dhikr counter and prayer times app for Android and iOS. Open the app, tap, and the count goes up; the prayer tab shows today's times for your place and can remind you with a notification and the Adhan. It is made to be comfortable for children, adults and elderly users, and it works completely offline.

## Features

- Large tap counter with progress, remaining count, undo, reset (with confirmation) and pause
- Six built-in Dhikr, plus your own custom Dhikr with their own targets
- Targets of 10, 33, 99, 100, 1000 or any custom number
- Completion feedback, and every completed round is saved to History
- History grouped by day, and Statistics (today, this week, total, sessions, streak)
- Prayer times for your place, calculated on the phone, with the next prayer and a countdown
- Calculation method, Asr time and per-prayer manual adjustments, all in your hands
- A notification per prayer, each one switched on or off separately
- Optional Adhan as the notification sound, with a separate Fajr recording when one is added
- Easy Mode: very large number and tap area, fewer buttons
- Light, dark and system appearance, and 12-hour or 24-hour times
- Optional haptic feedback and sound
- Optional daily reminder (a local notification, no server)
- First-launch setup that can be skipped
- No account, no ads, no analytics, no network access: all data stays on the phone

## Technology

Expo SDK 57, React Native, TypeScript (strict), Expo Router, AsyncStorage, Expo Haptics, Expo Notifications, Expo Audio, Expo Location, the `adhan` prayer-time library, React Native StyleSheet. Tests use Jest (jest-expo) and React Native Testing Library.

## Project structure

```
app/          Screens and navigation (Expo Router)
components/   Reusable UI (ui/) and feature components
hooks/        Theme, translation, Dhikr, statistics and prayer hooks
state/        Store, reducer and actions
storage/      The only code that touches AsyncStorage, including data validation
services/     Haptics, sound, location, notifications and Adhan playback
utils/        Pure logic: counter, statistics, history, dates, prayer times, validation
i18n/         Languages and translations
constants/    Dhikr, targets, defaults, theme, prayer settings and the offline city list
types/        Shared TypeScript types
assets/       Icons, splash image and sounds
__tests__/    Unit and component tests
```

## Install

Requires Node.js 20 or newer.

```
npm install
```

## Run

```
npx expo start          # development server
npx expo run:android    # build and run on an Android device or emulator
npx expo run:ios        # build and run on an iOS simulator or device (macOS only)
```

`run:android` needs Android Studio (SDK and an emulator or a device with USB debugging). `run:ios` needs Xcode. Notifications, the Adhan and sound must be tested in a build made with `run:android`, `run:ios` or EAS: Expo Go on Android has no notification support at all, and custom notification sounds never work in Expo Go.

## Test

```
npm run typecheck
npm run lint
npm test
```

## Permissions and why

| Permission | When it is asked for | What it is used for |
| --- | --- | --- |
| Notifications | Only when the user turns on the daily reminder or a prayer notification | Local notifications at the chosen times |
| Approximate location (foreground) | Only when the user taps the button to use their location | Read once to calculate prayer times; never followed, never sent anywhere |
| Exact alarms (Android 12+) | Declared, granted by the user in the phone settings | Prayer notifications that arrive at the minute of the prayer |
| Vibration | Not asked for | Haptic feedback per count |

Precise location, background location, microphone and storage are blocked in `app.config.ts`. Coordinates are rounded to three decimals before they are stored, and the place name comes from the offline city list, so no address lookup happens.

## How prayer times are calculated

Times are calculated on the phone with [`adhan`](https://github.com/batoulapps/adhan-js) (Batoul Apps, MIT License) from the coordinates of the chosen place. Nothing is hard-coded per city and nothing is fetched.

- **Method**: twelve calculation methods (Muslim World League, Karachi, Umm al-Qura, Egyptian, ISNA and others). The app suggests the one most used in the country of the chosen place, but the user always sees and confirms it, because local mosques may differ.
- **Asr**: standard (Shafi'i, Maliki, Hanbali) or Hanafi.
- **Manual adjustments**: -60 to +60 minutes per prayer, to match the local mosque. The adjusted time is the time the app shows, notifies at and plays the Adhan at.
- **Location**: automatic (once, approximate), a city from the offline list, or coordinates typed by hand. The city list comes from [GeoNames](https://www.geonames.org) (CC BY 4.0) and holds every city of 100,000 people or more plus capitals and larger regional capitals; it is part of the app and is loaded on first use.
- High latitudes use the rule recommended for the latitude, and inside the polar circles the nearest day with real times is used.

## Prayer notifications

Prayer notifications are ordinary local notifications. They are scheduled `PRAYER_SCHEDULE_DAYS` (12) days ahead and topped up every time the app is opened, so the app needs to be opened at least every couple of weeks for them to continue. iOS keeps at most 64 pending notifications per app, so the schedule is capped at 63 prayer notifications and one slot is reserved for the daily Dhikr reminder (`constants/prayer.ts`).

- **Android 12 and newer**: notifications only arrive exactly on time if the user allows "Alarms & reminders" for the app in the phone settings. Battery optimisation can delay them.
- **Android 13 and newer**: the notification question only appears after a notification channel exists, which the app creates before asking.
- Each Adhan recording has its own notification channel, because an Android channel's sound cannot be changed afterwards.
- Turning a prayer off cancels only that prayer's notifications; the rest of the app is untouched.

To test quickly: open Prayer Settings, give a prayer that is less than an hour away an adjustment that moves it to a few minutes from now, then close the app and wait for the notification.

## Adhan audio

No Adhan recording is bundled with this repository. **Only add recordings you have the right to distribute** (your own, or one with a licence that allows it). Nothing is downloaded at runtime and no remote URL is used: an Adhan either sits in the app or does not exist for the app.

1. Put the files in `assets/sounds`:
   - `adhan.mp3` — the full recording (Android notification sound, and playback inside the app)
   - `adhan_fajr.mp3` — optional, a separate recording for Fajr
   - `adhan_short.wav` — a clip of at most 30 seconds for iPhone notifications
   - `adhan_fajr_short.wav` — optional, the Fajr clip for iPhone
2. Point `constants/adhanAudio.ts` at the full recordings, for example `standard: require('../assets/sounds/adhan.mp3')`. This is what the app plays itself.
3. Rebuild. `app.config.ts` registers whatever it finds in `assets/sounds` as notification sounds; a development or production build is required, Expo Go cannot play them.

What the user hears:

- **App closed**: the Adhan is the notification's sound. The phone decides the volume and how long it plays; iOS plays at most 30 seconds, and some Android phones shorten long sounds. Full-length playback in the background cannot be promised on every device.
- **App open**: the app plays the full recording itself, at the volume set with the Adhan volume slider. The slider has no effect on the notification sound.
- **Adhan off, or no recording bundled**: prayer notifications use the normal notification sound. Everything else works exactly the same.

## Adding a language

1. Create `i18n/locales/<code>.ts` that exports a `PartialTranslations` object (missing strings fall back to English).
2. Register it in `i18n/locales/index.ts`.
3. Set `available: true` for the language in `i18n/languages.ts`.

The language picker appears in Settings as soon as more than one language is available. Layouts use start/end spacing, so right-to-left languages do not need layout changes.

## Build with EAS

One-time setup:

```
npm install -g eas-cli
eas login
eas init                # links the project to your Expo account
```

Builds:

```
eas build --platform android --profile preview      # installable APK for testing
eas build --platform android --profile production   # AAB for Google Play
eas build --platform ios --profile production       # for the App Store (Apple Developer account required)
```

Profiles are defined in `eas.json`. Build numbers are managed by EAS (`appVersionSource: remote`, `autoIncrement` for production). The version shown to users is `version` in `app.config.ts`.

## Publishing checklist

- [ ] Replace `APP_IDENTIFIER` in `app.config.ts` with an identifier you own (it cannot be changed after the first release)
- [ ] Review the app name, description and `version` in `app.config.ts`
- [ ] Review the icon, adaptive icon, splash and notification images in `assets/images`
- [ ] Decide on the Adhan: either bundle recordings you are allowed to distribute, or ship without them (the app works either way)
- [ ] Run `npm run typecheck`, `npm run lint` and `npm test`
- [ ] Test on real devices: counting, undo, reset, completion, history, statistics, Easy Mode, dark mode, reminder, restart the app and check that data is kept, airplane mode
- [ ] Test prayer times and the Adhan on a real Android device with a development build: automatic location, a city chosen by hand, method and Asr, adjustments, each prayer notification, the Adhan with the app open and with the app closed, "Alarms & reminders" allowed and denied, and the test button
- [ ] Test with a screen reader (TalkBack, VoiceOver) and with the largest system font size
- [ ] Create production builds with EAS
- [ ] Google Play: store listing, screenshots, content rating, privacy policy URL
- [ ] Google Play: declare the foreground approximate location permission and why it is used (prayer time calculation), and the use of exact alarms for prayer notifications
- [ ] Google Play Data safety: no data collected or shared; location is processed on the device only and never leaves it
- [ ] App Store: listing, screenshots, privacy policy URL, App Privacy answers ("Data Not Collected"; location is used on the device and not collected), and the location purpose string in `app.config.ts`
- [ ] Credit GeoNames (CC BY 4.0) and `adhan` (MIT) in the listing if the store requires it; both are already credited in the app under Settings, About
- [ ] Submit with `eas submit` or upload the builds manually
