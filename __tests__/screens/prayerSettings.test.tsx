import { act, fireEvent, screen } from '@testing-library/react-native';

import PrayerSettingsScreen from '@/app/prayer-settings';
import { translate } from '@/i18n';
import { adhanNotificationSounds } from '@/services/prayerNotifications';
import type { PrayerLocation } from '@/types';

import { renderWithStore } from '../helpers/render';

// Which Adhan recordings a build carries as notification sound is decided by
// the files in it, so the tests say it instead.
jest.mock('@/services/prayerNotifications', () => ({
  ...jest.requireActual<typeof import('@/services/prayerNotifications')>(
    '@/services/prayerNotifications',
  ),
  adhanNotificationSounds: jest.fn(() => ({ standard: false, fajr: false })),
}));

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      navigate: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
      canDismiss: jest.fn(() => false),
      dismissTo: jest.fn(),
    },
    Stack: { Screen: () => null },
    useLocalSearchParams: () => ({}),
    useFocusEffect: (effect: () => undefined | (() => void)) => useEffect(effect, [effect]),
  };
});

const PLACE: PrayerLocation = {
  source: 'city',
  name: 'Hyderabad',
  region: 'Telangana',
  countryCode: 'IN',
  latitude: 17.384,
  longitude: 78.4564,
  timeZone: 'Asia/Kolkata',
  updatedAt: 0,
};

const mode = (name: 'off' | 'notification' | 'adhan') =>
  translate('en', `prayerSettings.alerts.modes.${name}`);

const ALL_ON = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };

const notificationSounds = jest.mocked(adhanNotificationSounds);

beforeEach(() => {
  notificationSounds.mockReturnValue({ standard: false, fajr: false });
});

/*
 * One question per prayer: off, a notification, or the Adhan. The three stored
 * settings behind it must always agree, which is what these tests check.
 */
