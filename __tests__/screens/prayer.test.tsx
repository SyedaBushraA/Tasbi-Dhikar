import { act, fireEvent, screen } from '@testing-library/react-native';

import PrayerScreen from '@/app/(tabs)/prayer';
import { formatLongDay } from '@/components/prayer/labels';
import { getAdhanPlayback, playAdhan, stopAdhan } from '@/services/adhanPlayer';
import type { PrayerLocation } from '@/types';
import { toDayKey } from '@/utils/date';

import { renderWithStore } from '../helpers/render';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
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
  longitude: 78.456,
  timeZone: 'Asia/Kolkata',
  updatedAt: 0,
};

const easyMode = {
  state: { settings: { easyMode: true }, prayer: { location: PLACE, methodConfirmed: true } },
};

afterEach(() => {
  stopAdhan();
});

describe('the prayer times screen', () => {
  /* Easy Mode is for the users who benefit most from seeing the date. */
  it('shows the day in Easy Mode as well', async () => {
    await renderWithStore(<PrayerScreen />, easyMode);

    const today = formatLongDay(toDayKey(Date.now()), 'en');
    expect(screen.getByTestId('prayer-easy-date')).toBeOnTheScreen();
    expect(screen.getByText(today)).toBeOnTheScreen();
  });

  /* The recording runs for minutes, and it starts by itself when a prayer
     arrives while the app is open. */
  it('offers a way to stop the Adhan while it plays', async () => {
    await renderWithStore(<PrayerScreen />, easyMode);
    expect(screen.queryByTestId('prayer-stop-adhan')).toBeNull();

    act(() => {
      playAdhan('standard', 0.8);
    });
    expect(screen.getByTestId('prayer-stop-adhan')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('prayer-stop-adhan'));

    expect(getAdhanPlayback().playing).toBe(false);
    expect(screen.queryByTestId('prayer-stop-adhan')).toBeNull();
  });

  it('offers the same way out on the full screen', async () => {
    await renderWithStore(<PrayerScreen />, {
      state: { prayer: { location: PLACE, methodConfirmed: true } },
    });

    act(() => {
      playAdhan('standard', 0.8);
    });

    expect(screen.getByTestId('prayer-stop-adhan')).toBeOnTheScreen();
  });
});
