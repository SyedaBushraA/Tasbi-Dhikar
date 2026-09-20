import { act, fireEvent, screen } from '@testing-library/react-native';

import PrayerSettingsScreen from '@/app/prayer-settings';
import { translate } from '@/i18n';
import type { PrayerLocation } from '@/types';

import { renderWithStore } from '../helpers/render';

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

  it('shows the three choices and says when no place is set yet', async () => {
    await renderWithStore(<PrayerSettingsScreen />, {});

    expect(screen.getAllByText(mode('off')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(mode('notification')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(mode('adhan')).length).toBeGreaterThan(0);
    expect(screen.getByText(translate('en', 'prayerSettings.alerts.needLocation'))).toBeTruthy();
  });
});