describe('the prayer alerts settings', () => {
  it('turns every prayer on with the Adhan in one choice', async () => {
    const harness = await renderWithStore(<PrayerSettingsScreen />, {
      state: { prayer: { location: PLACE } },
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId(`prayer-alerts-all-${'adhan'}`));
    });

    const { prayer } = harness.store.getState();
    expect(prayer.adhanEnabled).toBe(true);
    expect(Object.values(prayer.notifications).every(Boolean)).toBe(true);
    expect(Object.values(prayer.adhan).every(Boolean)).toBe(true);
  });

  it('gives one prayer the plain notification without touching the others', async () => {
    const harness = await renderWithStore(<PrayerSettingsScreen />, {
      state: { prayer: { location: PLACE } },
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-alerts-all-adhan'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-alerts-dhuhr-notification'));
    });

    const { prayer } = harness.store.getState();
    expect(prayer.notifications.dhuhr).toBe(true);
    expect(prayer.adhan.dhuhr).toBe(false);
    expect(prayer.adhan.fajr).toBe(true);
    // Other prayers still play the Adhan, so the master switch stays on.
    expect(prayer.adhanEnabled).toBe(true);
  });

  it('turns a prayer off completely', async () => {
    const harness = await renderWithStore(<PrayerSettingsScreen />, {
      state: { prayer: { location: PLACE } },
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-alerts-all-adhan'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-alerts-fajr-off'));
    });

    const { prayer } = harness.store.getState();
    expect(prayer.notifications.fajr).toBe(false);
    expect(prayer.adhan.fajr).toBe(false);
  });

  /* The Adhan can only be the sound of a notification where the build carries
     one as a notification sound; promising it everywhere is an overclaim. */
  it('promises the Adhan while Tasbi is closed only where the phone can play it', async () => {
    notificationSounds.mockReturnValue({ standard: true, fajr: false });
    await renderWithStore(<PrayerSettingsScreen />, { state: { prayer: { location: PLACE } } });

    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-alerts-all-adhan'));
    });

    expect(
      screen.getByText(translate('en', 'prayerSettings.adhan.platformNote')),
    ).toBeOnTheScreen();
  });

  it('says that the Adhan only plays in the app when there is no notification sound', async () => {
    await renderWithStore(<PrayerSettingsScreen />, { state: { prayer: { location: PLACE } } });

    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-alerts-all-adhan'));
    });

    expect(
      screen.getByText(translate('en', 'prayerSettings.adhan.inAppOnlyNote')),
    ).toBeOnTheScreen();
    expect(screen.queryByText(translate('en', 'prayerSettings.adhan.platformNote'))).toBeNull();
  });

  /* Alerts the phone turned off must not disappear without a word. */
  it('explains alerts that were turned off because the permission was withdrawn', async () => {
    await renderWithStore(<PrayerSettingsScreen />, {
      state: { prayer: { location: PLACE, alertsBlocked: true } },
    });

    expect(screen.getByTestId('prayer-alerts-blocked')).toBeOnTheScreen();
    expect(screen.getByText(translate('en', 'prayerSettings.alerts.blockedMessage'))).toBeOnTheScreen();
  });

  it('drops the explanation as soon as the user chooses again', async () => {
    const harness = await renderWithStore(<PrayerSettingsScreen />, {
      state: { prayer: { location: PLACE, alertsBlocked: true } },
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-alerts-all-notification'));
    });

    expect(harness.store.getState().prayer.alertsBlocked).toBe(false);
    expect(screen.queryByTestId('prayer-alerts-blocked')).toBeNull();
  });

  it('shows the three choices and says when no place is set yet', async () => {
    await renderWithStore(<PrayerSettingsScreen />, {});

    expect(screen.getAllByText(mode('off')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(mode('notification')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(mode('adhan')).length).toBeGreaterThan(0);
    expect(screen.getByText(translate('en', 'prayerSettings.alerts.needLocation'))).toBeTruthy();
  });

  /* A refused permission must leave nothing behind: a chip showing the Adhan
     while no notification can arrive is a choice the user never made. */
  it('puts the Adhan back when the notification permission is refused', async () => {
    const harness = await renderWithStore(<PrayerSettingsScreen />, {
      state: { prayer: { location: PLACE, notifications: ALL_ON } },
    });
    harness.services.prayer.syncAlerts.mockResolvedValue('denied');
    const before = harness.store.getState().prayer;

    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-alerts-all-adhan'));
    });

    const after = harness.store.getState().prayer;
    expect(after.adhanEnabled).toBe(before.adhanEnabled);
    expect(after.adhan).toEqual(before.adhan);
    expect(after.notifications).toEqual(before.notifications);
    expect(screen.getByTestId('prayer-alerts-all-notification')).toBeChecked();
    expect(screen.getByTestId('prayer-alerts-all-adhan')).not.toBeChecked();
  });

  it('leaves a fresh install off when the permission is refused', async () => {
    const harness = await renderWithStore(<PrayerSettingsScreen />, {
      state: { prayer: { location: PLACE } },
    });
    harness.services.prayer.syncAlerts.mockResolvedValue('denied');

    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-alerts-all-adhan'));
    });

    const { prayer } = harness.store.getState();
    expect(Object.values(prayer.notifications).some(Boolean)).toBe(false);
    // The Adhan can only sound with a notification, so its switch stays off too.
    expect(prayer.adhanEnabled).toBe(false);
    expect(screen.getByTestId('prayer-alerts-all-off')).toBeChecked();
  });

  it('explains a refused permission where the choice was made', async () => {
    const harness = await renderWithStore(<PrayerSettingsScreen />, {
      state: { prayer: { location: PLACE } },
    });
    harness.services.prayer.syncAlerts.mockResolvedValue('denied');

    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-alerts-fajr-notification'));
    });

    expect(screen.getByTestId('prayer-alerts-notice')).toBeOnTheScreen();
    expect(
      screen.getByText(translate('en', 'prayerSettings.notifications.deniedMessage')),
    ).toBeOnTheScreen();
  });

  /* Without a place nothing can be planned, so the chips wait rather than
     change settings behind a user who sees no answer to their tap. */
  it('keeps the choices readable but out of reach until a place is set', async () => {
    const harness = await renderWithStore(<PrayerSettingsScreen />, {
      state: { prayer: { notifications: { fajr: true } } },
    });

    expect(screen.getByTestId('prayer-alerts-fajr-notification')).toBeChecked();
    expect(screen.getByTestId('prayer-alerts-fajr-adhan')).toBeDisabled();

    const before = harness.store.getState().prayer;
    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-alerts-fajr-adhan'));
    });

    // Nothing was stored at all: the same object, not merely the same values.
    expect(harness.store.getState().prayer).toBe(before);
  });

  it('names the prayer in the chip a screen reader reads out', async () => {
    await renderWithStore(<PrayerSettingsScreen />, { state: { prayer: { location: PLACE } } });

    const spoken = translate('en', 'prayerSettings.alerts.a11y.option', {
      mode: mode('adhan'),
      prayer: translate('en', 'prayer.names.fajr'),
    });

    expect(screen.getByRole('radio', { name: spoken })).toBeOnTheScreen();
  });

  it('says what the volume slider changes', async () => {
    await renderWithStore(<PrayerSettingsScreen />, { state: { prayer: { location: PLACE } } });

    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-alerts-all-adhan'));
    });

    expect(
      screen.getByText(translate('en', 'prayerSettings.adhan.volumeCaption')),
    ).toBeOnTheScreen();
  });
});

/* Easy Mode asks once for all five prayers, but it must never point at a list
   that is not there. */
describe('the prayer alerts settings in Easy Mode', () => {
  it('keeps to the one row while every prayer is the same', async () => {
    await renderWithStore(<PrayerSettingsScreen />, {
      state: { prayer: { location: PLACE }, settings: { easyMode: true } },
    });

    expect(screen.getByTestId('prayer-alerts-show-each')).toBeOnTheScreen();
    expect(screen.queryByTestId('prayer-alerts-fajr')).toBeNull();
    expect(screen.queryByText(translate('en', 'prayerSettings.alerts.mixed'))).toBeNull();
  });

  it('opens the list when the prayers are not all the same', async () => {
    await renderWithStore(<PrayerSettingsScreen />, {
      state: {
        prayer: { location: PLACE, notifications: { fajr: true } },
        settings: { easyMode: true },
      },
    });

    expect(screen.getByTestId('prayer-alerts-fajr')).toBeOnTheScreen();
    expect(screen.queryByTestId('prayer-alerts-show-each')).toBeNull();
    expect(screen.getByText(translate('en', 'prayerSettings.alerts.mixed'))).toBeOnTheScreen();
  });

  it('shows the list as soon as it is asked for', async () => {
    await renderWithStore(<PrayerSettingsScreen />, {
      state: { prayer: { location: PLACE }, settings: { easyMode: true } },
    });

    fireEvent.press(screen.getByTestId('prayer-alerts-show-each'));

    expect(screen.getByTestId('prayer-alerts-isha')).toBeOnTheScreen();
  });
});
